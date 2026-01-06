"use client";

import { useEffect, useMemo, useState } from "react";
import { ApplicationStage } from "@prisma/client";
import LoadingOverlay from "@/components/LoadingOverlay";

type Application = {
  id: number;
  userId: number | null;

  company: string;
  title: string;
  location: string | null;
  url: string | null;

  jobType: string | null;
  workMode: string | null;
  seniority: string | null;

  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;

  descriptionSummary: string | null;
  keyRequirementsJson: string | null;
  keyResponsibilitiesJson: string | null;

  stage: ApplicationStage;
  sortOrder: number;

  notes: string | null;
  appliedDate: string | null;

  createdAt: string;
  updatedAt: string;
};

const STAGES: { key: ApplicationStage; label: string }[] = [
  { key: "APPLIED", label: "Applied" },
  { key: "INTERVIEW", label: "Interview" },
  { key: "OFFER", label: "Offer" },
  { key: "HIRED", label: "Hired" },
  { key: "REJECTED", label: "Rejected" },
];

function stageLabel(s: ApplicationStage) {
  return STAGES.find((x) => x.key === s)?.label ?? s;
}

function clampStr(v: string, max = 90) {
  if (!v) return v;
  return v.length > max ? v.slice(0, max - 1) + "…" : v;
}

