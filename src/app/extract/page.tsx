"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type ApiOk = {
  ok: true;
  extract: any;
  ai: any;
  bestUrl?: string;
};

type ApiFail = {
  ok: false;
  step?: "extract" | "ai" | "server";
  status?: number;
  error?: string;
  extract?: any;
  ai?: any;
};

export default function ExtractPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // If extension passes token, you may already have UI that handles it.
  const token = searchParams.get("token");

  const [jobUrl, setJobUrl] = useState("");
  const [pastedText, setPastedText] = useState("");

  const [statusLine, setStatusLine] = useState("Idle.");
  const [messageLine, setMessageLine] = useState("");
  const [busy, setBusy] = useState(false);
  const [progressPct, setProgressPct] = useState(0);

  // Show token hint (optional)
  const tokenHint = useMemo(() => {
    if (!token) return "";
    return `Extension token detected: ${token.slice(0, 10)}...`;
  }, [token]);

  // Fake-progress animation (Win95 style bar)
  useEffect(() => {
    if (!busy) return;

    setProgressPct(10);
    const t1 = setTimeout(() => setProgressPct(35), 250);
    const t2 = setTimeout(() => setProgressPct(55), 650);
    const t3 = setTimeout(() => setProgressPct(75), 1100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [busy]);

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

  async function handleExtractAndAnalyze() {
    setMessageLine("");
    setStatusLine("Working...");
    setBusy(true);
    setProgressPct(8);

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

      // If user pasted text, we *should not* require URL extraction.
      // We'll send both; extract-job route will decide.
      const payload = {
        url: url || null,
        pastedText: text || null,
        pageTitle: null,
      };

      setStatusLine("Extracting...");
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
        setMessageLine(
          fail.error ||
            "Request failed. Open DevTools → Network → extract-and-parse and check response."
        );

        setBusy(false);
        setProgressPct(0);
        return;
      }

      // success
      setStatusLine("Success ✅");
      setProgressPct(100);

      // You probably already have logic to fill an edit form after parsing.
      // For now, we just store parsed data in sessionStorage and go to /applications or /pipeline if you want.
      // If you already have an “edit & save” flow, plug it in here.

      // Example: redirect to Applications page (or stay on extract)
      // router.push("/applications");

      // Keep message simple
      setMessageLine("Extract + Analyze completed. Scroll down (if your form appears) and save.");

      setBusy(false);
      setTimeout(() => setProgressPct(0), 800);
    } catch (e: any) {
      setStatusLine("Failed (client).");
      setMessageLine(prettyErr(e));
      setBusy(false);
      setProgressPct(0);
    }
  }

  return (
    <div style={{ padding: 18 }}>
      <h1 style={{ fontSize: 38, fontWeight: 700, marginBottom: 6 }}>
        Add Job Application (MVP)
      </h1>
      <p style={{ marginTop: 0, color: "#222", opacity: 0.9 }}>
        One button extracts + parses. Then you can edit and save.
      </p>

      {/* Status box */}
      <div
        style={{
          background: "#fff",
          padding: 16,
          borderRadius: 10,
          marginTop: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          Status: {statusLine}
        </div>

        <div className="win95ProgressOuter" aria-label="progress">
          <div
            className="win95ProgressInner"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div style={{ marginTop: 10, color: "#333" }}>
          {busy ? "Working..." : "Idle."}
        </div>

        {tokenHint ? (
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
            {tokenHint}
          </div>
        ) : null}
      </div>

      {/* Inputs */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontWeight: 700, marginBottom: 8 }}>
          Job Posting URL
        </label>
        <input
          value={jobUrl}
          onChange={(e) => setJobUrl(e.target.value)}
          placeholder="https://careers.company.com/job/..."
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ccc",
            fontSize: 14,
          }}
        />
      </div>

      <div
        style={{
          textAlign: "center",
          margin: "10px 0 14px",
          opacity: 0.7,
          fontWeight: 700,
        }}
      >
        — OR —
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontWeight: 700, marginBottom: 8 }}>
          Paste Job Description (fallback)
        </label>
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

      {/* Button */}
      <button
        onClick={handleExtractAndAnalyze}
        disabled={busy}
        style={{
          width: "100%",
          padding: 16,
          borderRadius: 12,
          border: "2px solid #777",
          background: busy ? "#d0d0d0" : "#c0c0c0",
          cursor: busy ? "not-allowed" : "pointer",
          fontWeight: 800,
        }}
      >
        Extract + Analyze (AI)
      </button>

      {/* Error/Message */}
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

      {/* Win95 progress styles */}
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
