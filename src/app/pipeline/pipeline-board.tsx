"use client";

import { useEffect, useMemo, useState } from "react";
import type { Application, ApplicationStage } from "@prisma/client";

const STAGES: { key: ApplicationStage; label: string }[] = [
  { key: "APPLIED", label: "Applied" },
  { key: "INTERVIEW", label: "Interview" },
  { key: "OFFER", label: "Offer" },
  { key: "HIRED", label: "Hired" },
  { key: "REJECTED", label: "Rejected" },
];

export default function PipelineBoard() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const res = await fetch("/api/board", { cache: "no-store" });
    const data = (await res.json()) as Application[];
    setApps(data);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const grouped = useMemo(() => {
    const map: Record<ApplicationStage, Application[]> = {
      APPLIED: [],
      INTERVIEW: [],
      OFFER: [],
      HIRED: [],
      REJECTED: [],
    };

    for (const a of apps) map[a.stage].push(a);

    for (const key of Object.keys(map) as ApplicationStage[]) {
      map[key].sort((x, y) => (x.sortOrder ?? 0) - (y.sortOrder ?? 0));
    }

    return map;
  }, [apps]);

  async function move(id: number, stage: ApplicationStage) {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, stage } : a)));

    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });

    if (!res.ok) {
      await refresh();
    } else {
      await refresh();
    }
  }

  if (loading) return <p>Loading…</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {STAGES.map((s) => (
        <section key={s.key} className="rounded-lg border p-3">
          <h2 className="font-medium mb-3 flex items-center justify-between">
            <span>{s.label}</span>
            <span className="text-sm opacity-60">{grouped[s.key].length}</span>
          </h2>

          <div className="space-y-3">
            {grouped[s.key].map((a) => (
              <div key={a.id} className="rounded-md border p-3">
                <div className="font-semibold">{a.title}</div>
                <div className="text-sm opacity-80">{a.company}</div>

                {a.url ? (
                  <a
                    className="text-sm underline block mt-1"
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Job link
                  </a>
                ) : null}

                <div className="mt-3">
                  <label className="text-xs opacity-70">Move to</label>
                  <select
                    className="mt-1 w-full border rounded p-2"
                    value={a.stage}
                    onChange={(e) =>
                      move(a.id, e.target.value as ApplicationStage)
                    }
                  >
                    {STAGES.map((x) => (
                      <option key={x.key} value={x.key}>
                        {x.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
