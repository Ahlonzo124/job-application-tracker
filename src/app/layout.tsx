import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
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
        {/* ✅ AdSense (must be visible to crawlers; load early) */}
        <Script
          id="adsense"
          strategy="beforeInteractive"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9366880450381021"
          crossOrigin="anonymous"
        />

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9JLBGCQ72S"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-9JLBGCQ72S', {
              anonymize_ip: true,
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </head>

      <body>
        <Providers>
          <DesktopShell>{children}</DesktopShell>
        </Providers>
      </body>
    </html>
  );
}
