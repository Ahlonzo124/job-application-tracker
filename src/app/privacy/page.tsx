export const metadata = {
  title: "Privacy Policy – Job Application Tracker",
};

export default function PrivacyPage() {
  return (
    <main
      style={{
        maxWidth: "800px",
        margin: "40px auto",
        padding: "0 16px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        lineHeight: 1.6,
      }}
    >
      <h1>Privacy Policy</h1>

      <p>
        This privacy policy describes how the Job Tracker MVP Chrome extension
        and the Job Application Tracker web application handle user data.
      </p>

      <h2>Data Collection</h2>
      <p>
        The Chrome extension only processes website content (such as job
        descriptions) from the currently active browser tab when the user
        explicitly clicks the extension button.
      </p>

      <p>
        No data is collected automatically, passively, or in the background.
      </p>

      <h2>Use of Data</h2>
      <p>
        Extracted job posting text is sent only to the Job Application Tracker
        web application so the user can review, save, and manage job
        applications.
      </p>

      <p>
        The data is used solely for the extension’s single purpose: personal job
        tracking.
      </p>

      <h2>Data Sharing</h2>
      <p>
        User data is not sold, transferred, or shared with third parties.
      </p>

      <h2>Tracking and Analytics</h2>
      <p>
        The extension does not perform user tracking, analytics, advertising, or
        behavioral monitoring.
      </p>

      <h2>Security</h2>
      <p>
        Reasonable measures are taken to protect user data within the Job
        Application Tracker application.
      </p>

      <h2>Contact</h2>
      <p>
        If you have questions about this privacy policy, please contact the
        project maintainer through the Job Application Tracker website.
      </p>
    </main>
  );
}