function safeJsonArray(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatSalary(a: Application) {
  const min = a.salaryMin;
  const max = a.salaryMax;
  const cur = (a.salaryCurrency ?? "").trim();
  const per = (a.salaryPeriod ?? "").trim();

  if (min == null && max == null) return "";

  const n = (x: number) =>
    Number.isFinite(x) ? x.toLocaleString(undefined, { maximumFractionDigits: 0 }) : String(x);

  let core = "";
  if (min != null && max != null) core = `${n(min)}–${n(max)}`;
  else if (min != null) core = `${n(min)}`;
  else if (max != null) core = `${n(max)}`;

  const curPrefix = cur ? `${cur} ` : "";
  const perSuffix = per ? ` / ${per}` : "";
  return `${curPrefix}${core}${perSuffix}`.trim();
}

function csvEscape(v: any) {
  const s = String(v ?? "");
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toIsoDateInputValue(dateish: string | null) {
  if (!dateish) return "";
  const d = new Date(dateish);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fromDateInputToIso(dateInput: string) {
  if (!dateInput) return null;
  const d = new Date(`${dateInput}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function PipelineBoard() {
  const [apps, setApps] = useState<Application[]>([]);
  const [selectedStage, setSelectedStage] = useState<ApplicationStage>("APPLIED");
  const [search, setSearch] = useState("");
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null);

  // Modals
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [actionOpen, setActionOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Move state
  const [moveStage, setMoveStage] = useState<ApplicationStage>("APPLIED");

  // Edit state (full)
  const [editForm, setEditForm] = useState<{
    company: string;
    title: string;
    location: string;
    url: string;

    jobType: string;
    workMode: string;
    seniority: string;

    salaryMin: string;
    salaryMax: string;
    salaryCurrency: string;
    salaryPeriod: string;

    descriptionSummary: string;

    keyRequirements: string;
    keyResponsibilities: string;

    stage: ApplicationStage;
    sortOrder: string;

    notes: string;
    appliedDate: string;
  } | null>(null);

  async function loadBoard() {
    setLoadingMsg("Loading pipeline...");
    try {
      const res = await fetch("/api/board", { cache: "no-store" });
      if (!res.ok) {
        setApps([]);
        return;
      }
      const data = (await res.json()) as Application[];
      setApps(Array.isArray(data) ? data : []);
    } finally {
      setLoadingMsg(null);
    }
  }

  useEffect(() => {
    loadBoard();
  }, []);

  const q = search.trim().toLowerCase();

  function matchesSearch(a: Application) {
    if (!q) return true;
    const hay = `${a.company ?? ""} ${a.title ?? ""}`.toLowerCase();
    return hay.includes(q);
  }

  const countsByStage = useMemo(() => {
    const counts: Record<ApplicationStage, number> = {
      APPLIED: 0,
      INTERVIEW: 0,
      OFFER: 0,
      HIRED: 0,
      REJECTED: 0,
    };
    for (const a of apps) {
      if (matchesSearch(a)) counts[a.stage] += 1;
    }
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apps, q]);

  const stageApps = useMemo(() => {
    const filtered = apps
      .filter((a) => a.stage === selectedStage)
      .filter((a) => matchesSearch(a));

    return filtered.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      const au = new Date(a.updatedAt).getTime();
      const bu = new Date(b.updatedAt).getTime();
      return bu - au;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apps, selectedStage, q]);

  const stageCountShown = stageApps.length;

  function openActions(app: Application) {
    setSelectedApp(app);
    setActionOpen(true);
  }

  function beginMove() {
    if (!selectedApp) return;
    setMoveStage(selectedApp.stage);
    setActionOpen(false);
    setMoveOpen(true);
  }

  function beginEdit() {
    if (!selectedApp) return;

    const req = safeJsonArray(selectedApp.keyRequirementsJson).join("\n");
    const resp = safeJsonArray(selectedApp.keyResponsibilitiesJson).join("\n");

    setEditForm({
      company: selectedApp.company ?? "",
      title: selectedApp.title ?? "",
      location: selectedApp.location ?? "",
      url: selectedApp.url ?? "",

      jobType: selectedApp.jobType ?? "",
      workMode: selectedApp.workMode ?? "",
      seniority: selectedApp.seniority ?? "",

      salaryMin: selectedApp.salaryMin == null ? "" : String(selectedApp.salaryMin),
      salaryMax: selectedApp.salaryMax == null ? "" : String(selectedApp.salaryMax),
      salaryCurrency: selectedApp.salaryCurrency ?? "",
      salaryPeriod: selectedApp.salaryPeriod ?? "",

      descriptionSummary: selectedApp.descriptionSummary ?? "",

      keyRequirements: req,
      keyResponsibilities: resp,

      stage: selectedApp.stage,
      sortOrder: String(selectedApp.sortOrder ?? 0),

      notes: selectedApp.notes ?? "",
      appliedDate: toIsoDateInputValue(selectedApp.appliedDate ?? null),
    });

    setActionOpen(false);
    setEditOpen(true);
  }

  async function doMove() {
    if (!selectedApp) return;

    setLoadingMsg("Moving application...");
    try {
      const res = await fetch(`/api/applications/${selectedApp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: moveStage }),
      });

      if (!res.ok) return;

      setMoveOpen(false);
      setSelectedApp(null);
      await loadBoard();
    } finally {
      setLoadingMsg(null);
    }
  }

  async function doDeleteOne(app: Application) {
    const ok = window.confirm("Delete this application?\n\nThis cannot be undone.");
    if (!ok) return;

    setLoadingMsg("Deleting...");
    try {
      const res = await fetch(`/api/applications/${app.id}`, { method: "DELETE" });
      if (!res.ok) return;
      setActionOpen(false);
      setMoveOpen(false);
      setEditOpen(false);
      setSelectedApp(null);
      await loadBoard();
    } finally {
      setLoadingMsg(null);
    }
  }

  async function doDeleteAllInStage() {
    const count = countsByStage[selectedStage];
    if (count === 0) return;

    const ok = window.confirm(
      `Delete ALL matching applications in: ${stageLabel(selectedStage)}?\n\nThis will delete ${count} application(s) (based on your current search).\n\nThis cannot be undone.`
    );
    if (!ok) return;

    const ids = apps
      .filter((a) => a.stage === selectedStage)
      .filter((a) => matchesSearch(a))
      .map((a) => a.id);

    setLoadingMsg("Deleting all in stage...");
    try {
      await Promise.allSettled(ids.map((id) => fetch(`/api/applications/${id}`, { method: "DELETE" })));
      await loadBoard();
    } finally {
      setLoadingMsg(null);
    }
  }

  function parseMaybeNumber(s: string) {
    const t = s.trim();
    if (!t) return null;
    const n = Number(t);
    if (Number.isNaN(n)) return null;
    return n;
  }

  async function doSaveEdit() {
    if (!selectedApp || !editForm) return;

    setLoadingMsg("Saving changes...");
    try {
      const keyReq = editForm.keyRequirements
        ? editForm.keyRequirements
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean)
        : [];

      const keyResp = editForm.keyResponsibilities
        ? editForm.keyResponsibilities
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean)
        : [];

      const appliedDateIso = fromDateInputToIso(editForm.appliedDate);

      const payload = {
        company: editForm.company,
        title: editForm.title,

        location: editForm.location ? editForm.location : null,
        url: editForm.url ? editForm.url : null,

        jobType: editForm.jobType ? editForm.jobType : null,
        workMode: editForm.workMode ? editForm.workMode : null,
        seniority: editForm.seniority ? editForm.seniority : null,

        salaryMin: parseMaybeNumber(editForm.salaryMin),
        salaryMax: parseMaybeNumber(editForm.salaryMax),
        salaryCurrency: editForm.salaryCurrency ? editForm.salaryCurrency : null,
        salaryPeriod: editForm.salaryPeriod ? editForm.salaryPeriod : null,

        descriptionSummary: editForm.descriptionSummary ? editForm.descriptionSummary : null,

        keyRequirements: keyReq.length ? keyReq : null,
        keyResponsibilities: keyResp.length ? keyResp : null,

        stage: editForm.stage,
        sortOrder: Number.isFinite(Number(editForm.sortOrder)) ? Number(editForm.sortOrder) : 0,

        notes: editForm.notes ? editForm.notes : null,
        appliedDate: appliedDateIso,
      };

      const res = await fetch(`/api/applications/${selectedApp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) return;

      setEditOpen(false);
      setSelectedApp(null);
      setEditForm(null);
      await loadBoard();
    } finally {
      setLoadingMsg(null);
    }
  }

  function exportCsvForStage() {
    const rows = stageApps; // respects selected stage + search
    if (!rows.length) return;

    const headers = [
      "id",
      "company",
      "title",
      "stage",
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
      "keyRequirements",
      "keyResponsibilities",
      "notes",
      "appliedDate",
      "createdAt",
      "updatedAt",
    ];

    const lines: string[] = [];
    lines.push(headers.join(","));

    for (const a of rows) {
      const req = safeJsonArray(a.keyRequirementsJson).join("; ");
      const resp = safeJsonArray(a.keyResponsibilitiesJson).join("; ");

      const vals = [
        a.id,
        a.company,
        a.title,
        stageLabel(a.stage),
        a.location ?? "",
        a.url ?? "",
        a.jobType ?? "",
        a.workMode ?? "",
        a.seniority ?? "",
        a.salaryMin ?? "",
        a.salaryMax ?? "",
        a.salaryCurrency ?? "",
        a.salaryPeriod ?? "",
        a.descriptionSummary ?? "",
        req,
        resp,
        a.notes ?? "",
        a.appliedDate ?? "",
        a.createdAt ?? "",
        a.updatedAt ?? "",
      ];

      lines.push(vals.map(csvEscape).join(","));
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    const safeStage = stageLabel(selectedStage).replace(/\s+/g, "_").toLowerCase();
    a.href = url;
    a.download = `pipeline_${safeStage}${q ? "_search" : ""}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <>
      {loadingMsg ? <LoadingOverlay message={loadingMsg} /> : null}

      <div className="win95-panel" style={{ padding: 10, marginBottom: 10 }}>
        <div style={{ fontWeight: 900, fontSize: 18 }}>Pipeline</div>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9, lineHeight: 1.45 }}>
          Select a stage tab to view applications. Tap/click a job card to move, edit, or delete it.
          Use search to find items fast.
        </div>
      </div>

      {/* Toolbar */}
      <div
        className="win95-panel"
        style={{
          padding: 10,
          marginBottom: 10,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
          maxWidth: "100%",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: "1 1 320px",
            minWidth: 0,
            maxWidth: "100%",
          }}
        >
          <label style={{ fontWeight: 700, whiteSpace: "nowrap" }}>Search:</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="win95-input"
            placeholder="Company or title..."
            style={{
              flex: "1 1 auto",
              minWidth: 0,
              width: "100%",
              maxWidth: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginLeft: "auto" }}>
          <button className="win95-btn" onClick={loadBoard}>
            Refresh
          </button>

          <button className="win95-btn" onClick={exportCsvForStage} disabled={stageCountShown === 0}>
            Export CSV (This Stage)
          </button>

          <button
            className="win95-btn"
            onClick={doDeleteAllInStage}
            disabled={countsByStage[selectedStage] === 0}
          >
            Delete All (Matches) in: {stageLabel(selectedStage)}
          </button>
        </div>
      </div>

      {/* Stage tabs */}
      <div
        className="win95-panel"
        style={{
          padding: 8,
          marginBottom: 10,
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          maxWidth: "100%",
        }}
      >
        {STAGES.map((s) => {
          const active = s.key === selectedStage;
          const count = countsByStage[s.key];

          return (
            <button
              key={s.key}
              className="win95-btn"
              onClick={() => setSelectedStage(s.key)}
              style={{
                fontWeight: active ? 900 : 700,
                outline: active ? "1px dotted #000" : undefined,
                outlineOffset: active ? -4 : undefined,
                whiteSpace: "nowrap",
              }}
            >
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Single vertical column */}
      <div className="win95-panel" style={{ padding: 10, maxWidth: "100%" }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>
          {stageLabel(selectedStage)} — {stageApps.length} shown
        </div>

        {stageApps.length === 0 ? (
          <div className="win95-bevel-inset" style={{ background: "#fff", padding: 10 }}>
            <div style={{ fontSize: 12, opacity: 0.9 }}>No applications found in this stage.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {stageApps.map((a) => {
              const salary = formatSalary(a);
              return (
                <button
                  key={a.id}
                  className="win95-bevel-inset"
                  onClick={() => openActions(a)}
                  style={{
                    textAlign: "left",
                    background: "#fff",
                    padding: 10,
                    cursor: "pointer",
                    border: "none",
                    width: "100%",
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                      <div style={{ fontWeight: 900, marginBottom: 3 }}>{clampStr(a.company, 60)}</div>
                      <div style={{ fontSize: 13 }}>{clampStr(a.title, 80)}</div>
                    </div>

                    {salary ? (
                      <div
                        style={{
                          flex: "0 0 auto",
                          fontSize: 12,
                          fontWeight: 700,
                          opacity: 0.9,
                          whiteSpace: "nowrap",
                        }}
                        title={salary}
                      >
                        {salary}
                      </div>
                    ) : null}
                  </div>

                  {a.location ? (
                    <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
                      {clampStr(a.location, 80)}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Action chooser modal */}
      {actionOpen && selectedApp ? (
        <Win95Modal title="Application Options" onClose={() => setActionOpen(false)} footerRight="Pipeline">
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 900 }}>{selectedApp.company}</div>
            <div style={{ fontSize: 13, opacity: 0.95 }}>{selectedApp.title}</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
              Current stage: <b>{stageLabel(selectedApp.stage)}</b>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="win95-btn" onClick={beginMove}>
              Move…
            </button>
            <button className="win95-btn" onClick={beginEdit}>
              Edit…
            </button>
            <button className="win95-btn" onClick={() => doDeleteOne(selectedApp)}>
              Delete
            </button>
            <button className="win95-btn" onClick={() => setActionOpen(false)} style={{ marginLeft: "auto" }}>
              Cancel
            </button>
          </div>
        </Win95Modal>
      ) : null}

      {/* Move modal */}
      {moveOpen && selectedApp ? (
        <Win95Modal title="Move Application" onClose={() => setMoveOpen(false)} footerRight="Pipeline">
          <div style={{ fontSize: 12, marginBottom: 10 }}>
            Moving: <b>{selectedApp.company}</b> — {selectedApp.title}
          </div>

          <div className="win95-panel" style={{ padding: 10 }}>
            <div style={{ fontSize: 12, marginBottom: 6 }}>
              Current stage: <b>{stageLabel(selectedApp.stage)}</b>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              {STAGES.map((s) => (
                <label key={s.key} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                  <input
                    type="radio"
                    name="moveStage"
                    checked={moveStage === s.key}
                    onChange={() => setMoveStage(s.key)}
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="win95-btn" onClick={doMove}>
              Move
            </button>
            <button className="win95-btn" onClick={() => setMoveOpen(false)} style={{ marginLeft: "auto" }}>
              Cancel
            </button>
          </div>
        </Win95Modal>
      ) : null}

      {/* Edit modal (full) */}
      {editOpen && selectedApp && editForm ? (
        <Win95Modal title="Edit Application" onClose={() => setEditOpen(false)} footerRight="Pipeline">
          <div style={{ display: "grid", gap: 10 }}>
            <Section title="Basics" tone={1}>
              <Field label="Company">
                <input
                  className="win95-input"
                  value={editForm.company}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  style={fullWidthControl}
                />
              </Field>

              <Field label="Title">
                <input
                  className="win95-input"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  style={fullWidthControl}
                />
              </Field>

              <Field label="Location">
                <input
                  className="win95-input"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  style={fullWidthControl}
                />
              </Field>

              <Field label="URL">
                <input
                  className="win95-input"
                  value={editForm.url}
                  onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                  style={fullWidthControl}
                />
              </Field>
            </Section>

            <Section title="Role" tone={2}>
              <Field label="Job Type">
                <input
                  className="win95-input"
                  value={editForm.jobType}
                  onChange={(e) => setEditForm({ ...editForm, jobType: e.target.value })}
                  style={fullWidthControl}
                />
              </Field>

              <Field label="Work Mode">
                <input
                  className="win95-input"
                  value={editForm.workMode}
                  onChange={(e) => setEditForm({ ...editForm, workMode: e.target.value })}
                  style={fullWidthControl}
                />
              </Field>

              <Field label="Seniority">
                <input
                  className="win95-input"
                  value={editForm.seniority}
                  onChange={(e) => setEditForm({ ...editForm, seniority: e.target.value })}
                  style={fullWidthControl}
                />
              </Field>
            </Section>

            <Section title="Compensation" tone={1}>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
                <Field label="Salary Min">
                  <input
                    className="win95-input"
                    value={editForm.salaryMin}
                    onChange={(e) => setEditForm({ ...editForm, salaryMin: e.target.value })}
                    inputMode="numeric"
                    style={fullWidthControl}
                  />
                </Field>

                <Field label="Salary Max">
                  <input
                    className="win95-input"
                    value={editForm.salaryMax}
                    onChange={(e) => setEditForm({ ...editForm, salaryMax: e.target.value })}
                    inputMode="numeric"
                    style={fullWidthControl}
                  />
                </Field>
              </div>

              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
                <Field label="Currency">
                  <input
                    className="win95-input"
                    value={editForm.salaryCurrency}
                    onChange={(e) => setEditForm({ ...editForm, salaryCurrency: e.target.value })}
                    placeholder="USD"
                    style={fullWidthControl}
                  />
                </Field>

                <Field label="Period">
                  <input
                    className="win95-input"
                    value={editForm.salaryPeriod}
                    onChange={(e) => setEditForm({ ...editForm, salaryPeriod: e.target.value })}
                    placeholder="year"
                    style={fullWidthControl}
                  />
                </Field>
              </div>
            </Section>

            <Section title="Summary" tone={2}>
              <Field label="Description Summary">
                <textarea
                  className="win95-input"
                  value={editForm.descriptionSummary}
                  onChange={(e) => setEditForm({ ...editForm, descriptionSummary: e.target.value })}
                  rows={7}
                  style={textareaStyle}
                />
              </Field>
            </Section>

            <Section title="Key Responsibilities" tone={1}>
              <Field label="One per line">
                <textarea
                  className="win95-input"
                  value={editForm.keyResponsibilities}
                  onChange={(e) => setEditForm({ ...editForm, keyResponsibilities: e.target.value })}
                  rows={9}
                  style={textareaStyleWithInnerScroll}
                />
              </Field>
            </Section>

            <Section title="Key Requirements" tone={2}>
              <Field label="One per line">
                <textarea
                  className="win95-input"
                  value={editForm.keyRequirements}
                  onChange={(e) => setEditForm({ ...editForm, keyRequirements: e.target.value })}
                  rows={9}
                  style={textareaStyleWithInnerScroll}
                />
              </Field>
            </Section>

            <Section title="Tracking" tone={1}>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
                <Field label="Stage">
                  <select
                    className="win95-input"
                    value={editForm.stage}
                    onChange={(e) => setEditForm({ ...editForm, stage: e.target.value as ApplicationStage })}
                    style={fullWidthControl}
                  >
                    {STAGES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Sort Order">
                  <input
                    className="win95-input"
                    value={editForm.sortOrder}
                    onChange={(e) => setEditForm({ ...editForm, sortOrder: e.target.value })}
                    inputMode="numeric"
                    style={fullWidthControl}
                  />
                </Field>
              </div>

              <Field label="Applied Date">
                <input
                  className="win95-input"
                  type="date"
                  value={editForm.appliedDate}
                  onChange={(e) => setEditForm({ ...editForm, appliedDate: e.target.value })}
                  style={fullWidthControl}
                />
              </Field>
            </Section>

            <Section title="Notes" tone={2}>
              <Field label="Notes">
                <textarea
                  className="win95-input"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={9}
                  style={textareaStyleWithInnerScroll}
                />
              </Field>
            </Section>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="win95-btn" onClick={doSaveEdit}>
                Save
              </button>

              <button className="win95-btn" onClick={() => doDeleteOne(selectedApp)}>
                Delete
              </button>

              <button
                className="win95-btn"
                onClick={() => {
                  setEditOpen(false);
                  setSelectedApp(null);
                  setEditForm(null);
                }}
                style={{ marginLeft: "auto" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </Win95Modal>
      ) : null}
    </>
  );
}

/** Win95 centered modal (reusable) */
function Win95Modal({
  title,
  children,
  onClose,
  footerRight,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footerRight?: string;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        zIndex: 9999,
        overflowX: "hidden",
      }}
    >
      <div
        className="win95-window"
        style={{
          width: "min(680px, 92vw)", // narrower to avoid horizontal scroll on mobile
          maxWidth: "92vw",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden",
        }}
      >
        <div className="win95-titlebar" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span>{title}</span>
          <div className="spacer" />
          <button className="win95-btn" onClick={onClose} aria-label="Close">
            X
          </button>
        </div>

        <div
          className="win95-content"
          style={{
            padding: 10,
            overflowY: "auto",
            overflowX: "hidden", // ✅ no horizontal scrolling
          }}
        >
          {children}
        </div>

        <div className="win95-statusbar" style={{ justifyContent: "space-between" }}>
          <span>Status: Ready</span>
          <span style={{ opacity: 0.85 }}>{footerRight ?? ""}</span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, tone }: { title: string; children: React.ReactNode; tone: 1 | 2 }) {
  // alternate tones for easier visual separation
  const bg = tone === 1 ? "#c0c0c0" : "#bdbdbd";

  return (
    <div className="win95-panel" style={{ padding: 10, background: bg }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "grid", gap: 10 }}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
      <label style={{ fontWeight: 700, fontSize: 12 }}>{label}</label>
      {children}
    </div>
  );
}

const fullWidthControl: React.CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  resize: "vertical",
};

const textareaStyleWithInnerScroll: React.CSSProperties = {
  ...textareaStyle,
  // keeps big text areas usable without forcing the entire modal to be enormous
  maxHeight: 260,
  overflowY: "auto",
};
