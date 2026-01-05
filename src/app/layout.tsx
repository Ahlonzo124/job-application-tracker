import "./globals.css";
import type { Metadata } from "next";
import DesktopShell from "@/components/DesktopShell";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Job Application Tracker",
  description: "Track job applications like it's 1995.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Google Analytics (raw scripts, visible in view-source) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-9JLBGCQ72S"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-9JLBGCQ72S', {
                anonymize_ip: true,
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>

      <body>
        <Providers>
          <DesktopShell>{children}</DesktopShell>
        </Providers>
      </body>
    </html>
  );
}
