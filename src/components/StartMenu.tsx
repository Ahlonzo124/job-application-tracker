"use client";

import { useEffect, useRef, useState } from "react";
import DesktopNavLink from "@/components/DesktopNavLink";
import { signOut, useSession } from "next-auth/react";

type Item = { label: string; href: string };

const ITEMS: Item[] = [
  { label: "Home", href: "/" },
  { label: "Pipeline", href: "/pipeline" },
  { label: "Applications", href: "/applications" },
  { label: "Extract Job", href: "/extract" },
  { label: "Analytics", href: "/analytics" },
  { label: "About", href: "/about" },
];

export default function StartMenu({ onOpenApp }: { onOpenApp: (msg: string) => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";

  const username =
    (session?.user as any)?.username || session?.user?.name || session?.user?.email || "Guest";

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!open) return;
      const el = wrapRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        className="win95-btn start"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Start
      </button>

      {open ? (
        <div className="start-menu win95-window" role="menu">
          <div className="start-menu-stripe">
            <div className="start-menu-stripe-text">JOB TRACKER</div>
          </div>

          <div className="start-menu-items">
            {/* Who is logged in */}
            <div
              className="start-menu-item"
              style={{ cursor: "default", opacity: 0.9 }}
              role="menuitem"
              aria-disabled="true"
              onClick={(e) => e.preventDefault()}
            >
              User: <b>{username}</b>
            </div>

            <div className="start-menu-sep" />

            {ITEMS.map((it) => (
              <DesktopNavLink
                key={it.href}
                href={it.href}
                openLabel={it.label}
                className="start-menu-item"
                onNavigateStart={(msg) => {
                  onOpenApp(msg);
                  setOpen(false);
                }}
              >
                {it.label}
              </DesktopNavLink>
            ))}

            <div className="start-menu-sep" />

            {/* Auth actions */}
            {!isAuthed ? (
              <DesktopNavLink
                href="/signup"
                openLabel="Create Account"
                className="start-menu-item"
                onNavigateStart={(msg) => {
                  onOpenApp(msg);
                  setOpen(false);
                }}
              >
                Create Account
              </DesktopNavLink>
            ) : null}

            <DesktopNavLink
              href="/login"
              openLabel="Switch User"
              className="start-menu-item"
              onNavigateStart={(msg) => {
                onOpenApp(msg);
                setOpen(false);
              }}
            >
              Switch User
            </DesktopNavLink>

            {isAuthed ? (
              <a
                className="start-menu-item"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
                role="menuitem"
              >
                Log Out
              </a>
            ) : null}

            <div className="start-menu-sep" />

            <a
              className="start-menu-item"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setOpen(false);
              }}
              role="menuitem"
            >
              Close Menu
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
