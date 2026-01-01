import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";


const ApplicationCreateSchema = z.object({
  company: z.string().min(1),
  title: z.string().min(1),
  location: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  jobType: z.string().optional().nullable(),
  workMode: z.string().optional().nullable(),
  seniority: z.string().optional().nullable(),
  salaryMin: z.number().optional().nullable(),
  salaryMax: z.number().optional().nullable(),
  salaryCurrency: z.string().optional().nullable(),
  salaryPeriod: z.string().optional().nullable(),
  descriptionSummary: z.string().optional().nullable(),
  keyRequirements: z.array(z.string()).optional().nullable(),
  keyResponsibilities: z.array(z.string()).optional().nullable(),
  stage: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const input = ApplicationCreateSchema.parse(await req.json());

    const created = await prisma.application.create({
      data: {
        company: input.company,
        title: input.title,
        location: input.location ?? null,
        url: input.url ?? null,
        jobType: input.jobType ?? null,
        workMode: input.workMode ?? null,
        seniority: input.seniority ?? null,
        salaryMin: input.salaryMin ?? null,
        salaryMax: input.salaryMax ?? null,
        salaryCurrency: input.salaryCurrency ?? null,
        salaryPeriod: input.salaryPeriod ?? null,
        descriptionSummary: input.descriptionSummary ?? null,
        keyRequirementsJson: input.keyRequirements ? JSON.stringify(input.keyRequirements) : null,
        keyResponsibilitiesJson: input.keyResponsibilities ? JSON.stringify(input.keyResponsibilities) : null,
        stage: input.stage ?? "Applied",
        notes: input.notes ?? null,
        appliedDate: new Date(),
      },
    });

    return NextResponse.json({ ok: true, application: created });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const apps = await prisma.application.findMany({ orderBy: { createdAt: "desc" } });
    const normalized = apps.map((a) => ({
      ...a,
      keyRequirements: a.keyRequirementsJson ? JSON.parse(a.keyRequirementsJson) : [],
      keyResponsibilities: a.keyResponsibilitiesJson ? JSON.parse(a.keyResponsibilitiesJson) : [],
    }));
    return NextResponse.json({ ok: true, applications: normalized });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
