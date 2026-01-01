"use client";

import { useRouter } from "next/navigation";
import React from "react";

type Props = {
  href: string;
  openLabel?: string; // "Pipeline" -> "Opening Pipeline..."
  className?: string;
  children: React.ReactNode;
  onNavigateStart?: (msg: string) => void;
};

export default function DesktopNavLink({
  href,
  openLabel,
  className,
  children,
  onNavigateStart,
}: Props) {
  const router = useRouter();

  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        // allow new tab / ctrl click
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
          return;

        e.preventDefault();

        const msg = `Opening ${openLabel ?? "Application"}...`;
        onNavigateStart?.(msg);

        // pseudo loading delay for the Win95 feel
        window.setTimeout(() => {
          router.push(href);
        }, 650);
      }}
    >
      {children}
    </a>
  );
}
