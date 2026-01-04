export const metadata = {
  title: "Job Tracker 95 – Job Application Tracker",
  description: "Track job applications like it's 1995.",
};

export default function LandingPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#008080",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div
        className="win95-panel"
        style={{
          width: "min(920px, 100%)",
          padding: 16,
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
          Job Tracker 95
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>
          <div>
            <h1 style={{ margin: "0 0 8px", fontSize: 34 }}>
              Track job applications like it’s 1995.
            </h1>

            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
              A Windows-95 desktop-style job application tracker with:
              <ul style={{ marginTop: 10, paddingLeft: 18 }}>
                <li>AI extraction & structured parsing</li>
                <li>Drag-and-drop pipeline board</li>
                <li>Analytics + CSV export</li>
                <li>Optional Chrome extension workflow</li>
              </ul>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <a href="/signup" style={btn}>Create Account</a>
              <a href="/login" style={btn}>Log In</a>
              <a href="/about" style={btn}>About</a>
            </div>

            <div style={{ marginTop: 12, fontSize: 12 }}>
              <a href="/privacy" style={{ color: "#000080", textDecoration: "underline" }}>
                Privacy Policy
              </a>
            </div>
          </div>

          <div className="win95-bevel-inset" style={{ background: "#fff", padding: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Quick Start</div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
              <li>Create an account</li>
              <li>Open the Extract tool</li>
              <li>Paste a URL or job description</li>
              <li>Save → manage in Pipeline</li>
            </ol>

            <div style={{ height: 10 }} />

            <div style={{ fontSize: 12, opacity: 0.85 }}>
              Tip: If you use the extension, it can send a job to your Extract page automatically.
            </div>
          </div>
        </div>
      </div>
    </main>
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
