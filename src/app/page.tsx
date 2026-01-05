"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function LandingPage() {
  const isMobile = useIsMobile(900);

  // Prevent hydration mismatch
  if (isMobile === null) return null;

  return (
    <>
      {/* ✅ AdSense – landing page only */}
      <script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9366880450381021"
        crossOrigin="anonymous"
      ></script>

      {/* ✅ MOBILE: content-only (MobileShell provides background/window) */}
      {isMobile ? (
        <main style={{ padding: 0, maxWidth: "100%" }}>
          <div className="win95-panel" style={{ padding: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>
              Job Tracker 95
            </div>

            <div style={{ marginBottom: 8 }}>
              Track job applications like it’s 1995.
            </div>

            <p style={{ fontSize: 13 }}>
              A private, desktop-style job tracker with AI-assisted parsing and a
              classic Windows-95 interface.
            </p>

            <ul style={{ paddingLeft: 18 }}>
              <li>No feeds</li>
              <li>No selling your data</li>
              <li>No subscriptions</li>
            </ul>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              <Link href="/login" className="win95-btn">
                Log In
              </Link>
              <Link href="/signup" className="win95-btn">
                Sign Up
              </Link>
              <Link href="/about" className="win95-btn">
                About
              </Link>
            </div>

            <div style={{ marginTop: 12, fontSize: 12 }}>
              Chrome extension available.
            </div>

            <div style={{ marginTop: 16, fontSize: 11, opacity: 0.6 }}>
              Advertisement
            </div>
          </div>
        </main>
      ) : (
        /* ✅ DESKTOP: classic centered landing window */
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#008080",
            padding: 24,
          }}
        >
          <div className="win95-window" style={{ width: 520, maxWidth: "100%" }}>
            <div className="win95-titlebar">
              <span>Job Tracker 95</span>
            </div>

            <div className="win95-content">
              <h2 style={{ marginTop: 0 }}>
                Track job applications like it’s 1995
              </h2>

              <p>
                A private, desktop-style job tracker with AI-assisted parsing and a
                classic Windows-95 interface.
              </p>

              <ul>
                <li>No feeds</li>
                <li>No selling your data</li>
                <li>No subscriptions</li>
              </ul>

              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <Link href="/login" className="win95-btn">
                  Log In
                </Link>
                <Link href="/signup" className="win95-btn">
                  Sign Up
                </Link>
                <Link href="/about" className="win95-btn">
                  About
                </Link>
              </div>

              <div style={{ marginTop: 16, fontSize: 12 }}>
                Chrome extension available.
              </div>

              <div style={{ marginTop: 24, fontSize: 11, opacity: 0.6 }}>
                Advertisement
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
