"use client";

import { useEffect, useMemo, useState } from "react";
import type { ApplicationStage } from "@prisma/client";

const STAGES: { key: ApplicationStage; label: string }[] = [
  { key: "APPLIED", label: "Applied" },
  { key: "INTERVIEW", label: "Interview" },
  { key: "OFFER", label: "Offer" },
  { key: "HIRED", label: "Hired" },
  { key: "REJECTED", label: "Rejected" },
];

type NormalizedApplication = {
  id: number;

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

  keyRequirements: string[];
  keyResponsibilities: string[];

  stage: ApplicationStage;
  sortOrder: number | null;

  notes: string | null;
  appliedDate: string | null; // ISO string from API (we’ll display as date)
};

function isoToDateInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // YYYY-MM-DD
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function dateInputToIso(dateStr: string) {
  if (!dateStr) return null;
  // Interpret as local date at noon to reduce TZ edge cases
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function ApplicationDrawer(props: {
  open: boolean;
  applicationId: number | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void; // refresh board
}) {
  const { open, applicationId, onClose, onSaved } = props;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [app, setApp] = useState<NormalizedApplication | null>(null);

  // local form state
  const [form, setForm] = useState({
    company: "",
    title: "",
    location: "",
    url: "",
    jobType: "",
    workMode: "",
    seniority: "",
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "USD",
    salaryPeriod: "",
    descriptionSummary: "",
    keyRequirements: [] as string[],
    keyResponsibilities: [] as string[],
    stage: "APPLIED" as ApplicationStage,
    notes: "",
    appliedDate: "", // YYYY-MM-DD
  });

  const canRender = open && applicationId != null;

  useEffect(() => {
    if (!canRender) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setMsg(null);
      try {
        const r = await fetch(`/api/applications/${applicationId}`, { cache: "no-store" });
        const j = await r.json();

        if (!r.ok || !j.ok) {
          throw new Error(j?.error || `Failed to load application ${applicationId}`);
        }

        if (cancelled) return;

        const a = j.application as NormalizedApplication;
        setApp(a);

        setForm({
          company: a.company ?? "",
          title: a.title ?? "",
          location: a.location ?? "",
          url: a.url ?? "",
          jobType: a.jobType ?? "",
          workMode: a.workMode ?? "",
          seniority: a.seniority ?? "",
          salaryMin: a.salaryMin != null ? String(a.salaryMin) : "",
          salaryMax: a.salaryMax != null ? String(a.salaryMax) : "",
          salaryCurrency: a.salaryCurrency ?? "USD",
          salaryPeriod: a.salaryPeriod ?? "",
          descriptionSummary: a.descriptionSummary ?? "",
          keyRequirements: Array.isArray(a.keyRequirements) ? a.keyRequirements : [],
          keyResponsibilities: Array.isArray(a.keyResponsibilities) ? a.keyResponsibilities : [],
          stage: a.stage,
          notes: a.notes ?? "",
          appliedDate: isoToDateInput(a.appliedDate),
        });
      } catch (e: any) {
        if (!cancelled) setMsg(e?.message ?? "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canRender, applicationId]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const headerTitle = useMemo(() => {
    if (!app) return "Edit Application";
    return `${app.company} — ${app.title}`;
  }, [app]);

  async function handleSave() {
    if (!applicationId) return;

    setSaving(true);
    setMsg(null);

    try {
      if (!form.company.trim() || !form.title.trim()) {
        throw new Error("Company and Title are required.");
      }

      const body = {
        company: form.company.trim(),
        title: form.title.trim(),

        location: form.location.trim() || null,
        url: form.url.trim() || null,

        jobType: form.jobType.trim() || null,
        workMode: form.workMode.trim() || null,
        seniority: form.seniority.trim() || null,

        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
        salaryCurrency: form.salaryCurrency.trim() || null,
        salaryPeriod: form.salaryPeriod.trim() || null,

        descriptionSummary: form.descriptionSummary.trim() || null,
        keyRequirements: form.keyRequirements ?? [],
        keyResponsibilities: form.keyResponsibilities ?? [],

        stage: form.stage,
        // keep existing sortOrder; backend schema allows it but we don’t want to change it here
        // sortOrder: null,

        notes: form.notes.trim() || null,
        appliedDate: form.appliedDate ? dateInputToIso(form.appliedDate) : null,
      };

      const r = await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        throw new Error(j?.error || "Save failed");
      }

      await onSaved();
      onClose();
    } catch (e: any) {
      setMsg(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!applicationId) return;
    const ok = window.confirm("Delete this application? This cannot be undone.");
    if (!ok) return;

    setDeleting(true);
    setMsg(null);

    try {
      const r = await fetch(`/api/applications/${applicationId}`, { method: "DELETE" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        throw new Error(j?.error || "Delete failed");
      }
      await onSaved();
      onClose();
    } catch (e: any) {
      setMsg(e?.message ?? "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* drawer */}
      <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-xl border-l">
        <div className="p-4 border-b flex items-center gap-2">
          <div className="min-w-0">
            <div className="font-semibold truncate">{headerTitle}</div>
            <div className="text-xs opacity-70">Press Esc to close</div>
          </div>

          <button
            className="ml-auto border rounded px-3 py-1 text-sm"
            onClick={onClose}
            disabled={saving || deleting}
          >
            Close
          </button>
        </div>

        <div className="p-4 overflow-auto h-[calc(100%-56px)]">
          {msg && (
            <div className="mb-3 border rounded p-3 bg-red-50 text-red-700">
              {msg}
            </div>
          )}

          {loading ? (
            <div className="opacity-70">Loading…</div>
          ) : (
            <div className="space-y-4">
              <Row2>
                <Input
                  label="Company"
                  value={form.company}
                  onChange={(v) => setForm((p) => ({ ...p, company: v }))}
                />
                <Input
                  label="Title"
                  value={form.title}
                  onChange={(v) => setForm((p) => ({ ...p, title: v }))}
                />
              </Row2>

              <Row2>
                <Input
                  label="Location"
                  value={form.location}
                  onChange={(v) => setForm((p) => ({ ...p, location: v }))}
                />
                <Input
                  label="URL"
                  value={form.url}
                  onChange={(v) => setForm((p) => ({ ...p, url: v }))}
                />
              </Row2>

              <Row2>
                <Input
                  label="Job Type"
                  value={form.jobType}
                  onChange={(v) => setForm((p) => ({ ...p, jobType: v }))}
                />
                <Input
                  label="Work Mode"
                  value={form.workMode}
                  onChange={(v) => setForm((p) => ({ ...p, workMode: v }))}
                />
              </Row2>

              <Row2>
                <Input
                  label="Seniority"
                  value={form.seniority}
                  onChange={(v) => setForm((p) => ({ ...p, seniority: v }))}
                />
                <Select
                  label="Stage"
                  value={form.stage}
                  onChange={(v) => setForm((p) => ({ ...p, stage: v as ApplicationStage }))}
                  options={STAGES.map((s) => ({ value: s.key, label: s.label }))}
                />
              </Row2>

              <Row2>
                <Input
                  label="Salary Min"
                  value={form.salaryMin}
                  onChange={(v) => setForm((p) => ({ ...p, salaryMin: v }))}
                />
                <Input
                  label="Salary Max"
                  value={form.salaryMax}
                  onChange={(v) => setForm((p) => ({ ...p, salaryMax: v }))}
                />
              </Row2>

              <Row2>
                <Input
                  label="Salary Currency"
                  value={form.salaryCurrency}
                  onChange={(v) => setForm((p) => ({ ...p, salaryCurrency: v }))}
                />
                <Input
                  label="Salary Period"
                  value={form.salaryPeriod}
                  onChange={(v) => setForm((p) => ({ ...p, salaryPeriod: v }))}
                />
              </Row2>

              <Row2>
                <Input
                  label="Applied Date"
                  value={form.appliedDate}
                  onChange={(v) => setForm((p) => ({ ...p, appliedDate: v }))}
                  type="date"
                />
                <div />
              </Row2>

              <Textarea
                label="Summary"
                value={form.descriptionSummary}
                onChange={(v) => setForm((p) => ({ ...p, descriptionSummary: v }))}
                rows={4}
              />

              <ListEditor
                title="Key Requirements"
                items={form.keyRequirements}
                onChange={(items) => setForm((p) => ({ ...p, keyRequirements: items }))}
              />

              <ListEditor
                title="Key Responsibilities"
                items={form.keyResponsibilities}
                onChange={(items) => setForm((p) => ({ ...p, keyResponsibilities: items }))}
              />

              <Textarea
                label="Notes"
                value={form.notes}
                onChange={(v) => setForm((p) => ({ ...p, notes: v }))}
                rows={3}
              />

              <div className="flex items-center gap-2 pt-2">
                <button
                  className="border rounded px-4 py-2 font-semibold"
                  onClick={handleSave}
                  disabled={saving || deleting}
                >
                  {saving ? "Saving…" : "Save"}
                </button>

                <button
                  className="border rounded px-4 py-2 text-red-700 border-red-300"
                  onClick={handleDelete}
                  disabled={saving || deleting}
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

function Input(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="text-sm font-semibold mb-1">{props.label}</div>
      <input
        className="w-full border rounded p-2"
        value={props.value}
        type={props.type ?? "text"}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </label>
  );
}

function Textarea(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <div className="text-sm font-semibold mb-1">{props.label}</div>
      <textarea
        className="w-full border rounded p-2"
        value={props.value}
        rows={props.rows ?? 4}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </label>
  );
}

function Select(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <div className="text-sm font-semibold mb-1">{props.label}</div>
      <select
        className="w-full border rounded p-2"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      >
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ListEditor(props: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div>
      <div className="text-sm font-semibold mb-1">{props.title}</div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded p-2"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add an item…"
        />
        <button
          className="border rounded px-3"
          onClick={() => {
            const t = draft.trim();
            if (!t) return;
            props.onChange([...(props.items || []), t]);
            setDraft("");
          }}
        >
          Add
        </button>
      </div>

      <div className="mt-2 space-y-2">
        {(props.items || []).map((item, idx) => (
          <div key={`${item}-${idx}`} className="flex gap-2 items-start">
            <div className="flex-1 border rounded p-2 bg-gray-50">{item}</div>
            <button
              className="border rounded px-2 text-sm"
              onClick={() => {
                const next = props.items.slice();
                next.splice(idx, 1);
                props.onChange(next);
              }}
            >
              remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
