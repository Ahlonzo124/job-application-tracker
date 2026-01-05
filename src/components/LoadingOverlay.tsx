"use client";

export default function LoadingOverlay({ message }: { message: string }) {
  return (
    <div
      className="loading-overlay"
      role="dialog"
      aria-modal="true"
      style={{
        padding: 12,
      }}
    >
      <div
        className="loading-dialog win95-window"
        style={{
          width: "min(420px, calc(100vw - 24px))",
          maxWidth: "100%",
          margin: "0 auto",
        }}
      >
        <div className="win95-titlebar">
          <span>{message}</span>
          <div className="spacer" />
          <div className="controls">
            <button className="ctrl-btn" aria-label="Close" disabled>
              ×
            </button>
          </div>
        </div>

        <div
          className="loading-body"
          style={{
            padding: 14,
            maxWidth: "100%",
            overflow: "hidden",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            Please wait...
          </div>

          <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 10 }}>
            Loading application…
          </div>

          <div
            className="loading-bar"
            aria-hidden
            style={{
              maxWidth: "100%",
            }}
          >
            <div className="fill" />
          </div>
        </div>
      </div>
    </div>
  );
}
