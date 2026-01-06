"use client";

import { useEffect, useState } from "react";
import DesktopShell from "@/components/DesktopShell";
import MobileShell from "@/components/MobileShell";

const MOBILE_MAX_WIDTH = 900;

function isTouchDevice() {
  if (typeof window === "undefined") return false;

  const maxTouchPoints =
    navigator.maxTouchPoints ||
    (navigator as any).msMaxTouchPoints ||
    0;

  const hasTouchPoints = maxTouchPoints > 0;

  const coarsePointer =
    window.matchMedia("(pointer: coarse)").matches;

  const noHover =
    window.matchMedia("(hover: none)").matches;

  return hasTouchPoints || (coarsePointer && noHover);
}

export default function ResponsiveShell({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);

    const update = () => {
      const narrow = media.matches;
      const touch = isTouchDevice();

      // ✅ Only mobile if BOTH narrow screen AND touch device
      setIsMobile(narrow && touch);
    };

    update();
    media.addEventListener("change", update);
    window.addEventListener("resize", update);

    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  if (isMobile === null) return null;

  return isMobile
    ? <MobileShell>{children}</MobileShell>
    : <DesktopShell>{children}</DesktopShell>;
}
