"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
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

    // go to desktop after login
    window.location.href = "/app";
  }

  return (
    <div style={styles.screen}>
      <div style={styles.window}>
        <div style={styles.titlebar}>
          <div>Log In</div>
        </div>

        <div style={styles.body}>
          <div style={{ marginBottom: 10 }}>
            <b>Job Tracker 95</b> — enter your credentials.
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 8 }}>
              <div style={styles.label}>Username</div>
              <input
                style={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={styles.label}>Password</div>
              <input
                style={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={styles.button} type="submit" disabled={loading}>
                {loading ? "Logging in..." : "OK"}
              </button>

              <a href="/signup" style={{ ...styles.button, textDecoration: "none" }}>
                Sign Up
              </a>
            </div>
          </form>

          <div style={styles.note}>
            No password recovery. Write down your username/password.
          </div>

          {/* ✅ Privacy policy link for Google/AdSense compliance */}
          <div style={styles.footerLinks}>
            <a href="/privacy" style={styles.footerLink}>
              Privacy Policy
            </a>
            <span style={{ opacity: 0.6 }}>•</span>
            <a href="/about" style={styles.footerLink}>
              About
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  screen: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#008080",
    padding: 24,
  },
  window: {
    width: 420,
    background: "#c0c0c0",
    border: "2px solid #000",
    boxShadow: "2px 2px 0 #000",
  },
  titlebar: {
    background: "#000080",
    color: "white",
    padding: "6px 8px",
    fontWeight: 700,
    fontSize: 14,
  },
  body: {
    padding: 12,
    fontSize: 13,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    width: "100%",
    padding: 6,
    border: "2px inset #fff",
    background: "white",
    fontSize: 14,
    outline: "none",
  },
  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 12px",
    background: "#c0c0c0",
    border: "2px outset #fff",
    color: "#000",
    cursor: "pointer",
  },
  errorBox: {
    marginTop: 8,
    padding: 8,
    background: "#fff",
    border: "2px solid #800000",
    color: "#800000",
    fontSize: 12,
  },
  note: {
    marginTop: 12,
    fontSize: 12,
    opacity: 0.85,
  },

  footerLinks: {
    marginTop: 12,
    display: "flex",
    gap: 10,
    alignItems: "center",
    fontSize: 12,
  },
  footerLink: {
    color: "#000080",
    textDecoration: "underline",
  },
};
