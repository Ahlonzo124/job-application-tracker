import PipelineBoard from "./pipeline-board";

export default function PipelinePage() {
  return (
    <main style={{ padding: 12, maxWidth: "100%" }}>
      {/* Header row */}
      <div
        className="win95-panel"
        style={{
          padding: 10,
          marginBottom: 10,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          maxWidth: "100%",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 900 }}>Pipeline</div>

        <a className="win95-btn" href="/api/export/csv" style={{ whiteSpace: "nowrap" }}>
          Export CSV
        </a>
      </div>

      {/* Board area */}
      <div className="pipeline-board win95-panel" style={{ padding: 10, maxWidth: "100%" }}>
        <div className="pipeline-columns" style={{ maxWidth: "100%" }}>
          <div style={{ width: "100%" }}>
            <PipelineBoard />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.9 }}>
        Tip: Swipe left/right to move between columns on mobile.
      </div>
    </main>
  );
}
