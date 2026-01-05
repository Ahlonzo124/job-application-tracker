"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DesktopNavLink from "@/components/DesktopNavLink";
import LoadingOverlay from "@/components/LoadingOverlay";
import StartMenu from "@/components/StartMenu";

export default function DesktopShell({ children }: { children: React.ReactNode }) {
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
  const [clock, setClock] = useState("");

  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";

  const username =
    (session?.user as any)?.username ||
    (session?.user as any)?.name ||
    (session?.user as any)?.email ||
    (status === "loading" ? "Loading..." : "Guest");

  const windowTitle =
    isAuthed && username && username !== "Loading..." && username !== "Guest"
      ? `Job Application Tracker — ${username}`
      : "Job Application Tracker";

  // ✅ Home routing rule:
  // - signed out → public landing (with ads)
  // - signed in → instructions / quickstart page
  const homeHref = isAuthed ? "/home" : "/";

  useEffect(() => {
    const tick = () => {
      setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
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
              {/* Always visible */}
              <DesktopIcon label="Home" href={homeHref} iconSrc="/icons/home.svg" onOpen={setLoadingMsg} />

              {isAuthed ? (
                <>
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
                </>
              ) : (
                <>
                  <DesktopIcon
                    label="Login"
                    href="/login"
                    iconSrc="/icons/about.svg"
                    onOpen={setLoadingMsg}
                  />
                  <DesktopIcon
                    label="Sign Up"
                    href="/signup"
                    iconSrc="/icons/about.svg"
                    onOpen={setLoadingMsg}
                  />
                </>
              )}

              {/* Always visible */}
              <DesktopIcon label="About" href="/about" iconSrc="/icons/about.svg" onOpen={setLoadingMsg} />
            </div>
          </div>

          {/* Right: centered window */}
          <div className="desktop-main">
            <Window title={windowTitle}>{children}</Window>
          </div>
        </div>
      </div>

      <div className="taskbar">
        {/* NOTE: StartMenu likely contains a Home link too.
            We'll update StartMenu once you paste it. */}
        <StartMenu onOpenApp={setLoadingMsg} />

        <div className="win95-panel" style={{ padding: "6px 10px" }}>
          Job Tracker
        </div>

        <div className="win95-panel" style={{ padding: "6px 10px" }}>
          User: <b>{username}</b>
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
