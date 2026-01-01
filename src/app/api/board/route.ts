import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const apps = await prisma.application.findMany({
    orderBy: [
      { stage: "asc" },      // enum order
      { sortOrder: "asc" },  // within-column order
      { updatedAt: "desc" },
    ],
  });

  return NextResponse.json(apps);
}
