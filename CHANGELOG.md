# Changelog

All notable changes to this project are documented in this file.

This project follows a simple, human-readable versioning scheme.
Pre-release versions may change rapidly and are not considered stable.

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

