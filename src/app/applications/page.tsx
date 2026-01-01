"use client";

import { useEffect, useState } from "react";

type AppRow = {
  id: number;
  company: string;
  title: string;
  location: string | null;
  stage: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
  createdAt: string;
  url: string | null;
};

export default function ApplicationsPage() {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/applications");
      const j = await r.json();
      setApps(j.applications || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ maxWidth: 950, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 10 }}>Applications</h1>

      <div style={{ marginBottom: 14 }}>
        <a href="/extract" style={{ fontWeight: 900 }}>+ Add new</a>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : apps.length === 0 ? (
        <div>No applications yet.</div>
      ) : (
        <div style={{ border: "1px solid #ddd", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                <th style={th}>Company</th>
                <th style={th}>Title</th>
                <th style={th}>Location</th>
                <th style={th}>Stage</th>
                <th style={th}>Salary</th>
                <th style={th}>Link</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id}>
                  <td style={td}>{a.company}</td>
                  <td style={td}>{a.title}</td>
                  <td style={td}>{a.location || ""}</td>
                  <td style={td}>{a.stage}</td>
                  <td style={td}>
                    {a.salaryMin != null || a.salaryMax != null
                      ? `${a.salaryCurrency || ""} ${a.salaryMin ?? ""}-${a.salaryMax ?? ""} / ${a.salaryPeriod || ""}`
                      : ""}
                  </td>
                  <td style={td}>
                    {a.url ? (
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-block",
                          maxWidth: 220,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          verticalAlign: "bottom",
                        }}
                        title={a.url}
                      >
                        open
                      </a>
                    ) : (
                      <span style={{ opacity: 0.6 }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: 10, borderBottom: "1px solid #eee" };
const td: React.CSSProperties = { padding: 10, borderBottom: "1px solid #f2f2f2", verticalAlign: "top" };
