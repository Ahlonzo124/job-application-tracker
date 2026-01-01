import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    return v.map((x) => String(x)).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Normalize URLs so the same job link doesn't get saved twice
 * - removes #hash
 * - removes common tracking query params (utm_*, etc.)
 * - removes trailing slash
 */
function normalizeUrl(raw: string | null): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;

  try {
    const u = new URL(s);

    // drop hash
    u.hash = "";

    // remove tracking params
    const badKeys = new Set([
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "gclid",
      "fbclid",
      "mc_cid",
      "mc_eid",
      "ref",
      "referrer",
      "source",
    ]);

    // remove utm_* and common trackers
    for (const key of Array.from(u.searchParams.keys())) {
      if (key.toLowerCase().startsWith("utm_")) u.searchParams.delete(key);
      if (badKeys.has(key.toLowerCase())) u.searchParams.delete(key);
    }

    // normalize pathname trailing slash
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }

    return u.toString();
  } catch {
    // if URL() fails, just return trimmed string
    return s;
  }
}

/* ------------------------ HANDLER ------------------------ */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const base = new URL(req.url);

    // Your existing endpoints
    const extractUrl = new URL("/api/extract-job", base);
    const aiUrl = new URL("/api/ai/parse-job", base);

    // Prefer user-provided URL
    const inputUrl =
      body?.url && typeof body.url === "string" ? body.url.trim() : "";

    /* ---------- 1) EXTRACT ---------- */
    const extractRes = await fetch(extractUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const extractJson = await safeReadJson(extractRes);

    if (
      !extractRes.ok ||
      (extractJson as any)?.error ||
      (extractJson as any)?.__nonJson ||
      (extractJson as any)?.__empty
    ) {
      return withCors(
        NextResponse.json(
          {
            ok: false,
            step: "extract",
            status: extractRes.status,
            error:
              (extractJson as any)?.error ||
              ((extractJson as any)?.__empty
                ? "Extract route returned empty response."
                : null) ||
              ((extractJson as any)?.__nonJson
                ? "Extract route returned non-JSON response."
                : null) ||
              "Extract failed.",
            extract: extractJson,
          },
          { status: 400 }
        )
      );
    }

    const extractedText = (extractJson as any)?.extractedText;
    if (
      !extractedText ||
      typeof extractedText !== "string" ||
      extractedText.trim().length < 30
    ) {
      return withCors(
        NextResponse.json(
          {
            ok: false,
            step: "extract",
            error: "No extractedText returned (or too short).",
            extract: extractJson,
          },
          { status: 400 }
        )
      );
    }

    // Your extractor doesn’t currently return url, so this is typically ""
    const extractedUrl =
      (extractJson as any)?.url && typeof (extractJson as any)?.url === "string"
        ? (extractJson as any).url
        : "";

    const bestUrl = inputUrl || extractedUrl || "";

    /* ---------- 2) AI PARSE ---------- */
    const aiRes = await fetch(aiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        extractedText,
        url: bestUrl || undefined,
        pageTitle: (extractJson as any)?.titleGuess ?? undefined,
      }),
    });

    const aiJson = await safeReadJson(aiRes);

    if (
      !aiRes.ok ||
      (aiJson as any)?.ok === false ||
      (aiJson as any)?.error ||
      (aiJson as any)?.__nonJson ||
      (aiJson as any)?.__empty
    ) {
      return withCors(
        NextResponse.json(
          {
            ok: false,
            step: "ai",
            status: aiRes.status,
            error:
              (aiJson as any)?.error ||
              ((aiJson as any)?.__empty ? "AI route returned empty response." : null) ||
              ((aiJson as any)?.__nonJson
                ? "AI route returned non-JSON response."
                : null) ||
              "AI parse failed.",
            extract: extractJson,
            ai: aiJson,
          },
          { status: 400 }
        )
      );
    }

    const aiData = (aiJson as any)?.data;

    // Required by DB (non-null). AI can return null, so we guard.
    const company = asString(aiData?.company) ?? "Unknown Company";
    const title = asString(aiData?.title) ?? "Unknown Title";
    const location = asString(aiData?.location);

    // Normalize URL for duplicate detection + storage
    const rawUrl = asString(aiData?.url) ?? (bestUrl ? bestUrl : null);
    const finalUrl = normalizeUrl(rawUrl);

    /* ---------- 3) DUPLICATE CHECK ---------- */
    // A) Strong match: same normalized URL
    if (finalUrl) {
      const existing = await prisma.application.findFirst({
        where: { url: finalUrl },
      });

      if (existing) {
        return withCors(
          NextResponse.json({
            ok: true,
            duplicate: true,
            application: existing,
            reason: "URL_MATCH",
          })
        );
      }
    }

    // B) Fallback match: company + title (+ location)
    const existingByFields = await prisma.application.findFirst({
      where: {
        company,
        title,
        ...(location ? { location } : {}),
      },
    });

    if (existingByFields) {
      return withCors(
        NextResponse.json({
          ok: true,
          duplicate: true,
          application: existingByFields,
          reason: "FIELDS_MATCH",
        })
      );
    }

    /* ---------- 4) SAVE ---------- */
    const created = await prisma.application.create({
      data: {
        company,
        title,

        location: location ?? null,
        url: finalUrl ?? null,

        jobType: asString(aiData?.jobType),
        workMode: asString(aiData?.workMode),
        seniority: asString(aiData?.seniority),

        salaryMin: asNumber(aiData?.salaryMin),
        salaryMax: asNumber(aiData?.salaryMax),
        salaryCurrency: asString(aiData?.salaryCurrency),
        salaryPeriod: asString(aiData?.salaryPeriod),

        descriptionSummary: asString(aiData?.descriptionSummary),

        keyRequirementsJson: (() => {
          const arr = asStringArray(aiData?.keyRequirements);
          return arr.length ? JSON.stringify(arr) : null;
        })(),
        keyResponsibilitiesJson: (() => {
          const arr = asStringArray(aiData?.keyResponsibilities);
          return arr.length ? JSON.stringify(arr) : null;
        })(),

        stage: "APPLIED",
        appliedDate: new Date(),
      },
    });

    return withCors(
      NextResponse.json({
        ok: true,
        duplicate: false,
        application: created,
      })
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
