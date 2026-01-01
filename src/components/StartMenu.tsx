"use client";

import { useEffect, useRef, useState } from "react";
import DesktopNavLink from "@/components/DesktopNavLink";

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
