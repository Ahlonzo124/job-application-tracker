import { NextResponse } from "next/server";
import { z } from "zod";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import * as cheerio from "cheerio";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
    });

    const contentType = res.headers.get("content-type") || "";
    const html = await res.text();

    return { res, html, contentType };
  } finally {
    clearTimeout(timeout);
  }
}

function extractWithReadability(html: string, url: string) {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  return article?.textContent?.trim() || "";
}

function extractWithCheerio(html: string) {
  const $ = cheerio.load(html);

  $("script, style, noscript, iframe, svg").remove();

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

  if (!text) text = $("body").text().trim();
  return text;
}

function jsonError(message: string, status = 400, extra?: any) {
  return NextResponse.json(
    { ok: false, error: message, ...(extra ? { extra } : {}) },
    { status }
  );
}

/**
 * POST /api/extract-job
 * Body: { url }
 */
export async function POST(req: Request) {
  // Auth required
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return jsonError("Unauthorized", 401);
  }

  let url: string;

  // Always return JSON even if parsing fails
  try {
    const body = BodySchema.parse(await req.json());
    url = body.url.trim();
  } catch (err: any) {
    return jsonError(err?.message ?? "Invalid request body.", 400);
  }

  try {
    const { res, html, contentType } = await fetchHtml(url);

    // If we got blocked or redirected to something non-HTML, return a clear JSON error.
    if (!res.ok) {
      return jsonError(`Failed to fetch page (HTTP ${res.status}).`, 400, {
        url,
        contentType,
      });
    }

    if (!html || html.trim().length < 50) {
      return jsonError("Fetched page returned empty HTML.", 400, { url, contentType });
    }

    // Some sites return JSON or a bot-block page; still try, but be explicit.
    // (We don't hard-fail on contentType because many sites lie about it.)
    let extractedText = "";

    // 1) Readability
    try {
      extractedText = extractWithReadability(html, url);
    } catch {
      extractedText = "";
    }

    // 2) Cheerio fallback
    if (!extractedText || extractedText.length < 200) {
      try {
        extractedText = extractWithCheerio(html);
      } catch {
        extractedText = extractedText || "";
      }
    }

    extractedText = cleanText(extractedText);

    if (!extractedText || extractedText.length < 200) {
      return jsonError(
        "Could not extract enough readable text from this page. Try the Paste Job Description fallback.",
        400,
        { url }
      );
    }

    // Title guess
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
    // AbortController timeout or any runtime error => still JSON
    const msg =
      err?.name === "AbortError"
        ? "Timed out fetching the job page. Try again or use Paste Job Description."
        : err?.message ?? "Unknown error extracting job.";

    return jsonError(msg, 400, { url });
  }
}

/**
 * GET /api/extract-job?url=...
 * Convenience for manual testing.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return jsonError("Unauthorized", 401);
  }

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return jsonError("Missing url", 400);
  }

  // Reuse POST behavior safely by calling the same logic:
  // easiest is to just run the same code path here.
  try {
    const parsed = BodySchema.parse({ url });
    const fakeReq = new Request(req.url, {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify({ url: parsed.url }),
    });
    return POST(fakeReq);
  } catch (err: any) {
    return jsonError(err?.message ?? "Invalid url.", 400);
  }
}
