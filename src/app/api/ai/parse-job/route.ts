import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const runtime = "nodejs";

/** Simple CORS (handy for extension/testing; harmless locally) */
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

const InputSchema = z.object({
  extractedText: z.string().min(50),
  url: z.string().url().optional(),
  pageTitle: z.string().optional(),
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    // ✅ AUTH GUARD (prevents burning your OpenAI quota)
    const session = await getServerSession(authOptions);
    const userId = Number((session?.user as any)?.id);
    if (!userId) {
      return withCors(
        NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return withCors(
        NextResponse.json({ ok: false, error: "Missing OPENAI_API_KEY in .env.local" }, { status: 400 })
      );
    }

    const input = InputSchema.parse(await req.json());

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You extract structured job posting fields from messy text. Be conservative: if a field is unknown, set it to null.",
        },
        {
          role: "user",
          content: [
            "Extract job fields from this posting text.",
            input.url ? `URL: ${input.url}` : "",
            input.pageTitle ? `Page Title: ${input.pageTitle}` : "",
            "",
            "POSTING TEXT:",
            input.extractedText,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "job_posting",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              company: { type: ["string", "null"] },
              title: { type: ["string", "null"] },
              location: { type: ["string", "null"] },
              jobType: { type: ["string", "null"] },
              workMode: { type: ["string", "null"] },
              salaryMin: { type: ["number", "null"] },
              salaryMax: { type: ["number", "null"] },
              salaryCurrency: { type: ["string", "null"] },
              salaryPeriod: { type: ["string", "null"] },
              seniority: { type: ["string", "null"] },
              descriptionSummary: { type: ["string", "null"] },
              keyRequirements: {
                type: "array",
                items: { type: "string" },
              },
              keyResponsibilities: {
                type: "array",
                items: { type: "string" },
              },
              confidence: {
                type: "object",
                additionalProperties: false,
                properties: {
                  company: { type: "number" },
                  title: { type: "number" },
                  location: { type: "number" },
                  salary: { type: "number" },
                },
                required: ["company", "title", "location", "salary"],
              },
            },
            required: [
              "company",
              "title",
              "location",
              "jobType",
              "workMode",
              "salaryMin",
              "salaryMax",
              "salaryCurrency",
              "salaryPeriod",
              "seniority",
              "descriptionSummary",
              "keyRequirements",
              "keyResponsibilities",
              "confidence",
            ],
          },
          strict: true,
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("AI returned empty content.");

    return withCors(
      NextResponse.json({
        ok: true,
        data: JSON.parse(content),
      })
    );
  } catch (err: any) {
    return withCors(
      NextResponse.json({ ok: false, error: err?.message ?? "Unknown error" }, { status: 400 })
    );
  }
}
