import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = Number((session?.user as any)?.id);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apps = await prisma.application.findMany({
    where: { userId },
    orderBy: [
      { stage: "asc" }, // enum order
      { sortOrder: "asc" }, // within-column order
      { updatedAt: "desc" },
    ],
  });

  return NextResponse.json(apps);
}
