"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type InboxItem = {
  token: string;
  receivedAt: string;
  url: string | null;
  pageTitle: string | null;
  extractedText: string;
};

type ApiOk = {
  ok: true;
  extract: any;
  ai: any;
  bestUrl?: string;
};

type ApiFail = {
  ok: false;
  step?: "validate" | "extract" | "ai" | "server";
  status?: number;
  error?: string;
  extract?: any;
  ai?: any;
};

export default function ExtractPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token"); // extension token

  const [jobUrl, setJobUrl] = useState("");
  const [pastedText, setPastedText] = useState("");

  const [statusLine, setStatusLine] = useState("Idle.");
  const [messageLine, setMessageLine] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingToken, setLoadingToken] = useState(false);
  const [progressPct, setProgressPct] = useState(0);

  const [lastParse, setLastParse] = useState<ApiOk | null>(null);

  const tokenHint = useMemo(() => {
    if (!token) return "";
    return `Extension token detected: ${token.slice(0, 10)}...`;
  }, [token]);

  function prettyErr(e: any) {
    if (!e) return "Unknown error";
    if (typeof e === "string") return e;
    if (e?.message) return e.message;
    try {
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  }

  // Win95 progress animation while busy
  useEffect(() => {
    if (!busy && !saving && !loadingToken) return;

    setProgressPct(10);
    const t1 = setTimeout(() => setProgressPct(35), 250);
    const t2 = setTimeout(() => setProgressPct(55), 650);
    const t3 = setTimeout(() => setProgressPct(75), 1100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [busy, saving, loadingToken]);

  // ✅ NEW: when token exists, pull data from inbox
  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function loadFromInbox() {
      setLoadingToken(true);
      setStatusLine("Loading from extension...");
      setMessageLine("");
      setLastParse(null);

      try {
        const res = await fetch(`/api/extension/inbox?token=${encodeURIComponent(token)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const json = await res.json().catch(() => null);

        if (!res.ok || !json?.ok) {
          setStatusLine("Token lookup failed.");
          setMessageLine(json?.error || `Could not load token (HTTP ${res.status}).`);
          setLoadingToken(false);
          setProgressPct(0);
          return;
        }

        const item: InboxItem = json.item;

        if (!item?.extractedText || item.extractedText.trim().length < 50) {
          setStatusLine("Token loaded, but text is too short.");
          setMessageLine("Try expanding the job posting and resend from the extension.");
          setLoadingToken(false);
          setProgressPct(0);
          return;
        }

        if (cancelled) return;

        // Prefill fields
        setPastedText(item.extractedText);
        if (item.url) setJobUrl(item.url);

        setStatusLine("Loaded ✅ Ready to analyze.");
        setMessageLine("Click Extract + Analyze, then Save.");
        setLoadingToken(false);
        setProgressPct(100);
        setTimeout(() => setProgressPct(0), 800);
      } catch (e: any) {
        setStatusLine("Token load failed (client).");
        setMessageLine(prettyErr(e));
        setLoadingToken(false);
        setProgressPct(0);
      }
    }

    loadFromInbox();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleExtractAndAnalyze() {
    setMessageLine("");
    setStatusLine("Working...");
    setBusy(true);
    setProgressPct(8);
    setLastParse(null);

    try {
      const url = jobUrl.trim();
      const text = pastedText.trim();

      if (!url && text.length < 50) {
        setStatusLine("Failed (input).");
        setMessageLine("Please paste a URL OR paste at least ~50 characters of job description text.");
        setBusy(false);
        setProgressPct(0);
        return;
      }

      const payload = {
        url: url || "",
        pastedText: text || "",
        pageTitle: null,
        token: token || null,
      };

      setStatusLine("Extracting + parsing...");
      setProgressPct(30);

      const res = await fetch("/api/extract-and-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json().catch(() => null)) as ApiOk | ApiFail | null;

      if (!res.ok || !json || (json as any).ok === false) {
        const fail = (json as ApiFail) || {};
        const step = fail.step ?? "server";
        const http = fail.status ?? res.status;

        setStatusLine(`Failed (${step}). HTTP ${http}`);
        setMessageLine(fail.error || "Request failed. Check the response in DevTools.");
        setBusy(false);
        setProgressPct(0);
        return;
      }

      setLastParse(json as ApiOk);
      setStatusLine("Parsed ✅ (not saved yet)");
      setMessageLine("Now click Save to add it to Applications.");
      setProgressPct(100);

      setBusy(false);
      setTimeout(() => setProgressPct(0), 800);
    } catch (e: any) {
      setStatusLine("Failed (client).");
      setMessageLine(prettyErr(e));
      setBusy(false);
      setProgressPct(0);
    }
  }

  async function handleSave() {
    if (!lastParse) return;

    setSaving(true);
    setStatusLine("Saving...");
    setMessageLine("");
    setProgressPct(20);

    try {
      const url = jobUrl.trim();
      const text = pastedText.trim();

      const res = await fetch("/api/extract-and-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url || null,
          pastedText: text || null,
          pageTitle: null,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json || json.ok !== true) {
        setStatusLine(`Save failed. HTTP ${res.status}`);
        setMessageLine(json?.error || "Save failed.");
        setSaving(false);
        setProgressPct(0);
        return;
      }

      setStatusLine(json.duplicate ? "Already saved ✅" : "Saved ✅");
      setMessageLine(json.duplicate ? "This job already existed." : "Saved to Applications. Redirecting...");
      setProgressPct(100);

      setTimeout(() => router.push("/applications"), 600);
    } catch (e: any) {
      setStatusLine("Save failed (client).");
      setMessageLine(prettyErr(e));
      setSaving(false);
      setProgressPct(0);
    }
  }

  const preview = lastParse?.ai?.data || null;
  const previewCompany = typeof preview?.company === "string" ? preview.company : "";
  const previewTitle = typeof preview?.title === "string" ? preview.title : "";
  const previewUrl =
    typeof preview?.url === "string"
      ? preview.url
      : typeof lastParse?.bestUrl === "string"
      ? lastParse?.bestUrl
      : "";

  return (
    <div style={{ padding: 18 }}>
      <h1 style={{ fontSize: 38, fontWeight: 700, marginBottom: 6 }}>Add Job Application</h1>
      <p style={{ marginTop: 0, color: "#222", opacity: 0.9 }}>
        Extension → loads text automatically. Manual → paste URL or description.
      </p>

      <div style={{ background: "#fff", padding: 16, borderRadius: 10, marginTop: 12, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Status: {statusLine}</div>

        <div className="win95ProgressOuter" aria-label="progress">
          <div className="win95ProgressInner" style={{ width: `${progressPct}%` }} />
        </div>

        <div style={{ marginTop: 10, color: "#333" }}>
          {loadingToken ? "Loading token..." : busy || saving ? "Working..." : "Idle."}
        </div>

        {tokenHint ? (
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>{tokenHint}</div>
        ) : null}
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontWeight: 700, marginBottom: 8 }}>Job Posting URL</label>
        <input
          value={jobUrl}
          onChange={(e) => setJobUrl(e.target.value)}
          placeholder="https://careers.company.com/job/..."
          style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ccc", fontSize: 14 }}
        />
      </div>

      <div style={{ textAlign: "center", margin: "10px 0 14px", opacity: 0.7, fontWeight: 700 }}>— OR —</div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontWeight: 700, marginBottom: 8 }}>Paste Job Description (fallback)</label>
        <textarea
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          placeholder="Paste the job description here..."
          rows={10}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ccc",
            fontSize: 14,
            resize: "vertical",
          }}
        />
      </div>

      <button
        onClick={handleExtractAndAnalyze}
        disabled={busy || saving || loadingToken}
        style={{
          width: "100%",
          padding: 16,
          borderRadius: 12,
          border: "2px solid #777",
          background: busy ? "#d0d0d0" : "#c0c0c0",
          cursor: busy || saving || loadingToken ? "not-allowed" : "pointer",
          fontWeight: 800,
          marginBottom: 10,
        }}
      >
        Extract + Analyze (AI)
      </button>

      <button
        onClick={handleSave}
        disabled={!lastParse || busy || saving || loadingToken}
        style={{
          width: "100%",
          padding: 16,
          borderRadius: 12,
          border: "2px solid #777",
          background: !lastParse || saving ? "#d0d0d0" : "#c0c0c0",
          cursor: !lastParse || busy || saving || loadingToken ? "not-allowed" : "pointer",
          fontWeight: 800,
        }}
      >
        Save to Applications
      </button>

      {lastParse ? (
        <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "#f2f2f2", border: "1px solid #ccc" }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Parsed Preview</div>
          <div><b>Company:</b> {previewCompany || "(unknown)"}</div>
          <div><b>Title:</b> {previewTitle || "(unknown)"}</div>
          <div style={{ wordBreak: "break-word" }}><b>URL:</b> {previewUrl || "(none)"}</div>
        </div>
      ) : null}

      {messageLine ? (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 10,
            background: "#ffecec",
            border: "1px solid #ffb5b5",
            color: "#8a0000",
            fontWeight: 700,
          }}
        >
          Message: {messageLine}
        </div>
      ) : null}

      <style jsx>{`
        .win95ProgressOuter {
          height: 14px;
          background: #c0c0c0;
          border-top: 2px solid #808080;
          border-left: 2px solid #808080;
          border-right: 2px solid #ffffff;
          border-bottom: 2px solid #ffffff;
          padding: 2px;
        }
        .win95ProgressInner {
          height: 100%;
          background: #000080;
          width: 0%;
          transition: width 180ms linear;
        }
      `}</style>
    </div>
  );
}
