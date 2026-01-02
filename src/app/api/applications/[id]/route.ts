import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApplicationStage } from "@prisma/client";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const runtime = "nodejs";

type PatchBody = {
  stage?: ApplicationStage;
  sortOrder?: number;
  appliedDate?: string | null;
  notes?: string | null;
};

const PutBodySchema = z.object({
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

function normalizeApp(a: any) {
  return {
    ...a,
    keyRequirements: a.keyRequirementsJson ? JSON.parse(a.keyRequirementsJson) : [],
    keyResponsibilities: a.keyResponsibilitiesJson
      ? JSON.parse(a.keyResponsibilitiesJson)
      : [],
  };
}

async function getAuthedUserId() {
  const session = await getServerSession(authOptions);
  const userId = Number((session?.user as any)?.id);
  return userId || null;
}

function parseId(ctx: { params: Promise<{ id: string }> }) {
  return ctx.params.then(({ id }) => {
    const n = Number(id);
    return Number.isNaN(n) ? null : n;
  });
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getAuthedUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const id = await parseId(ctx);
  if (!id) return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });

  try {
    const app = await prisma.application.findFirst({
      where: { id, userId },
    });

    if (!app) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, application: normalizeApp(app) });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Fetch failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getAuthedUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const id = await parseId(ctx);
  if (!id) return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as PatchBody;

  const data: any = {};
  if (body.stage) data.stage = body.stage;
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;

  if (body.appliedDate !== undefined) {
    data.appliedDate = body.appliedDate ? new Date(body.appliedDate) : null;
  }
  if (body.notes !== undefined) data.notes = body.notes;

  try {
    // scoped update: only update if belongs to user
    const updated = await prisma.application.updateMany({
      where: { id, userId },
      data,
    });

    if (updated.count === 0) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const app = await prisma.application.findFirst({ where: { id, userId } });
    return NextResponse.json({ ok: true, application: normalizeApp(app) });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Update failed" },
      { status: 400 }
    );
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getAuthedUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const id = await parseId(ctx);
  if (!id) return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });

  try {
    const input = PutBodySchema.parse(await req.json());

    // Scoped update using updateMany so we can include userId in where
    const updated = await prisma.application.updateMany({
      where: { id, userId },
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
        keyResponsibilitiesJson: input.keyResponsibilities
          ? JSON.stringify(input.keyResponsibilities)
          : null,

        stage: input.stage ?? undefined,
        sortOrder: input.sortOrder ?? undefined,

        notes: input.notes ?? null,
        appliedDate: input.appliedDate ? new Date(input.appliedDate) : null,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const app = await prisma.application.findFirst({ where: { id, userId } });
    return NextResponse.json({ ok: true, application: normalizeApp(app) });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Update failed" },
      { status: 400 }
    );
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getAuthedUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const id = await parseId(ctx);
  if (!id) return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });

  try {
    const deleted = await prisma.application.deleteMany({
      where: { id, userId },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Delete failed" },
      { status: 400 }
    );
  }
}
