import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function csvEscape(v: unknown) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const apps = await prisma.application.findMany({
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
    ...apps.map((a) => headers.map((h) => csvEscape((a as any)[h])).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="applications.csv"`,
    },
  });
}
