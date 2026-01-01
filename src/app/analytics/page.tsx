"use client";

import { useEffect, useMemo, useState } from "react";

type Analytics = {
  ok: boolean;
  total: number;
  active: number;
  byStage: Record<string, number>;
  months: { key: string; count: number }[];
  stalest: {
    id: number;
    stage: string;
    company: string;
    title: string;
    updatedAt: string;
    daysInCurrentStage: number;
  }[];
  shares: {
    interviewShare: number;
    offerShare: number;
  };
};

function pct(x: number) {
  return `${Math.round(x * 100)}%`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const r = await fetch("/api/analytics", { cache: "no-store" });
      const j = await r.json();
      setData(j);
      setLoading(false);
    })();
  }, []);

  const stageRows = useMemo(() => {
    if (!data?.byStage) return [];
    const order = ["APPLIED", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];
    return order.map((k) => ({ stage: k, count: data.byStage[k] ?? 0 }));
  }, [data]);

  const maxStageCount = useMemo(() => {
    return stageRows.reduce((m, r) => Math.max(m, r.count), 0);
  }, [stageRows]);

  const maxMonthCount = useMemo(() => {
    if (!data?.months?.length) return 0;
    return data.months.reduce((m, r) => Math.max(m, r.count), 0);
  }, [data]);

  if (loading) return <div style={{ maxWidth: 980, margin: "40px auto", padding: 16 }}>Loading…</div>;
  if (!data?.ok) return <div style={{ maxWidth: 980, margin: "40px auto", padding: 16 }}>Failed to load analytics.</div>;

  return (
    <div style={{ maxWidth: 980, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 10 }}>Analytics</h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Card title="Total Applications" value={String(data.total)} />
        <Card title="Active (Not Rejected/Hired)" value={String(data.active)} />
        <Card title="Interview Share" value={pct(data.shares.interviewShare)} sub="(current-stage distribution)" />
        <Card title="Offer Share" value={pct(data.shares.offerShare)} sub="(current-stage distribution)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        {/* Stage Distribution Chart */}
        <section style={panel}>
          <h2 style={h2}>Stage Distribution</h2>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
            Shows how your applications are currently distributed across stages.
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {stageRows.map((r) => {
              const widthPct = maxStageCount === 0 ? 0 : (r.count / maxStageCount) * 100;
              return (
                <div key={r.stage} style={{ display: "grid", gridTemplateColumns: "130px 1fr 60px", gap: 10, alignItems: "center" }}>
                  <div style={{ fontWeight: 800 }}>{r.stage}</div>

                  <div style={{ height: 12, background: "#f1f1f1", borderRadius: 999, overflow: "hidden", border: "1px solid #e7e7e7" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${clamp(widthPct, 0, 100)}%`,
                        background: "#111",
                        borderRadius: 999,
                      }}
                    />
                  </div>

                  <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.count}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Monthly Trend Chart */}
        <section style={panel}>
          <h2 style={h2}>Applications Added (Last 12 Months)</h2>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
            Quick trend view based on <code>createdAt</code>.
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 6,
              height: 140,
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 10,
              background: "#fafafa",
              overflowX: "auto",
            }}
            title="Monthly totals"
          >
            {data.months.map((m) => {
              const hPct = maxMonthCount === 0 ? 0 : (m.count / maxMonthCount) * 100;
              const barHeight = Math.max(4, Math.round((hPct / 100) * 110)); // min height 4px
              return (
                <div key={m.key} style={{ minWidth: 26, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div
                    title={`${m.key}: ${m.count}`}
                    style={{
                      width: 18,
                      height: barHeight,
                      background: "#111",
                      borderRadius: 6,
                    }}
                  />
                  <div style={{ fontSize: 10, opacity: 0.7, transform: "rotate(-35deg)", transformOrigin: "top" }}>
                    {m.key.slice(5)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Keep the table (useful for exact values) */}
          <div style={{ marginTop: 12, border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  <th style={th}>Month</th>
                  <th style={th}>Count</th>
                </tr>
              </thead>
              <tbody>
                {data.months.map((m) => (
                  <tr key={m.key}>
                    <td style={td}>{m.key}</td>
                    <td style={td}>{m.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Stalest */}
        <section style={panel}>
          <h2 style={h2}>Stalest Applications (Days Since Last Update)</h2>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
            Proxy for “time in current stage” using <code>updatedAt</code>.
          </div>

          <div style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  <th style={th}>Company</th>
                  <th style={th}>Title</th>
                  <th style={th}>Stage</th>
                  <th style={th}>Days</th>
                </tr>
              </thead>
              <tbody>
                {data.stalest.map((a) => (
                  <tr key={a.id}>
                    <td style={td}>{a.company}</td>
                    <td style={td}>{a.title}</td>
                    <td style={td}>{a.stage}</td>
                    <td style={td}>{a.daysInCurrentStage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Card({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div
      style={{
        flex: "1 1 220px",
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 900 }}>{value}</div>
      {sub ? <div style={{ fontSize: 12, opacity: 0.6 }}>{sub}</div> : null}
    </div>
  );
}

const panel: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: 12,
};

const h2: React.CSSProperties = { margin: 0, marginBottom: 10, fontSize: 18, fontWeight: 900 };

const th: React.CSSProperties = { textAlign: "left", padding: 10, borderBottom: "1px solid #eee" };
const td: React.CSSProperties = { padding: 10, borderBottom: "1px solid #f2f2f2", verticalAlign: "top" };
