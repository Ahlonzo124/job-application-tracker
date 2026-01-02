import { NextResponse } from "next/server";
import { z } from "zod";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import * as cheerio from "cheerio";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const runtime = "nodejs";

const BodySchema = z.object({
  url: z.string().url(),
});

function cleanText(s: string) {
  return s
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchHtml(url: string) {
  const res = await fetch(url, {
    method: "GET",
    // Some job sites block default fetch user-agent; this helps.
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    // Helps avoid caching weirdness
    cache: "no-store",
  });

  const html = await res.text();
  return { res, html };
}

function extractWithReadability(html: string, url: string) {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  return article?.textContent?.trim() || "";
}

function extractWithCheerio(html: string) {
  const $ = cheerio.load(html);

  // Remove obvious junk
  $("script, style, noscript, iframe, svg").remove();

  // Prefer main-ish containers
  const candidates = [
    "main",
    "article",
    '[role="main"]',
    ".job",
    ".job-description",
    ".description",
    "#job",
    "#job-description",
  ];

  let text = "";
  for (const sel of candidates) {
    const t = $(sel).text().trim();
    if (t.length > text.length) text = t;
  }

  // Fallback: whole body
  if (!text) text = $("body").text().trim();

  return text;
}

/**
 * ✅ POST /api/extract-job
 * Body: { url }
 */
export async function POST(req: Request) {
  // ✅ Keep auth protection (matches your security model)
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = BodySchema.parse(await req.json());
    const url = body.url.trim();

    const { res, html } = await fetchHtml(url);

    if (!res.ok || !html || html.trim().length < 50) {
      return NextResponse.json(
        { ok: false, error: `Failed to fetch page (HTTP ${res.status}).` },
        { status: 400 }
      );
    }

    // Try Readability first
    let extractedText = "";
    try {
      extractedText = extractWithReadability(html, url);
    } catch {
      extractedText = "";
    }

    // Cheerio fallback
    if (!extractedText || extractedText.length < 200) {
      extractedText = extractWithCheerio(html);
    }

    extractedText = cleanText(extractedText);

    if (!extractedText || extractedText.length < 200) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not extract enough readable text from this page. Try the Paste Job Description fallback.",
        },
        { status: 400 }
      );
    }

    // Title guess (best effort)
    let titleGuess: string | undefined;
    try {
      const dom = new JSDOM(html);
      titleGuess = dom.window.document.title?.trim() || undefined;
    } catch {
      titleGuess = undefined;
    }

    return NextResponse.json({
      ok: true,
      url,
      titleGuess,
      extractedText,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 400 }
    );
  }
}

/**
 * ✅ GET /api/extract-job?url=...
 * Optional convenience so you *never* hit 405 again if something calls GET.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  // Same auth protection
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!url) {
    return NextResponse.json({ ok: false, error: "Missing url" }, { status: 400 });
  }

  // Reuse POST logic by calling it directly is annoying here; keep it simple:
  try {
    const parsed = BodySchema.parse({ url });
    const { res, html } = await fetchHtml(parsed.url);

    if (!res.ok || !html || html.trim().length < 50) {
      return NextResponse.json(
        { ok: false, error: `Failed to fetch page (HTTP ${res.status}).` },
        { status: 400 }
      );
    }

    let extractedText = "";
    try {
      extractedText = extractWithReadability(html, parsed.url);
    } catch {
      extractedText = "";
    }

    if (!extractedText || extractedText.length < 200) {
      extractedText = extractWithCheerio(html);
    }

    extractedText = cleanText(extractedText);

    if (!extractedText || extractedText.length < 200) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not extract enough readable text from this page. Try the Paste Job Description fallback.",
        },
        { status: 400 }
      );
    }

    let titleGuess: string | undefined;
    try {
      const dom = new JSDOM(html);
      titleGuess = dom.window.document.title?.trim() || undefined;
    } catch {
      titleGuess = undefined;
    }

    return NextResponse.json({
      ok: true,
      url: parsed.url,
      titleGuess,
      extractedText,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 400 }
    );
  }
}
