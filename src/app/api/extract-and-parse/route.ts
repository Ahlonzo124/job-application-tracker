import { NextResponse } from "next/server";

async function safeReadJson(res: Response) {
  const text = await res.text();
  if (!text) return { __empty: true };
  try {
    return JSON.parse(text);
  } catch {
    return { __nonJson: true, text };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const base = new URL(req.url);
    const extractUrl = new URL("/api/extract-job", base);
    const aiUrl = new URL("/api/ai/parse-job", base);

    // Prefer the URL user typed
    const inputUrl =
      body?.url && typeof body.url === "string" ? body.url.trim() : "";

    // 1) Extract
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

    const extractedText = (extractJson as any)?.extractedText;
    if (
      !extractedText ||
      typeof extractedText !== "string" ||
      extractedText.trim().length < 30
    ) {
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

    // URL from extractor (if present)
    const extractedUrl =
      (extractJson as any)?.url && typeof (extractJson as any)?.url === "string"
        ? (extractJson as any).url
        : "";

    // Best URL for AI + UI + saving
    const bestUrl = inputUrl || extractedUrl || "";

    // 2) AI parse (send URL on purpose)
    const aiRes = await fetch(aiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        extractedText,
        url: bestUrl || null,
        pageTitle: (extractJson as any)?.titleGuess ?? undefined,
      }),
    });

    const aiJson = await safeReadJson(aiRes);

    if (
      !aiRes.ok ||
      (aiJson as any)?.ok === false ||
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
            ((aiJson as any)?.__nonJson
              ? "AI route returned non-JSON response."
              : null) ||
            "AI parse failed.",
          extract: extractJson,
          ai: aiJson,
        },
        { status: 400 }
      );
    }

    // Attach bestUrl so the frontend can always display it
    const aiData = (aiJson as any)?.data ?? null;
    if (aiData && typeof aiData === "object") {
      aiData.url = aiData.url || bestUrl || null;
      (aiJson as any).data = aiData;
    }

    return NextResponse.json({
      ok: true,
      extract: extractJson,
      ai: aiJson,
      bestUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, step: "server", error: err?.message ?? "Unknown server error." },
      { status: 500 }
    );
  }
}
