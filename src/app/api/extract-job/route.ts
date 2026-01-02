import { NextResponse } from "next/server";
import { z } from "zod";
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

function jsonError(message: string, status = 400, extra?: any) {
  return NextResponse.json(
    { ok: false, error: message, ...(extra ? { extra } : {}) },
    { status }
  );
}

async function fetchHtml(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        // Some sites block requests without a real UA
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

function bestTextFromSelectors($: cheerio.CheerioAPI) {
  // Remove junk
  $("script, style, noscript, iframe, svg, canvas").remove();

  const selectors = [
    // common semantic containers
    "main",
    "article",
    '[role="main"]',

    // common job-posting containers
    ".job",
    ".job-description",
    ".jobDescription",
    ".job-desc",
    ".description",
    ".posting",
    ".content",
    "#job",
    "#job-description",
    "#jobDescriptionText",
    "#posting",
    "#description",
    "#content",

    // ATS patterns
    "[data-automation='jobDescription']",
    "[data-testid='jobDescription']",
    "[class*='description']",
    "[id*='description']",
  ];

  let best = "";
  for (const sel of selectors) {
    const t = $(sel).text().trim();
    if (t.length > best.length) best = t;
  }

  // fallback to body text
  if (!best) best = $("body").text().trim();

  return best;
}

export async function POST(req: Request) {
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

    const $ = cheerio.load(html);

    // Title guess
    const titleGuess =
      $("title").first().text().trim() ||
      $('meta[property="og:title"]').attr("content")?.trim() ||
      $('meta[name="twitter:title"]').attr("content")?.trim() ||
      undefined;

    // Extract best text
    let extractedText = bestTextFromSelectors($);
    extractedText = cleanText(extractedText);

    // If very short, site is likely blocking or content is behind JS
    if (!extractedText || extractedText.length < 200) {
      return jsonError(
        "Could not extract enough readable text from this page (possibly blocked or rendered by JavaScript). Try Paste Job Description fallback.",
        400,
        { url }
      );
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

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
