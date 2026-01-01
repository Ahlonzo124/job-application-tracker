import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

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
    if (!process.env.OPENAI_API_KEY) {
      return withCors(
        NextResponse.json(
          { error: "Missing OPENAI_API_KEY in .env.local" },
          { status: 400 }
        )
      );
    }

    const input = InputSchema.parse(await req.json());

    // Use Structured Outputs (JSON schema) so you reliably get parseable fields
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
              jobType: { type: ["string", "null"] }, // Full-time/Part-time/Contract/Intern/etc
              workMode: { type: ["string", "null"] }, // On-site/Hybrid/Remote
              salaryMin: { type: ["number", "null"] },
              salaryMax: { type: ["number", "null"] },
              salaryCurrency: { type: ["string", "null"] }, // USD/EUR...
              salaryPeriod: { type: ["string", "null"] }, // hour/year/month
              seniority: { type: ["string", "null"] }, // entry/mid/senior...
              descriptionSummary: { type: ["string", "null"] }, // 3-6 lines
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
                  salary: { type: "number" }
                },
                required: ["company", "title", "location", "salary"]
              }
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
              "confidence"
            ],
          },
          strict: true,
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("AI returned empty content.");

    // content is guaranteed to be JSON that matches schema (for supported models)
    return withCors(
      NextResponse.json({
        ok: true,
        data: JSON.parse(content),
      })
    );
  } catch (err: any) {
    return withCors(
      NextResponse.json(
        { error: err?.message ?? "Unknown error" },
        { status: 400 }
      )
    );
  }
}
