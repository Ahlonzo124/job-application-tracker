import { requireAuth } from "@/lib/requireAuth";
import DesktopNavLink from "@/components/DesktopNavLink";

export default async function AppHome() {
  await requireAuth();

  return (
    <div>
      <div className="win95-panel" style={{ padding: 10, marginBottom: 10 }}>
        <div style={{ fontWeight: 900 }}>Welcome</div>
        <div style={{ marginTop: 6 }}>
          This is a Windows-95 style job tracking desktop. Follow the steps below.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 12 }}>
        {/* Left: Step-by-step instructions */}
        <div className="win95-panel" style={{ padding: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 10 }}>
            How to use Job Tracker 95 (Step-by-step)
          </div>

          <div className="win95-bevel-inset" style={{ padding: 12, background: "#fff" }}>
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              <li style={{ marginBottom: 10 }}>
                <b>Add a job</b>:
                <div style={{ marginTop: 4 }}>
                  Use <b>Extract Job</b> to paste a job description or use the Chrome extension
                  to send a posting to the site.
                </div>
              </li>

              <li style={{ marginBottom: 10 }}>
                <b>Review AI results</b>:
                <div style={{ marginTop: 4 }}>
                  Edit company/title/location/salary/requirements if needed, then click <b>Save</b>.
                </div>
              </li>

              <li style={{ marginBottom: 10 }}>
                <b>Track progress</b>:
                <div style={{ marginTop: 4 }}>
                  Open <b>Pipeline</b> and drag cards between stages (Applied → Interview → Offer → Hired → Rejected).
                </div>
              </li>

              <li style={{ marginBottom: 10 }}>
                <b>Edit anytime</b>:
                <div style={{ marginTop: 4 }}>
                  Click a card in the pipeline to open the editor drawer. Update stage, notes, URL, etc.
                </div>
              </li>

              <li>
                <b>Export</b>:
                <div style={{ marginTop: 4 }}>
                  From Pipeline, click <b>Export CSV</b> to download a spreadsheet-friendly export.
                </div>
              </li>
            </ol>
          </div>

          <div style={{ height: 12 }} />

          {/* Keep "What this can do" at the bottom */}
          <div className="win95-panel" style={{ padding: 12 }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>What this can do</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>AI parsing: company, title, location, salary, requirements</li>
              <li>Pipeline board: drag/drop between stages</li>
              <li>Inline editing + notes</li>
              <li>Duplicate detection</li>
              <li>CSV export</li>
            </ul>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="win95-panel" style={{ padding: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Open an App</div>

          <div style={{ display: "grid", gap: 8 }}>
            <DesktopNavLink className="win95-btn" href="/app" openLabel="Home">
              Home
            </DesktopNavLink>
            <DesktopNavLink className="win95-btn" href="/pipeline" openLabel="Pipeline">
              Pipeline
            </DesktopNavLink>
            <DesktopNavLink className="win95-btn" href="/applications" openLabel="Applications">
              Applications
            </DesktopNavLink>
            <DesktopNavLink className="win95-btn" href="/extract" openLabel="Extract Job">
              Extract Job
            </DesktopNavLink>
            <DesktopNavLink className="win95-btn" href="/analytics" openLabel="Analytics">
              Analytics
            </DesktopNavLink>
            <DesktopNavLink className="win95-btn" href="/about" openLabel="About">
              About
            </DesktopNavLink>
          </div>

          <div style={{ height: 12 }} />

          <div className="win95-bevel-inset" style={{ padding: 10, background: "#fff" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Tip</div>
            <div style={{ fontSize: 12 }}>
              Use the Start menu or desktop icons. Everything opens like a real Windows app.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
