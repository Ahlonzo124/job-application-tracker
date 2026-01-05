"use client";

import { useEffect, useState } from "react";
import DesktopShell from "@/components/DesktopShell";
import MobileShell from "@/components/MobileShell";

const MOBILE_MAX_WIDTH = 900;

export default function ResponsiveShell({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
    const update = () => setIsMobile(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  if (isMobile === null) return null;

  return isMobile ? <MobileShell>{children}</MobileShell> : <DesktopShell>{children}</DesktopShell>;
}
