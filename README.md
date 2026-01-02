# Job Tracker 95 🖥️📄

A Windows-95–style job application tracker built with **Next.js**, **Prisma**, and **AI-powered job parsing**.

This project combines a functional job-tracking MVP with a retro desktop UI inspired by classic Windows operating systems.

---

## ✨ Features

### 🧠 AI Job Parsing
- Paste a job description or provide a URL
- Chrome extension support for one-click job capture
- Automatically extracts:
  - Company
  - Job title
  - Location
  - Salary range
  - Job type / work mode
  - Key requirements & responsibilities
- Duplicate detection prevents saving the same job twice

---

### 🗂️ Application Management
- Table view of all applications
- Editable fields (notes, links, salary, stage)
- CSV export (Excel-compatible)

---

### 📌 Pipeline Board
- Visual Kanban pipeline:
  - Applied → Interview → Offer → Hired → Rejected
- Drag & drop cards between stages
- Order and stage persist to database
- Per-column scrolling for large pipelines
- Search applications by company or title

---

### 🖥️ Windows-95 Desktop UI
- Desktop icons (Home, Pipeline, Applications, Extract, Analytics, About)
- Start menu with fake app-launch loading dialogs
- Taskbar with clock and version display
- Pixel-art icons and classic Win95 window chrome
- “Welcome” Home app with step-by-step usage instructions

---

### 📊 Analytics
- Application counts per stage
- Percentage breakdown
- Summary stats (active vs rejected)

---

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router), React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: SQLite
- **ORM**: Prisma v7 (`@prisma/adapter-better-sqlite3`)
- **AI**: OpenAI (`gpt-4o-mini`)
- **Drag & Drop**: @dnd-kit
- **Styling**: Custom CSS (Windows 95 aesthetic)
- **Browser Extension**: Chrome extension for job extraction

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
