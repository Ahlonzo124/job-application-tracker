"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

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

export default function LoginPage() {
  const isMobile = useIsMobile(900);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!res || res.error) {
      setError("Invalid username or password.");
      return;
    }

    window.location.href = "/home";
  }

  // Prevent hydration mismatch
  if (isMobile === null) return null;

  // ✅ MOBILE: render only content (MobileShell provides the window/background)
  if (isMobile) {
    return (
      <main style={{ padding: 0, maxWidth: "100%" }}>
        <div className="win95-panel" style={{ padding: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Log In</div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>Username</div>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>Password</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ width: "100%" }}
              />
            </div>

            {error ? (
              <div
                className="win95-panel"
                style={{
                  marginTop: 8,
                  padding: 8,
                  border: "2px solid #800000",
                  color: "#800000",
                  background: "#fff",
                  fontSize: 12,
                }}
              >
                {error}
              </div>
            ) : null}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              <button type="submit" disabled={loading} style={{ fontWeight: 900 }}>
                {loading ? "Logging in..." : "OK"}
              </button>

              <a href="/signup" className="win95-btn" style={{ textDecoration: "none", fontWeight: 900 }}>
                Sign Up
              </a>
            </div>
          </form>

          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.85 }}>
            No password recovery. Write down your username/password.
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", fontSize: 12 }}>
            <a href="/privacy" style={{ color: "#000080", textDecoration: "underline" }}>
              Privacy Policy
            </a>
            <span style={{ opacity: 0.6 }}>•</span>
            <a href="/about" style={{ color: "#000080", textDecoration: "underline" }}>
              About
            </a>
          </div>
        </div>
      </main>
    );
  }

  // ✅ DESKTOP: keep standalone centered login window
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--desk)",
        padding: 12,
        overflowX: "hidden",
      }}
    >
      <div
        className="win95-window"
        style={{
          width: "min(420px, calc(100vw - 24px))",
          maxWidth: "100%",
        }}
      >
        <div className="win95-titlebar">
          <span>Log In</span>
          <div className="spacer" />
          <div className="controls">
            <button className="ctrl-btn" aria-label="Close" disabled>
              ×
            </button>
          </div>
        </div>

        <div className="win95-content" style={{ padding: 12, maxWidth: "100%", overflow: "hidden" }}>
          <div style={{ marginBottom: 10 }}>
            <b>Job Tracker 95</b> — enter your credentials.
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>Username</div>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>Password</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ width: "100%" }}
              />
            </div>

            {error ? (
              <div
                className="win95-panel"
                style={{
                  marginTop: 8,
                  padding: 8,
                  border: "2px solid #800000",
                  color: "#800000",
                  background: "#fff",
                  fontSize: 12,
                }}
              >
                {error}
              </div>
            ) : null}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              <button type="submit" disabled={loading} style={{ fontWeight: 900 }}>
                {loading ? "Logging in..." : "OK"}
              </button>

              <a href="/signup" className="win95-btn" style={{ textDecoration: "none", fontWeight: 900 }}>
                Sign Up
              </a>
            </div>
          </form>

          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.85 }}>
            No password recovery. Write down your username/password.
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", fontSize: 12 }}>
            <a href="/privacy" style={{ color: "#000080", textDecoration: "underline" }}>
              Privacy Policy
            </a>
            <span style={{ opacity: 0.6 }}>•</span>
            <a href="/about" style={{ color: "#000080", textDecoration: "underline" }}>
              About
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
