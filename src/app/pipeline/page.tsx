import PipelineBoard from "./pipeline-board";

export default function PipelinePage() {
  return (
    <main style={{ padding: 12 }}>
      {/* Header row */}
      <div
        className="win95-panel"
        style={{
          padding: 10,
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 900 }}>Pipeline</div>

        <a className="win95-btn" href="/api/export/csv">
          Export CSV
        </a>
      </div>

      {/* Fixed-height board area (columns scroll internally) */}
      <div className="pipeline-board win95-panel" style={{ padding: 10 }}>
        {/* This wrapper is important: it gives horizontal scroll if you add more columns later */}
        <div className="pipeline-columns">
          {/* PipelineBoard should render the columns INSIDE here.
              If PipelineBoard already renders a columns row, that's fine—
              it will just fill this space. */}
          <div style={{ width: "100%" }}>
            <PipelineBoard />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.9 }}>
        Tip: If the pipeline grows, each column will scroll while staying the same size.
      </div>
    </main>
  );
}
