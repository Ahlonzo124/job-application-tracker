"use client";

import { useEffect, useMemo, useState } from "react";

type ExtractResponse = {
  source?: string;
  url?: string;
  titleGuess?: string | null;
  extractedText?: string | null;
  blocked?: boolean;
  reason?: string;
  suggestion?: string;
  error?: string;
};

type ParsedJob = {
  company: string | null;
  title: string | null;
  location: string | null;
  url?: string | null;
  jobType: string | null;
  workMode: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
  seniority: string | null;
  descriptionSummary: string | null;
  keyRequirements: string[] | null;
  keyResponsibilities: string[] | null;
};

const STAGES = ["Applied", "Interview", "Offer", "Rejected", "Hired"];

export default function ExtractPage() {
  const [url, setUrl] = useState("");
  const [pastedText, setPastedText] = useState("");

  const [loading, setLoading] = useState(false);
  const [extractRes, setExtractRes] = useState<ExtractResponse | null>(null);
  const [aiResRaw, setAiResRaw] = useState<any>(null);

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
    stage: "Applied",
    notes: "",
  });

  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Extension inbox banner state
  const [inboxItem, setInboxItem] = useState<any>(null);
  const [inboxMsg, setInboxMsg] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) return;

    (async () => {
      try {
        const r = await fetch(`/api/extension/inbox?token=${encodeURIComponent(token)}`);
        const j = await r.json();

        if (!r.ok || !j.ok) {
          setInboxMsg(j?.error || "Could not fetch extension text.");
          return;
        }

        setInboxItem(j.item);
        setInboxMsg("Extension description received. Use it?");
      } catch {
        setInboxMsg("Could not fetch extension text.");
      }
    })();
  }, []);

  const parsed: ParsedJob | null = useMemo(() => {
    const d = aiResRaw?.data;
    if (!d) return null;
    return d as ParsedJob;
  }, [aiResRaw]);

  function fillFormFromAI(ai: ParsedJob, bestUrl: string) {
    setForm((prev) => ({
      ...prev,
      company: ai.company ?? prev.company,
      title: ai.title ?? prev.title,
      location: ai.location ?? prev.location,
      url: (ai.url ?? bestUrl ?? prev.url) || "",
      jobType: ai.jobType ?? "",
      workMode: ai.workMode ?? "",
      seniority: ai.seniority ?? "",
      salaryMin: ai.salaryMin != null ? String(ai.salaryMin) : "",
      salaryMax: ai.salaryMax != null ? String(ai.salaryMax) : "",
      salaryCurrency: ai.salaryCurrency ?? "USD",
      salaryPeriod: ai.salaryPeriod ?? "",
      descriptionSummary: ai.descriptionSummary ?? "",
      keyRequirements: ai.keyRequirements ?? [],
      keyResponsibilities: ai.keyResponsibilities ?? [],
    }));
  }

  async function handleExtractAndAnalyze() {
    setLoading(true);
    setSaveMsg(null);
    setExtractRes(null);
    setAiResRaw(null);

    try {
      const payload: any = {};
      if (url.trim()) payload.url = url.trim();
      if (pastedText.trim().length >= 30) payload.pastedText = pastedText.trim();

      const r = await fetch("/api/extract-and-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await r.text();
      let j: any = null;
      try {
        j = JSON.parse(text);
      } catch {
        setSaveMsg(`Extract+Analyze failed (non-JSON). Status ${r.status}. Preview: ${text.slice(0, 200)}`);
        setLoading(false);
        return;
      }

      if (!r.ok || j?.ok === false) {
        setAiResRaw(j);
        setExtractRes(j?.extract ?? { error: j?.error ?? "Failed" });
        setLoading(false);
        return;
      }

      setExtractRes(j.extract);
      setAiResRaw(j.ai);

      const bestUrl = (j?.bestUrl && typeof j.bestUrl === "string") ? j.bestUrl : (url.trim() || j.extract?.url || "");

      if (j.ai?.data) fillFormFromAI(j.ai.data, bestUrl);

      // Force URL into form even if AI didn’t include it
      setForm((prev) => ({
        ...prev,
        url: prev.url || bestUrl || "",
      }));
    } catch (e: any) {
      setExtractRes({ error: e?.message ?? "Unknown error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaveLoading(true);
    setSaveMsg(null);

    try {
      if (!form.company.trim() || !form.title.trim()) {
        setSaveMsg("Please fill Company and Title before saving.");
        setSaveLoading(false);
        return;
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
        notes: form.notes.trim() || null,
      };

      const r = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await r.text();
      let j: any = null;
      try {
        j = JSON.parse(text);
      } catch {
        setSaveMsg(`Save failed (non-JSON). Status ${r.status}. Preview: ${text.slice(0, 200)}`);
        setSaveLoading(false);
        return;
      }

      if (!r.ok || !j.ok) {
        setSaveMsg(j?.error || `Save failed. Status ${r.status}`);
        setSaveLoading(false);
        return;
      }

      window.location.href = "/applications";
    } catch (e: any) {
      setSaveMsg(e?.message ?? "Save failed.");
    } finally {
      setSaveLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 950, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
        Add Job Application (MVP)
      </h1>
      <p style={{ marginBottom: 16, opacity: 0.85 }}>
        One button extracts + parses. Then you can edit and save.
      </p>

      {/* Extension banner */}
      {inboxMsg && (
        <div
          style={{
            marginBottom: 16,
            padding: 14,
            border: "1px solid #ddd",
            borderRadius: 12,
            background: "#fafafa",
          }}
        >
          <b>{inboxMsg}</b>

          {inboxItem && (
            <>
              <div style={{ marginTop: 10, fontSize: 14 }}>
                <div style={{ marginBottom: 6 }}>
                  <b>From:</b>{" "}
                  <span
                    style={{
                      display: "inline-block",
                      maxWidth: "100%",
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                    }}
                  >
                    {inboxItem.url || "(unknown url)"}
                  </span>
                </div>
                <div>
                  <b>Received:</b> {inboxItem.receivedAt || "(unknown time)"}
                </div>
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => {
                    setPastedText(inboxItem.extractedText || "");
                    if (inboxItem.url) setUrl(inboxItem.url);
                    setInboxMsg("Loaded from extension. Now click Extract + Analyze.");
                    window.history.replaceState({}, "", "/extract");
                  }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: "1px solid #111",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Use description
                </button>

                <button
                  onClick={() => {
                    setInboxMsg(null);
                    setInboxItem(null);
                    window.history.replaceState({}, "", "/extract");
                  }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: "1px solid #999",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Dismiss
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Inputs */}
      <div style={{ display: "grid", gap: 12 }}>
        <label>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Job Posting URL</div>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://careers.company.com/job/..."
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
        </label>

        <div style={{ textAlign: "center", opacity: 0.6 }}>— OR —</div>

        <label>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Paste Job Description (fallback)</div>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={8}
            placeholder="Paste the job description here..."
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
        </label>

        <button
          onClick={handleExtractAndAnalyze}
          disabled={loading || (!url.trim() && pastedText.trim().length < 30)}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #111",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          {loading ? "Working..." : "Extract + Analyze (AI)"}
        </button>

        {saveMsg && (
          <div style={{ padding: 10, border: "1px solid #f2c1c1", borderRadius: 10, background: "#fff5f5" }}>
            <b style={{ color: "#b00020" }}>Message:</b>{" "}
            <span style={{ color: "#b00020" }}>{saveMsg}</span>
          </div>
        )}
      </div>

      {/* Editable form */}
      {parsed && (
        <div style={{ marginTop: 18, padding: 14, border: "1px solid #ddd", borderRadius: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>
            Application (editable)
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Company" value={form.company} onChange={(v) => setForm((p) => ({ ...p, company: v }))} />
            <Field label="Title" value={form.title} onChange={(v) => setForm((p) => ({ ...p, title: v }))} />

            <Field label="Location" value={form.location} onChange={(v) => setForm((p) => ({ ...p, location: v }))} />
            <Field label="URL" value={form.url} onChange={(v) => setForm((p) => ({ ...p, url: v }))} />

            <Field label="Job Type" value={form.jobType} onChange={(v) => setForm((p) => ({ ...p, jobType: v }))} />
            <Field label="Work Mode" value={form.workMode} onChange={(v) => setForm((p) => ({ ...p, workMode: v }))} />

            <Field label="Seniority" value={form.seniority} onChange={(v) => setForm((p) => ({ ...p, seniority: v }))} />

            <div>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Stage</div>
              <select
                value={form.stage}
                onChange={(e) => setForm((p) => ({ ...p, stage: e.target.value }))}
                style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <Field label="Salary Min" value={form.salaryMin} onChange={(v) => setForm((p) => ({ ...p, salaryMin: v }))} />
            <Field label="Salary Max" value={form.salaryMax} onChange={(v) => setForm((p) => ({ ...p, salaryMax: v }))} />

            <Field label="Salary Currency" value={form.salaryCurrency} onChange={(v) => setForm((p) => ({ ...p, salaryCurrency: v }))} />
            <Field label="Salary Period" value={form.salaryPeriod} onChange={(v) => setForm((p) => ({ ...p, salaryPeriod: v }))} />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Summary</div>
            <textarea
              value={form.descriptionSummary}
              onChange={(e) => setForm((p) => ({ ...p, descriptionSummary: e.target.value }))}
              rows={4}
              style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
            />
          </div>

          <TwoListEditor
            title="Key Requirements"
            items={form.keyRequirements}
            onChange={(items) => setForm((p) => ({ ...p, keyRequirements: items }))}
          />

          <TwoListEditor
            title="Key Responsibilities"
            items={form.keyResponsibilities}
            onChange={(items) => setForm((p) => ({ ...p, keyResponsibilities: items }))}
          />

          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Notes</div>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={3}
              style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
            />
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={handleSave}
              disabled={saveLoading}
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid #111",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {saveLoading ? "Saving..." : "Save Application"}
            </button>

            <a href="/applications" style={{ fontWeight: 900 }}>
              View Applications →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontWeight: 900, marginBottom: 6 }}>{props.label}</div>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
      />
    </label>
  );
}

function TwoListEditor(props: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 900, marginBottom: 6 }}>{props.title}</div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add an item..."
          style={{ flex: 1, minWidth: 260, padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
        />
        <button
          onClick={() => {
            const t = draft.trim();
            if (!t) return;
            props.onChange([...(props.items || []), t]);
            setDraft("");
          }}
          style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #111", fontWeight: 900, cursor: "pointer" }}
        >
          Add
        </button>
      </div>

      <ul style={{ marginTop: 10 }}>
        {(props.items || []).map((item, idx) => (
          <li key={`${item}-${idx}`} style={{ marginBottom: 6 }}>
            <span>{item}</span>{" "}
            <button
              onClick={() => {
                const next = props.items.slice();
                next.splice(idx, 1);
                props.onChange(next);
              }}
              style={{ marginLeft: 8, border: "1px solid #999", borderRadius: 8, padding: "2px 8px", cursor: "pointer" }}
            >
              remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
