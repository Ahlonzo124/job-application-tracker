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

function useIsMobile(maxWidth = 900) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [maxWidth]);

  return isMobile;
}

export default function ApplicationsPage() {
  const isMobile = useIsMobile(900);

  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [query, setQuery] = useState("");
  const [hideRejected, setHideRejected] = useState(false);
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

      const hay = [a.company, a.title, a.location ?? "", a.stage].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [apps, q, hideRejected, hideHired]);

  function salaryText(a: AppRow) {
    if (a.salaryMin == null && a.salaryMax == null) return "—";
    return `${a.salaryCurrency || ""} ${a.salaryMin ?? ""}-${a.salaryMax ?? ""} ${a.salaryPeriod || ""}`.trim();
  }

  // Prevent hydration flicker
  if (isMobile === null) return null;

  return (
    <main style={{ padding: 12, maxWidth: "100%" }}>
      {/* Header */}
      <div className="win95-panel" style={{ padding: 10, marginBottom: 10 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>Applications</div>

          <a href="/extract" className="win95-btn" style={{ marginLeft: "auto", fontWeight: 900 }}>
            + Add New
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="win95-panel" style={{ padding: 10, marginBottom: 10 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, title, location, stage..."
            style={{ flex: "1 1 240px" }}
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
            <input type="checkbox" checked={hideHired} onChange={(e) => setHideHired(e.target.checked)} />
            Hide Hired
          </label>

          <button
            onClick={() => {
              setQuery("");
              setHideRejected(false);
              setHideHired(false);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="win95-panel" style={{ padding: 10 }}>
          Loading…
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="win95-panel" style={{ padding: 10 }}>
          No applications match your filters.
        </div>
      ) : isMobile ? (
        // MOBILE CARDS
        <div style={{ display: "grid", gap: 10 }}>
          {filteredApps.map((a) => (
            <div key={a.id} className="win95-panel" style={{ padding: 10 }}>
              <div style={{ fontWeight: 900 }}>{a.company}</div>
              <div>{a.title}</div>

              <div style={{ marginTop: 6 }}>
                <b>Stage:</b> {a.stage}
              </div>
              <div>
                <b>Location:</b> {a.location || "—"}
              </div>
              <div>
                <b>Salary:</b> {salaryText(a)}
              </div>

              {a.url ? (
                <div style={{ marginTop: 8 }}>
                  <a href={a.url} target="_blank" rel="noreferrer" className="win95-btn">
                    Open Posting
                  </a>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        // DESKTOP TABLE
        <div className="win95-panel" style={{ padding: 0, overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Title</th>
                <th>Location</th>
                <th>Stage</th>
                <th>Salary</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((a) => (
                <tr key={a.id}>
                  <td>{a.company}</td>
                  <td>{a.title}</td>
                  <td>{a.location || ""}</td>
                  <td>{a.stage}</td>
                  <td>{salaryText(a)}</td>
                  <td>
                    {a.url ? (
                      <a href={a.url} target="_blank" rel="noreferrer">
                        open
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
