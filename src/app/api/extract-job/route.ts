import { NextResponse } from "next/server";
import { z } from "zod";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import * as cheerio from "cheerio";
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

/* ------------------------ VALIDATION ------------------------ */
const InputSchema = z
  .object({
    url: z.string().url().optional(),
    pastedText: z.string().min(30).optional(),
  })
  .refine((v) => !!v.url || !!v.pastedText, {
    message: "Provide either url or pastedText",
  });

/* ------------------------ UTILS ------------------------ */
function cleanText(s: string) {
  return s
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function looksLikeLoginWall(text: string, title?: string | null) {
  const t = (text + " " + (title ?? "")).toLowerCase();
  const signals = [
    "sign in",
    "log in",
    "join linkedin",
    "email or phone",
    "password",
    "forgot password",
    "create an account",
  ];
  return signals.filter((s) => t.includes(s)).length >= 2;
}

/* ------------------------ FETCH ------------------------ */
async function fetchHtml(url: string) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return await res.text();
}

/* ------------------------ EXTRACTION ------------------------ */
function extractWithReadability(html: string, url?: string) {
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  doc.querySelectorAll("script, style, noscript").forEach((el) => el.remove());

  const reader = new Readability(doc);
  const article = reader.parse();

  if (!article || !article.textContent) return null;

  return {
    title: article.title || null,
    text: cleanText(article.textContent),
  };
}

function extractWithCheerio(html: string) {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();

  const selectors = [
    "main",
    "article",
    '[role="main"]',
    ".job-description",
    ".description",
    "#job-description",
    "#description",
  ];

  let best = "";
  for (const s of selectors) {
    const txt = cleanText($(s).text() || "");
    if (txt.length > best.length) best = txt;
  }

  if (best.length < 200) best = cleanText($("body").text() || "");

  return {
    title: cleanText($("title").text() || "") || null,
    text: best,
  };
}

/* ------------------------ HANDLER ------------------------ */
export async function POST(req: Request) {
  try {
    // ✅ AUTH GUARD
    const session = await getServerSession(authOptions);
    const userId = Number((session?.user as any)?.id);
    if (!userId) {
      return withCors(
        NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
      );
    }

    const input = InputSchema.parse(await req.json());

    /* -------- PASTE MODE (extension + fallback) -------- */
    if (input.pastedText) {
      const text = cleanText(input.pastedText);

      return withCors(
        NextResponse.json({
          ok: true,
          source: "paste",
          blocked: false,
          titleGuess: null,
          extractedText: text,
        })
      );
    }

    /* -------- URL MODE -------- */
    const url = input.url!;
    const html = await fetchHtml(url);

    const extracted = extractWithReadability(html, url) ?? extractWithCheerio(html);

    if (!extracted || !extracted.text) throw new Error("Unable to extract readable content.");

    if (looksLikeLoginWall(extracted.text, extracted.title)) {
      return withCors(
        NextResponse.json({
          ok: true,
          source: "blocked",
          blocked: true,
          reason: "LOGIN_REQUIRED",
          suggestion: "Paste the job description instead",
          titleGuess: extracted.title,
          extractedText: extracted.text.slice(0, 800),
        })
      );
    }

    return withCors(
      NextResponse.json({
        ok: true,
        source: extracted.text.length > 500 ? "url_readability" : "url_fallback",
        blocked: false,
        titleGuess: extracted.title,
        extractedText: extracted.text,
      })
    );
  } catch (err: any) {
    return withCors(
      NextResponse.json({ ok: false, error: err?.message ?? "Unknown error" }, { status: 400 })
    );
  }
}
