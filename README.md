```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   JOB TRACKER 95                                         │
│   ----------------------------------------------------   │
│   Job Application Tracking Software                      │
│   Version 0.4.0 (Pre-Release)                            │
│                                                          │
│   (c) Personal Productivity Software                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

# Job Tracker 95 (v0.4.0-pre)

A Windows-95–style **Job Application Tracker** that behaves like a desktop operating system.

Track job applications in a pipeline, extract job postings with AI, and export everything to CSV — all inside a retro desktop environment with windows, icons, a Start menu, and fake loading dialogs.

This project is intentionally **not modern**.  
No dashboards. No feeds. No social features.  
Just a private, single-user-first tool that feels like software from another era.

---

## Overview

Job Tracker 95 runs like a classic desktop OS:

- Desktop icons
- Start menu
- Taskbar with clock
- Windowed applications
- Fake loading screens
- Separate public and signed-in experiences

The public landing page remains a classic static entry point.  
Once signed in, users enter a **dedicated Home / Instructions screen** that explains how to use the system.

---

## Features

### Desktop-Style UI (Windows 95 Aesthetic)

- Desktop icons with double-click behavior
- Start menu with application list
- Taskbar with live clock
- Windowed applications with title bars
- Fake loading overlays when opening apps
- Username displayed in taskbar and window titles
- Signed-in Home page with usage instructions

### Mobile Support (v0.4.0)

- Dedicated MobileShell (not simple scaling)
- Windowed UI adapted for small screens
- Bottom taskbar navigation on mobile
- Same application flow as desktop
- No duplicated windows or layout overflow

### AI Job Extraction

- Paste job description text
- Paste a job posting URL
- Chrome extension (pending store approval)
- AI extracts structured fields:
  - Company, title, location
  - Salary range, currency, pay period
  - Job type, work mode, seniority
  - Responsibilities and requirements
- Duplicate detection per user

### Applications

- Table view of saved job applications
- Search and filtering
- Editable notes and metadata
- CSV export (Excel compatible)
- Per-user data isolation

### Pipeline Board

- Kanban-style workflow:
  - Applied → Interview → Offer → Hired → Rejected
- Drag and drop between stages
- Order persists to the database
- Designed to feel like classic productivity software

### Analytics

- Per-user statistics
- Counts by pipeline stage
- Active vs rejected tracking
- Built for future chart expansion

---

## Authentication & User Flow

- Public landing page at `/` (ads enabled)
- Signup and login via username + password
- After login, users land on a **signed-in Home / Quick Start page**
- Home button inside the app always returns to this page
- No email required
- No password recovery (intentional design choice)

---

## Tech Stack

### Frontend

- Next.js (App Router)
- React + TypeScript
- Custom CSS (Windows 95 aesthetic)
- ResponsiveShell (desktop and mobile)
- @dnd-kit for drag and drop

### Backend

- Next.js Route Handlers (`/app/api`)
- Prisma v7 ORM

### Database

- SQLite (local development)
- Planned production database: PostgreSQL (Neon)

### Authentication

- NextAuth (Credentials provider)
- bcrypt password hashing
- JWT sessions
- No email, no OAuth, no recovery

### AI

- OpenAI (`gpt-4o-mini`)
- Structured JSON schema outputs
- Authentication required for all AI endpoints

---

## Security & Multi-User Support

- Signup and login implemented
- All application pages require authentication
- All API routes are protected
- All data scoped by `userId`
- Ownership checks on update, delete, and reorder
- AI endpoints require login (prevents abuse)
- CSV export is per-user only

Important: There is **no password recovery**.  
Users must store credentials themselves.

---

## Local Development

### 1) Install dependencies

```bash
npm install
```

### 2) Set environment variables

Create `.env.local`:

```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret"
OPENAI_API_KEY="your-key"
```

### 3) Run database migrations

```bash
npx prisma migrate dev
```

### 4) Start development server

```bash
npm run dev
```

Application runs at:
- http://localhost:3000
- http://<your-lan-ip>:3000 (for mobile testing)

---

## Versioning

- v0.4.0-pre  
  Major UI overhaul, mobile support, signed-in home flow

Earlier versions focused on core functionality.  
This release establishes the **final UI direction**.

---

## Design Philosophy

Job Tracker 95 is built around these ideas:

- Software should feel like a tool, not a feed
- Personal data should stay private
- UI can be expressive without being modern
- Nostalgia can be functional
- Not everything needs to be a SaaS
