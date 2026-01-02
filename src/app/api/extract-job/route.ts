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
  const timeout = setTimeout(() => controller.abort(), 15000);

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

export async function POST(req: Request) {
  // ✅ Must exist in production, otherwise POST returns 405
  const session = await getServerSession(authOptions);
  if (!session?.user) return jsonError("Unauthorized", 401);

  let url: string;

  try {
    const body = BodySchema.parse(await req.json());
    url = body.url.trim();
  } catch (err: any) {
    return jsonError(err?.message ?? "Invalid request body.", 400);
  }

  try {
    const { res, html, contentType } = await fetchHtml(url);

    if (!res.ok) {
      return jsonError(`Failed to fetch page (HTTP ${res.status}).`, 400, {
        url,
        contentType,
      });
    }

    if (!html || html.trim().length < 50) {
      return jsonError("Fetched page returned empty HTML.", 400, { url, contentType });
    }

    let extractedText = "";
    try {
      extractedText = extractWithReadability(html, url);
    } catch {
      extractedText = "";
    }

    if (!extractedText || extractedText.length < 200) {
      try {
        extractedText = extractWithCheerio(html);
      } catch {
        // ignore
      }
    }

    extractedText = cleanText(extractedText);

    if (!extractedText || extractedText.length < 200) {
      return jsonError(
        "Could not extract enough readable text from this page. Try Paste Job Description fallback.",
        400,
        { url }
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
      url,
      titleGuess,
      extractedText,
    });
  } catch (err: any) {
    const msg =
      err?.name === "AbortError"
        ? "Timed out fetching the job page. Try again or use Paste Job Description."
        : err?.message ?? "Unknown error extracting job.";

    return jsonError(msg, 400, { url });
  }
}

// Optional: allow GET for quick testing in browser
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return jsonError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return jsonError("Missing url", 400);

  // Run through same logic as POST
  const fakeReq = new Request(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify({ url }),
  });

  return POST(fakeReq);
}
