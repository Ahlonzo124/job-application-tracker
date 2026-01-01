import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApplicationStage } from "@prisma/client";

type PatchBody = {
  stage?: ApplicationStage;
  sortOrder?: number;
  appliedDate?: string | null;
  notes?: string | null;
};

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);

  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as PatchBody;

  const data: any = {};

  if (body.stage) data.stage = body.stage;
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;

  if (body.appliedDate !== undefined) {
    data.appliedDate = body.appliedDate ? new Date(body.appliedDate) : null;
  }
  if (body.notes !== undefined) data.notes = body.notes;

  try {
    const updated = await prisma.application.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Update failed" },
      { status: 400 }
    );
  }
}
