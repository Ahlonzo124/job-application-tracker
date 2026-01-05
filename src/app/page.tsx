import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      {/* ✅ AdSense – landing page only */}
      <script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9366880450381021"
        crossOrigin="anonymous"
      ></script>

      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#008080",
          padding: 24,
        }}
      >
        <div className="win95-window" style={{ width: 520 }}>
          <div className="win95-titlebar">
            <span>Job Tracker 95</span>
          </div>

          <div className="win95-content">
            <h2 style={{ marginTop: 0 }}>
              Track job applications like it’s 1995
            </h2>

            <p>
              A private, desktop-style job tracker with AI-assisted parsing and a
              classic Windows-95 interface.
            </p>

            <ul>
              <li>No feeds</li>
              <li>No selling your data</li>
              <li>No subscriptions</li>
            </ul>

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <Link href="/login" className="win95-btn">
                Log In
              </Link>
              <Link href="/signup" className="win95-btn">
                Sign Up
              </Link>
              <Link href="/about" className="win95-btn">
                About
              </Link>
            </div>

            <div style={{ marginTop: 16, fontSize: 12 }}>
              Chrome extension available (pending approval).
            </div>

            {/* Optional future ad slot placeholder */}
            <div style={{ marginTop: 24, fontSize: 11, opacity: 0.6 }}>
              Advertisement
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
