"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import LoadingOverlay from "@/components/LoadingOverlay";

type NavItem = { label: string; href: string };

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
  const [clock, setClock] = useState("");

  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";

  const username =
    (session?.user as any)?.username ||
    (session?.user as any)?.name ||
    (session?.user as any)?.email ||
    (status === "loading" ? "Loading..." : "Guest");

  // ✅ Home routing rule
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
    const id = window.setTimeout(() => setLoadingMsg(null), 650);
    return () => window.clearTimeout(id);
  }, [loadingMsg]);

  const nav: NavItem[] = useMemo(() => {
    if (!isAuthed) {
      return [
        { label: "Home", href: "/" },
        { label: "Login", href: "/login" },
        { label: "Sign Up", href: "/signup" },
        { label: "About", href: "/about" },
      ];
    }

    return [
      { label: "Home", href: homeHref },
      { label: "Extract", href: "/extract" },
      { label: "Pipeline", href: "/pipeline" },
      { label: "Apps", href: "/applications" },
    ];
  }, [isAuthed, homeHref]);

  return (
    <>
      {loadingMsg ? <LoadingOverlay message={loadingMsg} /> : null}

      <div
        className="desktop"
        style={{
          padding: 12,
          paddingBottom: "calc(var(--taskbar-h) + 18px)",
        }}
      >
        <div className="win95-window" style={{ width: "100%" }}>
          <div className="win95-titlebar">
            <span>Job Application Tracker</span>
            <div className="spacer" />
            <span style={{ fontWeight: 400, opacity: 0.9, fontSize: 12 }}>
              User: {username}
            </span>
          </div>

          <div className="win95-content" style={{ padding: 10 }}>
            {children}
          </div>

          <div className="win95-statusbar" style={{ justifyContent: "space-between" }}>
            <span>Status: Ready</span>
            <span style={{ opacity: 0.9 }}>Mobile</span>
          </div>
        </div>
      </div>

      <div className="taskbar" style={{ gap: 6 }}>
        {nav.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setLoadingMsg(`Opening ${item.label}...`)}
              className="win95-btn"
              style={{
                padding: "6px 8px",
                fontWeight: active ? 900 : 700,
                outline: active ? "1px dotted #000" : undefined,
                outlineOffset: active ? -4 : undefined,
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </Link>
          );
        })}

        <div className="clock win95-panel" style={{ marginLeft: "auto" }}>
          {clock}
        </div>
      </div>
    </>
  );
}
