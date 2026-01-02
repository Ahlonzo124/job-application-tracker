import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApplicationStage } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const runtime = "nodejs";

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

  stage: z.nativeEnum(ApplicationStage).optional().nullable(),
  sortOrder: z.number().int().optional().nullable(),

  notes: z.string().optional().nullable(),
  appliedDate: z.string().datetime().optional().nullable(),
});

async function getAuthedUserId() {
  const session = await getServerSession(authOptions);
  const userId = Number((session?.user as any)?.id);
  return userId || null;
}

export async function POST(req: Request) {
  try {
    const userId = await getAuthedUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const input = ApplicationCreateSchema.parse(await req.json());

    const created = await prisma.application.create({
      data: {
        userId, // ✅ attach to owner

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

        keyRequirementsJson: input.keyRequirements
          ? JSON.stringify(input.keyRequirements)
          : null,
        keyResponsibilitiesJson: input.keyResponsibilities
          ? JSON.stringify(input.keyResponsibilities)
          : null,

        stage: input.stage ?? ApplicationStage.APPLIED,
        sortOrder: input.sortOrder ?? 0,

        notes: input.notes ?? null,
        appliedDate: input.appliedDate ? new Date(input.appliedDate) : new Date(),
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
    const userId = await getAuthedUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const apps = await prisma.application.findMany({
      where: { userId }, // ✅ scope to logged-in user
      orderBy: { createdAt: "desc" },
    });

    const normalized = apps.map((a) => ({
      ...a,
      keyRequirements: a.keyRequirementsJson ? JSON.parse(a.keyRequirementsJson) : [],
      keyResponsibilities: a.keyResponsibilitiesJson
        ? JSON.parse(a.keyResponsibilitiesJson)
        : [],
    }));

    return NextResponse.json({ ok: true, applications: normalized });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
