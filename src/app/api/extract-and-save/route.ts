import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const runtime = "nodejs";

/* ------------------------ CORS HELPERS ------------------------ */
function withCors(resp: Response) {
  const headers = new Headers(resp.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(resp.body, { status: resp.status, headers });
}

export async function OPTIONS() {
  return withCors(new Response(null, { status: 204 }));
}

/* ------------------------ UTILS ------------------------ */
async function safeReadJson(res: Response) {
  const text = await res.text();
  if (!text) return { __empty: true };
  try {
    return JSON.parse(text);
  } catch {
    return { __nonJson: true, text };
  }
}

function asString(v: any): string | null {
  if (typeof v === "string") {
    const t = v.trim();
    return t ? t : null;
  }
  return null;
}

function asNumber(v: any): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asStringArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) {
    return v.map(String).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function normalizeUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    u.hash = "";
    for (const k of [...u.searchParams.keys()]) {
      if (k.toLowerCase().startsWith("utm_")) u.searchParams.delete(k);
    }
    if (u.pathname.endsWith("/") && u.pathname.length > 1) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return raw;
  }
}

/* ------------------------ HANDLER ------------------------ */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = Number((session?.user as any)?.id);
    if (!userId) {
      return withCors(
        NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
      );
    }

    const body = await req.json().catch(() => ({}));

    const base = new URL(req.url);
    const extractUrl = new URL("/api/extract-job", base);
    const aiUrl = new URL("/api/ai/parse-job", base);

    // ✅ CRITICAL FIX: forward cookies
    const cookie = req.headers.get("cookie") ?? "";
    const forwardHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (cookie) forwardHeaders.cookie = cookie;

    const inputUrl = asString(body?.url);
    const pastedText = asString(body?.pastedText);
    const pageTitle = asString(body?.pageTitle);

    if (!inputUrl && !pastedText) {
      return withCors(
        NextResponse.json(
          { ok: false, step: "input", error: "Provide a URL or pastedText." },
          { status: 400 }
        )
      );
    }

    /* ---------- 1) EXTRACT ---------- */
    let extractedText = pastedText;
    let extractJson: any = null;

    if (!extractedText && inputUrl) {
      const extractRes = await fetch(extractUrl, {
        method: "POST",
        headers: forwardHeaders,
        body: JSON.stringify({ url: inputUrl }),
      });

      extractJson = await safeReadJson(extractRes);

      if (
        !extractRes.ok ||
        extractJson?.error ||
        extractJson?.__nonJson ||
        extractJson?.__empty
      ) {
        return withCors(
          NextResponse.json(
            {
              ok: false,
              step: "extract",
              status: extractRes.status,
              error:
                extractJson?.error ||
                "Extract failed. Try paste fallback.",
              extract: extractJson,
            },
            { status: 400 }
          )
        );
      }

      extractedText = extractJson?.extractedText;
      if (!extractedText || extractedText.trim().length < 50) {
        return withCors(
          NextResponse.json(
            {
              ok: false,
              step: "extract",
              error: "Extracted text too short. Try paste fallback.",
            },
            { status: 400 }
          )
        );
      }
    }

    /* ---------- 2) AI PARSE ---------- */
    const bestUrl = inputUrl || extractJson?.url || "";

    const aiRes = await fetch(aiUrl, {
      method: "POST",
      headers: forwardHeaders,
      body: JSON.stringify({
        extractedText,
        url: bestUrl || null,
        pageTitle: pageTitle ?? extractJson?.titleGuess ?? undefined,
      }),
    });

    const aiJson = await safeReadJson(aiRes);

    if (
      !aiRes.ok ||
      aiJson?.ok === false ||
      aiJson?.error ||
      aiJson?.__nonJson ||
      aiJson?.__empty
    ) {
      return withCors(
        NextResponse.json(
          {
            ok: false,
            step: "ai",
            status: aiRes.status,
            error: aiJson?.error || "AI parse failed.",
          },
          { status: 400 }
        )
      );
    }

    const aiData = aiJson?.data || {};

    /* ---------- 3) DUPLICATE + SAVE ---------- */
    const company = asString(aiData.company) ?? "Unknown Company";
    const title = asString(aiData.title) ?? "Unknown Title";
    const location = asString(aiData.location);
    const finalUrl = normalizeUrl(asString(aiData.url) ?? bestUrl);

    if (finalUrl) {
      const existing = await prisma.application.findFirst({
        where: { userId, url: finalUrl },
      });
      if (existing) {
        return withCors(
          NextResponse.json({ ok: true, duplicate: true, application: existing })
        );
      }
    }

    const created = await prisma.application.create({
      data: {
        userId,
        company,
        title,
        location,
        url: finalUrl,
        jobType: asString(aiData.jobType),
        workMode: asString(aiData.workMode),
        seniority: asString(aiData.seniority),
        salaryMin: asNumber(aiData.salaryMin),
        salaryMax: asNumber(aiData.salaryMax),
        salaryCurrency: asString(aiData.salaryCurrency),
        salaryPeriod: asString(aiData.salaryPeriod),
        descriptionSummary: asString(aiData.descriptionSummary),
        keyRequirementsJson: JSON.stringify(asStringArray(aiData.keyRequirements)),
        keyResponsibilitiesJson: JSON.stringify(asStringArray(aiData.keyResponsibilities)),
        stage: "APPLIED",
        sortOrder: 0,
        appliedDate: new Date(),
      },
    });

    return withCors(
      NextResponse.json({ ok: true, duplicate: false, application: created })
    );
  } catch (err: any) {
    return withCors(
      NextResponse.json(
        { ok: false, step: "server", error: err?.message ?? "Unknown server error." },
        { status: 500 }
      )
    );
  }
}
