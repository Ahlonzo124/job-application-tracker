import { NextResponse } from "next/server";

export const runtime = "nodejs"; // safer for server-side parsing libs if used downstream

async function safeReadJson(res: Response) {
  const text = await res.text();
  if (!text) return { __empty: true };
  try {
    return JSON.parse(text);
  } catch {
    return { __nonJson: true, text };
  }
}

function isNonEmptyString(x: unknown, min = 1) {
  return typeof x === "string" && x.trim().length >= min;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const base = new URL(req.url);
    const extractUrl = new URL("/api/extract-job", base);
    const aiUrl = new URL("/api/ai/parse-job", base);

    const inputUrl = isNonEmptyString(body?.url, 5) ? body.url.trim() : "";
    const pastedText = isNonEmptyString(body?.pastedText, 30) ? body.pastedText.trim() : "";
    const pageTitle = isNonEmptyString(body?.pageTitle, 1) ? body.pageTitle.trim() : undefined;

    // ✅ Require at least one input
    if (!inputUrl && !pastedText) {
      return NextResponse.json(
        {
          ok: false,
          step: "input",
          error: "Please provide a Job Posting URL or paste a job description.",
        },
        { status: 400 }
      );
    }

    // -------------------------
    // 1) EXTRACT (ONLY if URL)
    // -------------------------
    let extractedText = pastedText; // ✅ fallback path uses pasted text directly
    let extractedUrl = inputUrl;
    let extractJson: any = null;

    if (!extractedText && inputUrl) {
      // Try POST first (newer style)
      let extractRes = await fetch(extractUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputUrl }),
      });

      // If extractor only supports GET, handle that gracefully
      if (extractRes.status === 405) {
        const extractGet = new URL(extractUrl);
        extractGet.searchParams.set("url", inputUrl);
        extractRes = await fetch(extractGet.toString(), { method: "GET" });
      }

      extractJson = await safeReadJson(extractRes);

      if (
        !extractRes.ok ||
        extractJson?.error ||
        extractJson?.__nonJson ||
        extractJson?.__empty
      ) {
        return NextResponse.json(
          {
            ok: false,
            step: "extract",
            status: extractRes.status,
            error:
              extractJson?.error ||
              (extractJson?.__empty ? "Extract route returned empty response." : null) ||
              (extractJson?.__nonJson ? "Extract route returned non-JSON response." : null) ||
              "Extract failed.",
            extract: extractJson,
          },
          { status: 400 }
        );
      }

      const text = extractJson?.extractedText;
      if (!isNonEmptyString(text, 30)) {
        return NextResponse.json(
          {
            ok: false,
            step: "extract",
            error: "No extractedText returned (or too short).",
            extract: extractJson,
          },
          { status: 400 }
        );
      }

      extractedText = text.trim();
      extractedUrl = isNonEmptyString(extractJson?.url, 5) ? extractJson.url : inputUrl;
    }

    // Best URL for AI (optional)
    const bestUrl = inputUrl || extractedUrl || "";

    // -------------------------
    // 2) AI PARSE
    // -------------------------
    const aiRes = await fetch(aiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        extractedText,
        url: bestUrl || null,
        pageTitle: pageTitle ?? extractJson?.titleGuess ?? undefined,
      }),
    });

    const aiJson = await safeReadJson(aiRes);

    if (!aiRes.ok || aiJson?.ok === false || aiJson?.__nonJson || aiJson?.__empty) {
      return NextResponse.json(
        {
          ok: false,
          step: "ai",
          status: aiRes.status,
          error:
            aiJson?.error ||
            (aiJson?.__empty ? "AI route returned empty response." : null) ||
            (aiJson?.__nonJson ? "AI route returned non-JSON response." : null) ||
            "AI parse failed.",
          extract: extractJson,
          ai: aiJson,
        },
        { status: 400 }
      );
    }

    // Attach bestUrl so frontend always has it
    const aiData = aiJson?.data ?? null;
    if (aiData && typeof aiData === "object") {
      (aiData as any).url = (aiData as any).url || bestUrl || null;
      aiJson.data = aiData;
    }

    return NextResponse.json({
      ok: true,
      extract: extractJson,
      ai: aiJson,
      bestUrl,
      used: pastedText ? "pastedText" : "url",
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, step: "server", error: err?.message ?? "Unknown server error." },
      { status: 500 }
    );
  }
}
