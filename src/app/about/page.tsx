export default function AboutPage() {
  return (
    <div>
      <div className="win95-panel" style={{ padding: 12, marginBottom: 10 }}>
        <div style={{ fontWeight: 900 }}>About Job Tracker 95</div>
        <div style={{ marginTop: 6 }}>
          A Windows-95 desktop-style job application tracker built with Next.js,
          Prisma, SQLite, and an AI job parser.
        </div>
      </div>

      <div className="win95-panel" style={{ padding: 12 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Features</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>AI parsing from pasted text or extension extraction</li>
          <li>Drag-and-drop pipeline stages</li>
          <li>Inline editing + notes</li>
          <li>Duplicate detection</li>
          <li>CSV export</li>
        </ul>

        <div style={{ height: 12 }} />

        <div className="win95-bevel-inset" style={{ padding: 10, background: "#fff" }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Tip</div>
          <div style={{ fontSize: 12 }}>
            Use the Start menu or desktop icons to open apps like a real desktop.
          </div>
        </div>
      </div>
    </div>
  );
}
