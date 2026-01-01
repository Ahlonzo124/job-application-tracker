import { prisma } from "@/lib/prisma";
import { ApplicationStage } from "@prisma/client";

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
  const apps = await prisma.application.findMany({
    select: { stage: true, createdAt: true },
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
              <b>Active (not rejected):</b> {total - counts.REJECTED}
            </div>
            <div>
              <b>Top stage:</b>{" "}
              {rows.sort((a, b) => b.count - a.count)[0]?.label ?? "—"}
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
