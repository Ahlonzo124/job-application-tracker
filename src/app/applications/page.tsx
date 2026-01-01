"use client";

import { useEffect, useMemo, useState } from "react";

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

  // filters
  const [query, setQuery] = useState("");
  const [hideRejected, setHideRejected] = useState(false); // ✅ unchecked by default
  const [hideHired, setHideHired] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/applications");
      const j = await r.json();
      setApps(j.applications || []);
      setLoading(false);
    })();
  }, []);

  const q = query.trim().toLowerCase();

  const filteredApps = useMemo(() => {
    return apps.filter((a) => {
      if (hideRejected && a.stage === "REJECTED") return false;
      if (hideHired && a.stage === "HIRED") return false;

      if (!q) return true;

      const hay = [
        a.company,
        a.title,
        a.location ?? "",
        a.stage,
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [apps, q, hideRejected, hideHired]);

  return (
    <div style={{ maxWidth: 950, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 10 }}>
        Applications
      </h1>

      <div style={{ marginBottom: 14 }}>
        <a href="/extract" style={{ fontWeight: 900 }}>
          + Add new
        </a>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search company, title, location, stage…"
          style={{
            flex: "1 1 280px",
            padding: 8,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />

        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={hideRejected}
            onChange={(e) => setHideRejected(e.target.checked)}
          />
          Hide Rejected
        </label>

        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={hideHired}
            onChange={(e) => setHideHired(e.target.checked)}
          />
          Hide Hired
        </label>

        <button
          onClick={() => {
            setQuery("");
            setHideRejected(false);
            setHideHired(false);
          }}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid #ccc",
            background: "#fafafa",
          }}
        >
          Reset
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : filteredApps.length === 0 ? (
        <div>No applications match your filters.</div>
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
              {filteredApps.map((a) => (
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

const th: React.CSSProperties = {
  textAlign: "left",
  padding: 10,
  borderBottom: "1px solid #eee",
};

const td: React.CSSProperties = {
  padding: 10,
  borderBottom: "1px solid #f2f2f2",
  verticalAlign: "top",
};
