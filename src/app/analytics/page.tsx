export const dynamic = "force-dynamic";
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import { ApplicationStage } from "@prisma/client";
import { requireAuth } from "../../lib/requireAuth";

function stageLabel(s: ApplicationStage) {
  switch (s) {
    case "APPLIED":
      return "Applied";
    case "INTERVIEW":
      return "Interview";
    case "OFFER":
      return "Offer";
    case "HIRED":
      return "Hired";
    case "REJECTED":
      return "Rejected";
  }
}

export default async function AnalyticsPage() {
  const session = await requireAuth();
  const userId = Number((session?.user as any)?.id);

  // Safety net (shouldn't happen because requireAuth redirects)
  if (!userId) {
    return (
      <div className="win95-panel" style={{ padding: 12 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Analytics</div>
        <div style={{ fontSize: 12 }}>Unauthorized</div>
      </div>
    );
  }

  const apps = await prisma.application.findMany({
    where: { userId }, // ✅ scoped
    select: { stage: true, createdAt: true, updatedAt: true, company: true, title: true, id: true },
    orderBy: { createdAt: "asc" },
  });

  const total = apps.length;

  const counts: Record<ApplicationStage, number> = {
    APPLIED: 0,
    INTERVIEW: 0,
    OFFER: 0,
    HIRED: 0,
    REJECTED: 0,
  };

  for (const a of apps) counts[a.stage]++;

  const rows = (Object.keys(counts) as ApplicationStage[]).map((s) => ({
    stage: s,
    label: stageLabel(s),
    count: counts[s],
    pct: total ? Math.round((counts[s] / total) * 100) : 0,
  }));

  const active = total - counts.REJECTED - counts.HIRED;
  const topStage = [...rows].sort((a, b) => b.count - a.count)[0]?.label ?? "—";

  return (
    <div>
      <div className="win95-panel" style={{ padding: 10, marginBottom: 10 }}>
        <div style={{ fontWeight: 900, fontSize: 18 }}>Analytics</div>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>
          Basic pipeline stats (more charts later if you want).
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 12 }}>
        <div className="win95-panel" style={{ padding: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Stage Breakdown</div>

          <table>
            <thead>
              <tr>
                <th>Stage</th>
                <th>Count</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.stage}>
                  <td>{r.label}</td>
                  <td>{r.count}</td>
                  <td>{r.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="win95-panel" style={{ padding: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Summary</div>

          <div className="win95-bevel-inset" style={{ padding: 10, background: "#fff" }}>
            <div style={{ marginBottom: 6 }}>
              <b>Total applications:</b> {total}
            </div>
            <div style={{ marginBottom: 6 }}>
              <b>Active:</b> {active}
            </div>
            <div>
              <b>Top stage:</b> {topStage}
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div className="win95-bevel-inset" style={{ padding: 10, background: "#fff" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Next</div>
            <div style={{ fontSize: 12 }}>
              We can add charts and a “time in stage” report once you want it.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
