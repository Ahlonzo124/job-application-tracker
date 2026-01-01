import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApplicationStage } from "@prisma/client";

type ReorderPayload = {
  columns: Record<ApplicationStage, number[]>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReorderPayload;

    if (!body?.columns) {
      return NextResponse.json({ ok: false, error: "Missing columns" }, { status: 400 });
    }

    const stages: ApplicationStage[] = ["APPLIED", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];

    // Validate payload shape
    for (const s of stages) {
      if (!Array.isArray(body.columns[s])) {
        return NextResponse.json(
          { ok: false, error: `Missing array for stage ${s}` },
          { status: 400 }
        );
      }
    }

    // One transaction: update stage + sortOrder
    await prisma.$transaction(async (tx) => {
      for (const stage of stages) {
        const ids = body.columns[stage];
        for (let i = 0; i < ids.length; i++) {
          await tx.application.update({
            where: { id: ids[i] },
            data: { stage, sortOrder: i },
          });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Reorder failed" },
      { status: 400 }
    );
  }
}
