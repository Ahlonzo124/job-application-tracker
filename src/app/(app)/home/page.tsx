"use client";

import { useEffect, useState } from "react";
import OnboardingWizard from "@/components/OnboardingWizard";

// IMPORTANT:
// Change this string anytime you want to force everyone to see onboarding again.
// For your release, keep it stable.
const ONBOARDING_CAMPAIGN_ID = "onboarding-v0.4.0-pre";

// Chrome extension store link (ID is stable even if name changes)
const CHROME_EXTENSION_URL =
  "https://chromewebstore.google.com/detail/kbajiejpkelimnoidcdcmmllmcmcojel?utm_source=item-share-cb";

type Preferences = {
  onboardingDismissedAt: string | null;
  lastSeenVersion: string | null;
  currentVersion: string;
};

export default function AuthedHomePage() {
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 900px)").matches;

  async function loadPrefs(): Promise<Preferences | null> {
    const res = await fetch("/api/user/preferences");
    const json = await res.json();
    if (!json?.ok) return null;
    return json.preferences as Preferences;
  }

  useEffect(() => {
    async function load() {
      const p = await loadPrefs();
      if (!p) {
        setLoading(false);
        return;
      }

      // Show wizard unless this onboarding campaign was acknowledged
      const hasAcknowledgedCampaign = p.lastSeenVersion === ONBOARDING_CAMPAIGN_ID;

      if (!hasAcknowledgedCampaign) {
        setShowOnboarding(true);
      }

      setLoading(false);
    }

    load();
  }, []);

  function closeOnboardingForNow() {
    setShowOnboarding(false);
  }

  async function dismissOnboardingForever() {
    await fetch("/api/user/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dismissOnboarding: true,
        version: ONBOARDING_CAMPAIGN_ID,
      }),
    });

    setShowOnboarding(false);
  }

  function showOnboardingNow() {
    setShowOnboarding(true);
  }

  if (loading) {
    return null;
  }

  return (
    <>
      {showOnboarding && (
        <OnboardingWizard
          isMobile={isMobile}
          onCloseForNow={closeOnboardingForNow}
          onDismissForever={dismissOnboardingForever}
        />
      )}

      <main style={{ padding: 12, maxWidth: "100%" }}>
        <div
          className="win95-panel"
          style={{
            padding: 16,
            width: "min(920px, 100%)",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              background: "#000080",
              color: "#fff",
              padding: "8px 10px",
              fontWeight: 800,
              marginBottom: 12,
            }}
          >
            Welcome to Job Tracker 95
          </div>

          {/* Primary actions */}
          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <button className="win95-btn" onClick={showOnboardingNow}>
              Show Setup Wizard
            </button>

            <a
              href={CHROME_EXTENSION_URL}
              target="_blank"
              rel="noreferrer"
              className="win95-btn"
              style={{ textDecoration: "none" }}
            >
              Download Chrome Extension
            </a>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: 16,
            }}
          >
            {/* Left column */}
            <div>
              <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>Quick Start Guide</h1>

              <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                Here’s how to use the app:
                <ul style={{ marginTop: 10, paddingLeft: 18 }}>
                  <li>
                    <b>Extract</b>: Paste a job URL or job description text
                  </li>
                  <li>
                    <b>Save</b>: Save it to your Applications list
                  </li>
                  <li>
                    <b>Pipeline</b>: Drag cards between stages
                  </li>
                  <li>
                    <b>Analytics</b>: Track activity + export CSV
                  </li>
                </ul>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                <a href="/extract" style={btn}>Go to Extract</a>
                <a href="/applications" style={btn}>View Applications</a>
                <a href="/pipeline" style={btn}>Open Pipeline</a>
                <a href="/analytics" style={btn}>Analytics</a>
              </div>

              <div style={{ marginTop: 12, fontSize: 12 }}>
                <a
                  href="/privacy"
                  style={{ color: "#000080", textDecoration: "underline" }}
                >
                  Privacy Policy
                </a>
              </div>
            </div>

            {/* Right column */}
            <div className="win95-bevel-inset" style={{ background: "#fff", padding: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>
                Extension Workflow (Optional)
              </div>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
                <li>Open a job posting in your browser</li>
                <li>
                  Install the{" "}
                  <a
                    href={CHROME_EXTENSION_URL}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#000080", textDecoration: "underline" }}
                  >
                    Job Tracker Chrome Extension
                  </a>
                </li>
                <li>Use the extension to send it to Job Tracker</li>
                <li>It appears on your Extract page automatically</li>
                <li>Save → manage in Pipeline</li>
              </ol>

              <div style={{ height: 10 }} />

              <div style={{ fontSize: 12, opacity: 0.85 }}>
                Tip: If a site blocks the extension, paste the job description into Extract.
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "6px 12px",
  background: "#c0c0c0",
  border: "2px outset #fff",
  color: "#000",
  cursor: "pointer",
  textDecoration: "none",
  fontWeight: 700,
};
