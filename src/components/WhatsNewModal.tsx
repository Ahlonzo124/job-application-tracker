"use client";

import { CURRENT_APP_VERSION } from "@/lib/appVersion";

type Props = {
  isMobile: boolean;
  onAcknowledge: () => Promise<void> | void;
};

export default function WhatsNewModal({ isMobile, onAcknowledge }: Props) {
  return (
    <div className="win95-modal-backdrop" role="dialog" aria-modal="true">
      <div className="win95-window win95-modal">
        <div className="win95-titlebar">
          <span>What&apos;s New</span>
          <div className="spacer" />
          <button className="win95-btn" onClick={onAcknowledge} aria-label="Close">
            X
          </button>
        </div>

        <div className="win95-content" style={{ padding: 12 }}>
          <div style={{ marginBottom: 8, fontWeight: 700 }}>
            {CURRENT_APP_VERSION}
          </div>

          <div style={{ marginBottom: 10, lineHeight: 1.4 }}>
            {isMobile
              ? "Updates are now optimized for mobile and desktop."
              : "Updates are now optimized for desktop and mobile."}
          </div>

          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.5 }}>
            <li>Major UI overhaul and layout consistency improvements</li>
            <li>Dedicated MobileShell with mobile-first navigation</li>
            <li>Signed-in Home / Instructions page after login</li>
            <li>Public landing page remains separate at /</li>
          </ul>
        </div>

        <div className="win95-statusbar" style={{ justifyContent: "flex-end", padding: 10 }}>
          <button className="win95-btn" onClick={onAcknowledge}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
