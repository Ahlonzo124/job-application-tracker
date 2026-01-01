"use client";

export default function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="loading-overlay" role="dialog" aria-modal="true">
      <div className="loading-dialog win95-window">
        <div className="win95-titlebar">
          <span>{message}</span>
          <div className="spacer" />
          <div className="controls">
            <button className="ctrl-btn" aria-label="Close" disabled>
              ×
            </button>
          </div>
        </div>
        <div className="loading-body">
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Please wait...</div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>
            Loading application…
          </div>
          <div className="loading-bar" aria-hidden>
            <div className="fill" />
          </div>
        </div>
      </div>
    </div>
  );
}
