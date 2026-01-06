"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  isMobile: boolean;
  onCloseForNow: () => void;
  onDismissForever: () => Promise<void> | void;
};

type Step = {
  id: string;
  title: string;
  desktopText: string;
  mobileText: string;
  actionLabel?: string;
  actionHref?: string;
};

export default function OnboardingWizard({
  isMobile,
  onCloseForNow,
  onDismissForever,
}: Props) {
  const pathname = usePathname();
  const [stepIndex, setStepIndex] = useState(0);

  // Default OFF so Finish doesn't permanently dismiss unless user chooses it.
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const steps: Step[] = useMemo(
    () => [
      {
        id: "welcome",
        title: "Welcome to Job Tracker 95",
        desktopText:
          "This app behaves like a Windows 95 desktop. Use the Start menu or desktop icons to open apps in their own windows.",
        mobileText:
          "This app adapts to mobile. Use the bottom taskbar buttons to open each app.",
      },
      {
        id: "extract",
        title: "Step 1: Extract a Job",
        desktopText:
          "Open Extract Job and paste a job URL or job text. If your Chrome extension is installed, you can send jobs directly from the browser.",
        mobileText:
          "Open Extract and paste a job URL or job text. Browser extensions typically do not work on mobile, so pasting is the main method here.",
        actionLabel: "Open Extract",
        actionHref: "/extract",
      },
      {
        id: "save",
        title: "Step 2: Save and Review",
        desktopText:
          "After extraction, save the application.",
        mobileText:
          "After extraction, save the application.",
        actionLabel: "Open Applications",
        actionHref: "/applications",
      },
      {
        id: "pipeline",
        title: "Step 3: Manage Your Pipeline",
        desktopText:
          "Use Pipeline to move applications through stages. Click cards to edit and move applications.",
        mobileText:
          "Use Pipeline to move applications through stages. Tap cards to edit and move applications.",
        actionLabel: "Open Pipeline",
        actionHref: "/pipeline",
      },
      {
        id: "export",
        title: "Step 4: Export When Needed",
        desktopText:
          "Use Pipeline to export your data to CSV for spreadsheets or backup.",
        mobileText:
          "Use Pipeline to export your data to CSV for spreadsheets or backup.",
      },
      {
        id: "done",
        title: "All Set",
        desktopText:
          "If you want to keep seeing this wizard later, leave the checkbox unchecked.",
        mobileText:
          "If you want to keep seeing this wizard later, leave the checkbox unchecked.",
      },
    ],
    []
  );

  const step = steps[stepIndex];
  const canGoBack = stepIndex > 0;
  const canGoNext = stepIndex < steps.length - 1;

  async function closeWizard() {
    // Key behavior: checkbox controls whether closing persists.
    if (dontShowAgain) {
      await onDismissForever();
    } else {
      onCloseForNow();
    }
  }

  return (
    <div className="win95-modal-backdrop" role="dialog" aria-modal="true">
      <div className="win95-window win95-modal">
        <div className="win95-titlebar">
          <span>Setup Wizard</span>
          <div className="spacer" />
          <button
            className="win95-btn"
            onClick={closeWizard}
            aria-label="Close"
            title="Close"
          >
            X
          </button>
        </div>

        <div className="win95-content" style={{ padding: 12 }}>
          <div style={{ marginBottom: 8, fontWeight: 700 }}>{step.title}</div>

          <div style={{ lineHeight: 1.4, marginBottom: 10 }}>
            {isMobile ? step.mobileText : step.desktopText}
          </div>

          {step.actionHref && step.actionLabel ? (
            <div style={{ marginBottom: 12 }}>
              <Link
                className="win95-btn"
                href={step.actionHref}
                style={{ display: "inline-block", textDecoration: "none" }}
              >
                {step.actionLabel}
              </Link>
              <span style={{ marginLeft: 10, opacity: 0.8, fontSize: 12 }}>
                Current page: {pathname}
              </span>
            </div>
          ) : (
            <div style={{ height: 12 }} />
          )}

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            Do not show this again
          </label>
        </div>

        <div
          className="win95-statusbar"
          style={{ justifyContent: "space-between", padding: "8px 10px" }}
        >
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            Step {stepIndex + 1} of {steps.length}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="win95-btn"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={!canGoBack}
            >
              Back
            </button>

            {canGoNext ? (
              <button
                className="win95-btn"
                onClick={() =>
                  setStepIndex((i) => Math.min(steps.length - 1, i + 1))
                }
              >
                Next
              </button>
            ) : (
              <button className="win95-btn" onClick={closeWizard}>
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
