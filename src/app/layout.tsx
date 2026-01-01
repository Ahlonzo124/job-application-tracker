import "./globals.css";
import type { Metadata } from "next";
import DesktopShell from "@/components/DesktopShell";

export const metadata: Metadata = {
  title: "Job Application Tracker",
  description: "Track job applications like it's 1995.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DesktopShell>{children}</DesktopShell>
      </body>
    </html>
  );
}
