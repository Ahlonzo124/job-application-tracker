# Changelog

All notable changes to this project are documented in this file.

This project follows a simple, human-readable versioning scheme.
Pre-release versions may change rapidly and are not considered stable.

---

## v0.4.2-pre

### Added
- First-login onboarding walkthrough (desktop and mobile)
- Guided Home instructions for signed-in users
- Dismissible onboarding with remembered completion state
- Version tracking to show onboarding for returning users after updates
- Chrome Extension download link
- Modal-based Pipeline interaction (no drag & drop)
- CSV export access restored to Pipeline
- Search in Pipeline with live per-status counts
- Mobile-friendly Pipeline interaction model
- Edit modal with full application details and sectioned layout
- Vertical scrolling per section in edit modal
- Analytics page mobile layout fixes

### Changed
- Pipeline redesigned from drag-and-drop board to managed status view
- Application status changes now done via explicit actions
- Home instructions updated to reflect “manage” instead of drag-and-drop
- ResponsiveShell behavior adjusted to prevent desktop → mobile switching on window resize
- Landing page feature copy updated for clarity and accuracy
- Mobile navigation behavior aligned with desktop routing
- Sign-out behavior standardized across desktop and mobile

### Fixed
- Mobile horizontal overflow on multiple pages (Pipeline, Analytics, Search)
- Edit modal layout issues on mobile
- Missing Pipeline CSV export
- Incorrect logout redirects
- Onboarding not appearing for returning users
- Search not updating status counts correctly
- Background and Win95 styling regressions in MobileShell

---

## v0.4.1-pre

### Added
- Onboarding infrastructure (user preferences API, version awareness)
- “What’s New” modal groundwork
- Application version tracking utilities

### Fixed
- Logout redirect inconsistencies
- Mobile taskbar navigation issues
- Home routing edge cases after authentication

---

## v0.4.0-pre

### Added
- Major desktop UI overhaul
- Dedicated MobileShell with mobile-first layout
- Signed-in Home / Quick Start instructions page
- Clear separation between public landing page and authenticated app
- Consistent Home routing across desktop, start menu, and mobile taskbar

### Changed
- Navigation behavior after login now routes to `/home`
- Home button inside the app no longer routes to the public landing page
- Layout system unified under ResponsiveShell

### Fixed
- Mobile layout overflow and nested window issues
- Horizontal scrolling artifacts on small screens
- Desktop duplicate rendering of Applications view

---
