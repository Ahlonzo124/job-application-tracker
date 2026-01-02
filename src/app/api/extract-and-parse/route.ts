import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function safeReadJson(res: Response) {
  const text = await res.text();
  if (!text) return { __empty: true };
  try {
    return JSON.parse(text);
  } catch {
    return { __nonJson: true, text };
  }
}

function isNonEmptyString(v: any) {
  return typeof v === "string" && v.trim().length > 0;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const base = new URL(req.url);
    const extractUrl = new URL("/api/extract-job", base);
    const aiUrl = new URL("/api/ai/parse-job", base);

    // ✅ Forward auth cookies so internal route calls are authenticated
    const cookie = req.headers.get("cookie") ?? "";
    const forwardHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (cookie) forwardHeaders.cookie = cookie;

    // Inputs from UI
    const inputUrl = isNonEmptyString(body?.url) ? body.url.trim() : "";
    const pastedText = isNonEmptyString(body?.pastedText) ? body.pastedText.trim() : "";
    const pageTitle = isNonEmptyString(body?.pageTitle) ? body.pageTitle.trim() : undefined;

    // Decide mode
    const hasPasted = pastedText.length >= 50; // your UI requires decent length
    const hasUrl = inputUrl.length > 0;

    if (!hasPasted && !hasUrl) {
      return NextResponse.json(
        {
          ok: false,
          step: "validate",
          error: "Provide either a Job Posting URL or paste the Job Description text.",
        },
        { status: 400 }
      );
    }

    // =========================
    // 1) Get extractedText
    // =========================
    let extractedText = "";
    let extractPayload: any = null;

    if (hasPasted) {
      // ✅ Paste fallback: do NOT call extract-job
      extractedText = pastedText;
      extractPayload = {
        ok: true,
        source: "pastedText",
        url: hasUrl ? inputUrl : null,
        titleGuess: pageTitle ?? null,
      };
    } else {
      // ✅ URL mode: call extract-job
      const extractRes = await fetch(extractUrl, {
        method: "POST",
        headers: forwardHeaders,
        body: JSON.stringify({ url: inputUrl }),
      });

      const extractJson = await safeReadJson(extractRes);
      extractPayload = extractJson;

      if (
        !extractRes.ok ||
        (extractJson as any)?.ok === false ||
        (extractJson as any)?.error ||
        (extractJson as any)?.__nonJson ||
        (extractJson as any)?.__empty
      ) {
        return NextResponse.json(
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
        );
      }

      extractedText = (extractJson as any)?.extractedText ?? "";
      if (!isNonEmptyString(extractedText) || extractedText.trim().length < 50) {
        return NextResponse.json(
          {
            ok: false,
            step: "extract",
            error: "No extractedText returned (or too short). Try Paste Job Description fallback.",
            extract: extractJson,
          },
          { status: 400 }
        );
      }
    }

    // Best URL for AI/UI
    const extractedUrl =
      extractPayload && typeof extractPayload?.url === "string" ? extractPayload.url : "";
    const bestUrl = inputUrl || extractedUrl || "";

    // =========================
    // 2) AI parse
    // =========================
    const aiRes = await fetch(aiUrl, {
      method: "POST",
      headers: forwardHeaders,
      body: JSON.stringify({
        extractedText,
        url: bestUrl || null,
        pageTitle: pageTitle ?? extractPayload?.titleGuess ?? undefined,
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
      return NextResponse.json(
        {
          ok: false,
          step: "ai",
          status: aiRes.status,
          error:
            (aiJson as any)?.error ||
            ((aiJson as any)?.__empty ? "AI route returned empty response." : null) ||
            ((aiJson as any)?.__nonJson ? "AI route returned non-JSON response." : null) ||
            "AI parse failed.",
          extract: extractPayload,
          ai: aiJson,
        },
        { status: 400 }
      );
    }

    // Attach bestUrl so frontend can show it
    const aiData = (aiJson as any)?.data ?? null;
    if (aiData && typeof aiData === "object") {
      aiData.url = aiData.url || bestUrl || null;
      (aiJson as any).data = aiData;
    }

    return NextResponse.json({
      ok: true,
      bestUrl,
      extract: extractPayload,
      ai: aiJson,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, step: "server", error: err?.message ?? "Unknown server error." },
      { status: 500 }
    );
  }
}
