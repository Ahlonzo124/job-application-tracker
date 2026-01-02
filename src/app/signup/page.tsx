"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignupPage() {
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

    // Auto-login after signup
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

  return (
    <div style={styles.screen}>
      <div style={styles.window}>
        <div style={styles.titlebar}>
          <div>Sign Up</div>
        </div>

        <div style={styles.body}>
          <div style={{ marginBottom: 10 }}>
            <b>Create a username + password</b>
          </div>

          <div style={styles.warning}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Important</div>
            <div style={{ fontSize: 12 }}>
              There is <b>NO</b> password recovery. Write down your username and password.
            </div>
          </div>

          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: 8 }}>
              <div style={styles.label}>Username</div>
              <input
                style={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
              <div style={styles.hint}>Letters/numbers/underscore only. 3–24 chars.</div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={styles.label}>Password</div>
              <input
                style={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <div style={styles.hint}>Min 8 characters.</div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={styles.label}>Confirm Password</div>
              <input
                style={styles.input}
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}
            {created && !error && (
              <div style={styles.okBox}>Account created. Logging you in…</div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={styles.button} type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Account"}
              </button>

              <a href="/login" style={{ ...styles.button, textDecoration: "none" }}>
                Back to Login
              </a>
            </div>
          </form>
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
    width: 460,
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
  hint: {
    fontSize: 11,
    opacity: 0.85,
    marginTop: 4,
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
  warning: {
    padding: 10,
    background: "#fff",
    border: "2px solid #808000",
    marginBottom: 10,
  },
  errorBox: {
    marginTop: 8,
    padding: 8,
    background: "#fff",
    border: "2px solid #800000",
    color: "#800000",
    fontSize: 12,
  },
  okBox: {
    marginTop: 8,
    padding: 8,
    background: "#fff",
    border: "2px solid #008000",
    color: "#008000",
    fontSize: 12,
  },
};
