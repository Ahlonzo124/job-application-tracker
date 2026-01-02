# Job Tracker 95 (v0.3.1)

A Windows-95–style **Job Application Tracker** that behaves like a desktop OS.
Track job applications in a pipeline, extract job postings with AI, and export everything to CSV.

This project is intentionally **retro**: desktop icons, Start menu, taskbar clock, windowed apps, and fake loading dialogs — not a modern SaaS dashboard.

---

## Features

### 🖥️ Win95 Desktop UI
- Desktop icons + Start menu
- Taskbar with live clock
- Windowed apps (Home, Pipeline, Applications, etc.)
- Fake loading overlays when opening apps
- Username shown in taskbar and window title

### 🤖 AI Job Extraction & Parsing
- Paste job text, provide a URL, or use the Chrome extension
- AI extracts structured fields:
  - Company, title, location
  - Salary range, currency, period
  - Job type, work mode, seniority
  - Responsibilities & requirements
- Duplicate detection (per user)

### 📂 Applications
- Table view with search/filter
- Edit notes, URLs, metadata
- **CSV export** (Excel-compatible)

### 🧩 Pipeline Board
- Kanban stages:
  - Applied → Interview → Offer → Hired → Rejected
- Drag & drop across columns
- Order persists to database

### 📊 Analytics
- Per-user statistics
- Counts by stage
- Active vs rejected
- Designed for future chart expansion

---

## Tech Stack

**Frontend**
- Next.js (App Router)
- React + TypeScript
- Custom CSS (Win95 aesthetic)
- @dnd-kit (drag & drop)

**Backend**
- Next.js Route Handlers (`/app/api`)
- Prisma v7

**Database**
- SQLite (local development)
- Planned: PostgreSQL (Neon) for production

**Auth**
- NextAuth (Credentials provider)
- Username + password (bcrypt)
- JWT sessions
- No email, no password recovery (intentional)

**AI**
- OpenAI (`gpt-4o-mini`)
- Structured JSON schema outputs

---

## Security & Multi-User Support

- Signup + login implemented
- All pages protected
- All API routes require authentication
- All application data scoped by `userId`
- Ownership checks on update / delete / reorder
- AI endpoints require login (prevents quota abuse)
- CSV export scoped per user

⚠️ **No password recovery** — users must save credentials.

---

## Local Development

### 1) Install dependencies
```bash
npm install
