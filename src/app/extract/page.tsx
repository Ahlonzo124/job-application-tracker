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

  const token = searchParams.get("token");
  const tokenStr = token ?? "";

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
    if (!tokenStr) return "";
    return `Extension token detected: ${tokenStr.slice(0, 10)}...`;
  }, [tokenStr]);

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

  // When token exists, pull data from inbox
  useEffect(() => {
    if (!tokenStr) return;

    let cancelled = false;

    async function loadFromInbox() {
      setLoadingToken(true);
      setStatusLine("Loading from extension...");
      setMessageLine("");
      setLastParse(null);

      try {
        const res = await fetch(
          `/api/extension/inbox?token=${encodeURIComponent(tokenStr)}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

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
  }, [tokenStr]);

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
        token: tokenStr || null,
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

  const disabled = busy || saving || loadingToken;

  return (
    <main style={{ padding: 12, maxWidth: "100%" }}>
      {/* Header + actions at the TOP (no scrolling to use buttons) */}
      <div className="win95-panel" style={{ padding: 10, marginBottom: 10 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>Add Job Application</div>
          <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.85 }}>
            Extension → auto-loads text • Manual → paste URL or description
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          <button onClick={handleExtractAndAnalyze} disabled={disabled} style={{ fontWeight: 900 }}>
            Extract + Analyze (AI)
          </button>

          <button
            onClick={handleSave}
            disabled={!lastParse || disabled}
            style={{ fontWeight: 900 }}
          >
            Save to Applications
          </button>

          <button
            onClick={() => router.push("/applications")}
            disabled={disabled}
            style={{ fontWeight: 700 }}
            aria-label="Go to Applications"
          >
            View Applications
          </button>
        </div>
      </div>

      {/* Status box */}
      <div className="win95-panel" style={{ padding: 10, marginBottom: 10 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Status: {statusLine}</div>

        <div className="win95ProgressOuter" aria-label="progress">
          <div className="win95ProgressInner" style={{ width: `${progressPct}%` }} />
        </div>

        <div style={{ marginTop: 8 }}>
          {loadingToken ? "Loading token..." : busy || saving ? "Working..." : "Idle."}
        </div>

        {tokenHint ? (
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>{tokenHint}</div>
        ) : null}
      </div>

      {/* Inputs */}
      <div className="win95-panel" style={{ padding: 10, marginBottom: 10 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Job Posting URL</div>
        <input
          value={jobUrl}
          onChange={(e) => setJobUrl(e.target.value)}
          placeholder="https://careers.company.com/job/..."
          style={{ width: "100%" }}
        />

        <div style={{ textAlign: "center", margin: "10px 0", opacity: 0.8, fontWeight: 900 }}>
          — OR —
        </div>

        <div style={{ fontWeight: 900, marginBottom: 6 }}>Paste Job Description (fallback)</div>
        <textarea
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          placeholder="Paste the job description here..."
          rows={10}
          style={{
            width: "100%",
            resize: "vertical",
          }}
        />
      </div>

      {/* Preview */}
      {lastParse ? (
        <div className="win95-panel" style={{ padding: 10, marginBottom: 10 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Parsed Preview</div>
          <div>
            <b>Company:</b> {previewCompany || "(unknown)"}
          </div>
          <div>
            <b>Title:</b> {previewTitle || "(unknown)"}
          </div>
          <div style={{ wordBreak: "break-word" }}>
            <b>URL:</b> {previewUrl || "(none)"}
          </div>
        </div>
      ) : null}

      {/* Message / error box */}
      {messageLine ? (
        <div className="win95-panel" style={{ padding: 10 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Message</div>
          <div style={{ whiteSpace: "pre-wrap" }}>{messageLine}</div>
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
    </main>
  );
}
