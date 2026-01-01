"use client";

import { useEffect, useState } from "react";
import DesktopNavLink from "@/components/DesktopNavLink";
import LoadingOverlay from "@/components/LoadingOverlay";
import StartMenu from "@/components/StartMenu";

export default function DesktopShell({ children }: { children: React.ReactNode }) {
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => {
      setClock(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!loadingMsg) return;
    const id = window.setTimeout(() => setLoadingMsg(null), 900);
    return () => window.clearTimeout(id);
  }, [loadingMsg]);

  return (
    <>
      {loadingMsg ? <LoadingOverlay message={loadingMsg} /> : null}

      <div className="desktop">
        <div className="desktop-layout">
          {/* Left: icons */}
          <div className="desktop-left">
            <div className="desktop-icons">
              <DesktopIcon
                label="Home"
                href="/"
                iconSrc="/icons/home.svg"
                onOpen={setLoadingMsg}
              />

              <DesktopIcon
                label="Pipeline"
                href="/pipeline"
                iconSrc="/icons/pipeline.svg"
                onOpen={setLoadingMsg}
              />

              <DesktopIcon
                label="Applications"
                href="/applications"
                iconSrc="/icons/applications.svg"
                onOpen={setLoadingMsg}
              />

              <DesktopIcon
                label="Extract Job"
                href="/extract"
                iconSrc="/icons/extract.svg"
                onOpen={setLoadingMsg}
              />

              <DesktopIcon
                label="Analytics"
                href="/analytics"
                iconSrc="/icons/analytics.svg"
                onOpen={setLoadingMsg}
              />

              <DesktopIcon
                label="About"
                href="/about"
                iconSrc="/icons/about.svg"
                onOpen={setLoadingMsg}
              />
            </div>
          </div>

          {/* Right: centered window */}
          <div className="desktop-main">
            <Window title="Job Application Tracker">{children}</Window>
          </div>
        </div>
      </div>

      <div className="taskbar">
        <StartMenu onOpenApp={setLoadingMsg} />

        <div className="win95-panel" style={{ padding: "6px 10px" }}>
          Job Tracker
        </div>

        <div className="clock win95-panel">{clock}</div>
      </div>
    </>
  );
}

function DesktopIcon({
  label,
  href,
  iconSrc,
  onOpen,
}: {
  label: string;
  href: string;
  iconSrc: string;
  onOpen: (msg: string) => void;
}) {
  return (
    <DesktopNavLink
      href={href}
      openLabel={label}
      className="desktop-icon"
      onNavigateStart={onOpen}
    >
      <div className="icon" aria-hidden>
        <img
          src={iconSrc}
          alt=""
          width={32}
          height={32}
          style={{
            width: 32,
            height: 32,
            imageRendering: "pixelated",
            display: "block",
          }}
        />
      </div>
      <div className="label">{label}</div>
    </DesktopNavLink>
  );
}

function Window({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="win95-window win95-window-centered">
      <div className="win95-titlebar">
        <span>{title}</span>
        <div className="spacer" />
        <div className="controls">
          <button className="ctrl-btn" aria-label="Minimize">
            _
          </button>
          <button className="ctrl-btn" aria-label="Close">
            ×
          </button>
        </div>
      </div>

      <div className="win95-content">{children}</div>

      <div className="win95-statusbar">
        <span>Status: Ready</span>
      </div>
    </div>
  );
}
