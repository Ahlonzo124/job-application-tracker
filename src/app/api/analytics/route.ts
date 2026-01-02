import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApplicationStage } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const runtime = "nodejs";

const STAGES: ApplicationStage[] = ["APPLIED", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];

function monthKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = Number((session?.user as any)?.id);

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const apps = await prisma.application.findMany({
      where: { userId }, // ✅ scope
      select: {
        id: true,
        stage: true,
        createdAt: true,
        updatedAt: true,
        appliedDate: true,
        company: true,
        title: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const total = apps.length;

    // counts by stage
    const byStage: Record<ApplicationStage, number> = {
      APPLIED: 0,
      INTERVIEW: 0,
      OFFER: 0,
      HIRED: 0,
      REJECTED: 0,
    };
    for (const a of apps) byStage[a.stage]++;

    // last 12 months counts by createdAt
    const now = new Date();
    const months: { key: string; count: number }[] = [];
    const monthSet = new Set<string>();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = monthKey(d);
      months.push({ key: k, count: 0 });
      monthSet.add(k);
    }

    const monthIndex = new Map(months.map((m, idx) => [m.key, idx]));

    for (const a of apps) {
      const k = monthKey(a.createdAt);
      if (monthSet.has(k)) {
        const idx = monthIndex.get(k)!;
        months[idx].count += 1;
      }
    }

    // "age in current stage" proxy = now - updatedAt
    const ages = apps.map((a) => ({
      id: a.id,
      stage: a.stage,
      company: a.company,
      title: a.title,
      updatedAt: a.updatedAt.toISOString(),
      daysInCurrentStage: Math.floor((Date.now() - a.updatedAt.getTime()) / (1000 * 60 * 60 * 24)),
    }));

    ages.sort((a, b) => b.daysInCurrentStage - a.daysInCurrentStage);

    // top "stale" applications (oldest in current stage)
    const stalest = ages.slice(0, 10);

    // simple “rates” based on current distribution (not true funnel conversion)
    const active = total - byStage.REJECTED - byStage.HIRED;
    const interviewShare = total ? byStage.INTERVIEW / total : 0;
    const offerShare = total ? byStage.OFFER / total : 0;

    return NextResponse.json({
      ok: true,
      total,
      active,
      byStage,
      months,
      stalest,
      shares: {
        interviewShare,
        offerShare,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Analytics failed" },
      { status: 500 }
    );
  }
}
