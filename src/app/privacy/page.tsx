export const metadata = {
  title: "Privacy Policy – Job Application Tracker",
};

export default function PrivacyPage() {
  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "0 16px",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
        lineHeight: 1.65,
      }}
    >
      <h1>Privacy Policy</h1>

      <p>
        This Privacy Policy explains how the Job Application Tracker web
        application and the Job Tracker browser extension handle information.
        This project is intended for personal job tracking.
      </p>

      <h2>1) What We Collect</h2>

      <h3>Account Data</h3>
      <ul>
        <li>
          <b>Username</b>
        </li>
        <li>
          <b>Password</b> (stored only as a <b>hashed</b> value, not plaintext)
        </li>
      </ul>

      <h3>Job Tracking Data (User Content)</h3>
      <p>
        If you use the app, you may store job-related content such as job
        posting text, company name, role title, status/pipeline data, notes, and
        links.
      </p>

      <h3>Extension Data</h3>
      <p>
        The browser extension reads page content from the currently active tab{" "}
        <b>only when you click</b> the extension button. It does not collect
        data automatically or in the background.
      </p>

      <h2>2) How We Use Data</h2>
      <ul>
        <li>To authenticate you and keep you signed in.</li>
        <li>To store and display your job applications and pipeline.</li>
        <li>
          To run AI-based parsing when you request it (for example, extracting
          structured fields from job description text).
        </li>
        <li>To improve reliability and fix bugs (limited technical logs).</li>
      </ul>

      <h2>3) AI Processing (OpenAI)</h2>
      <p>
        When you request AI parsing features, job posting text (and optionally
        a job URL/title) is sent to an AI provider to generate structured output.
        This data is sent only to perform the requested feature.
      </p>

      <h2>4) Analytics</h2>
      <p>
        The website may use Google Analytics to measure basic usage such as page
        views and traffic sources. We do not intentionally send passwords or
        other sensitive form values to analytics.
      </p>

      <h2>5) Advertising (AdSense)</h2>
      <p>
        If ads are enabled, third-party vendors (including Google) may use
        cookies or similar technologies to serve and measure ads. Ads are
        typically shown on public pages (for example, the homepage) and not
        inside private account areas.
      </p>

      <h2>6) Data Sharing</h2>
      <p>
        We do not sell your personal data. We share data only with service
        providers needed to run the app (for example: hosting, database,
        analytics, and AI processing), and only for the purposes described
        above.
      </p>

      <h2>7) Data Storage</h2>
      <p>
        Your saved applications and account data are stored in a database. The
        extension may temporarily pass extracted job text to the web app so you
        can review and save it.
      </p>

      <h2>8) Security</h2>
      <p>
        We use reasonable measures to protect data, including password hashing
        and access controls. However, no method of transmission or storage is
        100% secure.
      </p>

      <h2>9) Your Choices</h2>
      <ul>
        <li>You can stop using the extension at any time by uninstalling it.</li>
        <li>
          You can stop using the website at any time by ceasing to sign in.
        </li>
      </ul>

      <h2>10) Contact</h2>
      <p>
        Questions? Contact the maintainer at:{" "}
        <b>chukaazogu@gmail.com</b>
      </p>

      <p style={{ marginTop: 28, opacity: 0.75, fontSize: 13 }}>
        Last updated: {new Date().getFullYear()}
      </p>
    </main>
  );
}
