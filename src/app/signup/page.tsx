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

export default function SignupPage() {
  const isMobile = useIsMobile(900);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) {
      setLoading(false);
      setError(json?.error ?? "Signup failed.");
      return;
    }

    setCreated(true);

    const login = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!login || login.error) {
      setError("Account created, but auto-login failed. Go to /login.");
      return;
    }

    window.location.href = "/";
  }

  if (isMobile === null) return null;

  // ✅ MOBILE: render only content (MobileShell provides the window/background)
  if (isMobile) {
    return (
      <main style={{ padding: 0, maxWidth: "100%" }}>
        <div className="win95-panel" style={{ padding: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Sign Up</div>

          <div
            className="win95-panel"
            style={{
              marginBottom: 10,
              padding: 10,
              border: "2px solid #808000",
              background: "#fff",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Important</div>
            <div style={{ fontSize: 12 }}>
              There is <b>NO</b> password recovery. Write down your username and password.
            </div>
          </div>

          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>Username</div>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                style={{ width: "100%" }}
              />
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>
                Letters/numbers/underscore only. 3–24 chars.
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>Password</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                style={{ width: "100%" }}
              />
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>
                Min 8 characters.
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>Confirm Password</div>
              <input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                autoComplete="new-password"
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

            {created && !error ? (
              <div
                className="win95-panel"
                style={{
                  marginTop: 8,
                  padding: 8,
                  border: "2px solid #008000",
                  color: "#008000",
                  background: "#fff",
                  fontSize: 12,
                }}
              >
                Account created. Logging you in…
              </div>
            ) : null}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              <button type="submit" disabled={loading} style={{ fontWeight: 900 }}>
                {loading ? "Creating..." : "Create Account"}
              </button>

              <a href="/login" className="win95-btn" style={{ textDecoration: "none", fontWeight: 900 }}>
                Back to Login
              </a>
            </div>
          </form>

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

  // ✅ DESKTOP: keep standalone centered signup window
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
          width: "min(460px, calc(100vw - 24px))",
          maxWidth: "100%",
        }}
      >
        <div className="win95-titlebar">
          <span>Sign Up</span>
          <div className="spacer" />
          <div className="controls">
            <button className="ctrl-btn" aria-label="Close" disabled>
              ×
            </button>
          </div>
        </div>

        <div className="win95-content" style={{ padding: 12, maxWidth: "100%", overflow: "hidden" }}>
          <div style={{ marginBottom: 10 }}>
            <b>Create a username + password</b>
          </div>

          <div
            className="win95-panel"
            style={{
              marginBottom: 10,
              padding: 10,
              border: "2px solid #808000",
              background: "#fff",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Important</div>
            <div style={{ fontSize: 12 }}>
              There is <b>NO</b> password recovery. Write down your username and password.
            </div>
          </div>

          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>Username</div>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                style={{ width: "100%" }}
              />
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>
                Letters/numbers/underscore only. 3–24 chars.
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>Password</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                style={{ width: "100%" }}
              />
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>
                Min 8 characters.
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>Confirm Password</div>
              <input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                autoComplete="new-password"
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

            {created && !error ? (
              <div
                className="win95-panel"
                style={{
                  marginTop: 8,
                  padding: 8,
                  border: "2px solid #008000",
                  color: "#008000",
                  background: "#fff",
                  fontSize: 12,
                }}
              >
                Account created. Logging you in…
              </div>
            ) : null}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              <button type="submit" disabled={loading} style={{ fontWeight: 900 }}>
                {loading ? "Creating..." : "Create Account"}
              </button>

              <a href="/login" className="win95-btn" style={{ textDecoration: "none", fontWeight: 900 }}>
                Back to Login
              </a>
            </div>
          </form>

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
