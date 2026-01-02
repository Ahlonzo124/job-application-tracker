import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const runtime = "nodejs";

function csvEscape(v: unknown) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = Number((session?.user as any)?.id);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apps = await prisma.application.findMany({
    where: { userId }, // ✅ scope to user
    orderBy: [{ updatedAt: "desc" }],
  });

  const headers = [
    "id",
    "company",
    "title",
    "location",
    "url",
    "jobType",
    "workMode",
    "seniority",
    "salaryMin",
    "salaryMax",
    "salaryCurrency",
    "salaryPeriod",
    "descriptionSummary",
    "keyRequirementsJson",
    "keyResponsibilitiesJson",
    "stage",
    "sortOrder",
    "notes",
    "appliedDate",
    "createdAt",
    "updatedAt",
  ];

  const csv = [
    headers.join(","),
    ...apps.map((a) =>
      headers.map((h) => csvEscape((a as any)[h])).join(",")
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="applications.csv"`,
    },
  });
}
