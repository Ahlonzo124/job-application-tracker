import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApplicationStage } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const runtime = "nodejs";

type ReorderPayload = {
  columns: Record<ApplicationStage, number[]>;
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = Number((session?.user as any)?.id);

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

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
      // Validate IDs are numbers
      if (body.columns[s].some((id) => typeof id !== "number" || !Number.isInteger(id))) {
        return NextResponse.json(
          { ok: false, error: `Invalid id type in stage ${s}` },
          { status: 400 }
        );
      }
    }

    // Flatten all ids in payload
    const allIds = stages.flatMap((s) => body.columns[s]);

    // Verify ownership: all IDs must belong to this user
    if (allIds.length > 0) {
      const owned = await prisma.application.findMany({
        where: {
          userId,
          id: { in: allIds },
        },
        select: { id: true },
      });

      const ownedSet = new Set(owned.map((a) => a.id));
      const notOwned = allIds.filter((id) => !ownedSet.has(id));

      if (notOwned.length > 0) {
        return NextResponse.json(
          {
            ok: false,
            error: "One or more applications do not belong to this user.",
            details: { notOwned },
          },
          { status: 403 }
        );
      }
    }

    // One transaction: update stage + sortOrder (scoped)
    await prisma.$transaction(async (tx) => {
      for (const stage of stages) {
        const ids = body.columns[stage];

        for (let i = 0; i < ids.length; i++) {
          await tx.application.updateMany({
            where: { id: ids[i], userId }, // ✅ ensure scoped update
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
