export const metadata = {
  title: "About – Job Tracker 95",
};

export default function AboutPage() {
  return (
    <div>
      {/* Intro */}
      <div className="win95-panel" style={{ padding: 12, marginBottom: 10 }}>
        <div style={{ fontWeight: 900, fontSize: 18 }}>
          About Job Tracker 95
        </div>
        <div style={{ marginTop: 6 }}>
          Job Tracker 95 is a Windows-95–style job application tracker designed
          for individuals who want a simple, private, and distraction-free way
          to manage job applications.
        </div>
      </div>

      {/* What it does */}
      <div className="win95-panel" style={{ padding: 12, marginBottom: 10 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>What this app does</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Extract job descriptions from pasted text or URLs</li>
          <li>Optionally send jobs from a Chrome extension</li>
          <li>Use AI to parse company, title, location, salary, and requirements</li>
          <li>Track progress using a drag-and-drop pipeline</li>
          <li>Store notes and export applications as CSV</li>
        </ul>
      </div>

      {/* Philosophy */}
      <div className="win95-panel" style={{ padding: 12, marginBottom: 10 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>
          Design philosophy
        </div>
        <div>
          This project intentionally avoids modern “always-online” design
          patterns. The interface is inspired by classic desktop software:
        </div>
        <ul style={{ marginTop: 6, paddingLeft: 18 }}>
          <li>No feeds</li>
          <li>No gamification</li>
          <li>No dark patterns</li>
          <li>No data resale</li>
        </ul>
      </div>

      {/* Privacy */}
      <div className="win95-panel" style={{ padding: 12, marginBottom: 10 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Privacy & data</div>
        <div>
          Your job applications belong to you. Data is only used to provide the
          core functionality of the app.
        </div>
        <div style={{ marginTop: 6 }}>
          The Chrome extension only sends job data when you explicitly click the
          button. Nothing runs in the background.
        </div>
        <div style={{ marginTop: 6 }}>
          See the <a href="/privacy">Privacy Policy</a> for details.
        </div>
      </div>

      {/* Status */}
      <div className="win95-bevel-inset" style={{ padding: 10, background: "#fff" }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>
          Project status
        </div>
        <div style={{ fontSize: 12 }}>
          Job Tracker 95 is actively developed. Features may change, improve, or
          temporarily be unavailable as the project evolves.
        </div>
      </div>
    </div>
  );
}
