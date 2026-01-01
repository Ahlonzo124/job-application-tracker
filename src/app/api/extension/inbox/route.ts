import { NextResponse } from "next/server";
import { z } from "zod";

function withCors(resp: Response) {
  const headers = new Headers(resp.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(resp.body, { status: resp.status, headers });
}

export async function OPTIONS() {
  return withCors(new Response(null, { status: 204 }));
}

// Simple in-memory store (resets when dev server restarts)
declare global {
  // eslint-disable-next-line no-var
  var __JOB_TRACKER_INBOX__: Map<string, any> | undefined;
}
const inbox = globalThis.__JOB_TRACKER_INBOX__ ?? new Map<string, any>();
globalThis.__JOB_TRACKER_INBOX__ = inbox;

const PostSchema = z.object({
  url: z.string().optional(),
  pageTitle: z.string().optional(),
  extractedText: z.string().min(50),
});

function makeToken() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(req: Request) {
  try {
    const input = PostSchema.parse(await req.json());
    const token = makeToken();

    inbox.set(token, {
      token,
      receivedAt: new Date().toISOString(),
      url: input.url ?? null,
      pageTitle: input.pageTitle ?? null,
      extractedText: input.extractedText,
    });

    // Optional cleanup: cap memory
    if (inbox.size > 50) {
      const firstKey = inbox.keys().next().value;
      inbox.delete(firstKey);
    }

    return withCors(NextResponse.json({ ok: true, token }));
  } catch (err: any) {
    return withCors(
      NextResponse.json({ ok: false, error: err?.message ?? "Unknown error" }, { status: 400 })
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) {
      return withCors(
        NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 })
      );
    }

    const item = inbox.get(token);
    if (!item) {
      return withCors(
        NextResponse.json({ ok: false, error: "Token not found (maybe expired/restarted server)" }, { status: 404 })
      );
    }

    return withCors(NextResponse.json({ ok: true, item }));
  } catch (err: any) {
    return withCors(
      NextResponse.json({ ok: false, error: err?.message ?? "Unknown error" }, { status: 400 })
    );
  }
}
