# The National Animal Rescue Network — Google Sites build kit

This folder contains the first working foundation for a Google Sites website and its supporting Google Workspace workflows.

## What is ready

- `SITE_ASSEMBLY_GUIDE.md` — the click-by-click guide to actually building the Google Site: theme setup (exact hex codes/fonts), page order, per-page cleanup, and where each embed goes. Start here if you're the one clicking.
- `SITE_BUILD_KIT.md` — navigation, page layouts, ready-to-paste copy, the "Relay" brand system, and launch order.
- `FORM_BLUEPRINTS.md` — exact purpose, fields, branching, access, and confirmation copy for the recommended Google Forms.
- `IMPLEMENTATION_CHECKLIST.md` — a practical build and launch checklist for Google Sites, Forms, Sheets, Calendar, Maps, donations, and newsletter delivery.
- `assets/narn-homepage-hero.png` — an original wide hero image generated for the homepage.
- `assets/narn-logo.png` / `assets/narn-favicon.png` — the network's logo (icon + full wordmark) and square favicon, navy on transparent. See `SITE_ASSEMBLY_GUIDE.md` Step 1a for exactly where each one gets uploaded in Sites.
- `apps-script/` — nine working, embeddable Google Apps Script mini-apps, all sharing one design system so they read as one product inside Google Sites. Each reads its own approved tab of the Public Website Content Hub; none ever read the Private Operations Tracker or raw unreviewed submissions. See each folder's `SETUP.md` for the exact sheet tab and columns it needs, and the deployment/embed steps.
  - `dog-directory/` — filterable directory of approved dogs.
  - `foster-openings/` — filterable board of open foster needs.
  - `partner-directory/` — shelter/rescue/animal-control partner directory with auto-staling capacity status.
  - `get-involved/` — the nine volunteer role cards, deep-linking to the general volunteer application.
  - `state-champions/` — "meet our Champions" roster (consent-gated photo + bio per state) and open-seat applications for the network's own state-level advocacy role — clearly distinct from actual elected officials. Each state's card also lists that state's real US Senators and US House Representatives for reference, and the page links out to Congress.gov's directory of state legislature sites rather than hand-tracking state senators/representatives.
  - `current-needs/` — compact homepage widget for the top 3 curated urgent needs.
  - `resources-directory/` — filterable resource list by audience.
  - `give-hub/` — fund designations, Amazon wishlists, and future-project funding progress in one tabbed page.
  - `newsletter-archive/` — reverse-chronological newsletter issue archive.
  - `transport-tracking/` — **different from the other eight**: private, sign-in-gated, and read+write. Reads/writes the Private Operations Tracker (not the public hub), shows each signed-in driver/coordinator only their own assigned transports (admins see all), and lets them log checkpoint statuses against coordinator-defined waypoints on a free Leaflet/OpenStreetMap map. No messaging feature — pairs with the network's existing group text/WhatsApp thread rather than replacing it. Never embed this one on the public Site; share its deployment URL directly with drivers/coordinators.

## Google Drive assets

- Project folder: https://drive.google.com/drive/folders/1H3RdUCfAiWIIEvDzBGwOx4ZQb_3O5gTe
- Website build guide: https://docs.google.com/document/d/1FHjuWGDPRrsJWfTxGikJkuvahJ-LG5BPfYofaYDVmCw/edit
- Public Website Content Hub: https://docs.google.com/spreadsheets/d/1RmsTUYjzOMbP_2a9L4IPT55xeo284N97f4dxiFN9jDU/edit
- Private Operations Tracker: https://docs.google.com/spreadsheets/d/1kjfmQncW2LBI2-Lo9T4SzYW7lC-ddHZy_f9kNUlA1NY/edit

Both Sheets contain a clearly labeled template row. Delete those rows before live use. Keep the private tracker restricted. Do not publish or embed it.

## Recommended launch model

Google Sites is the public front door. Google Forms collect applications and partner submissions. Private Sheets and Drive hold review records. Only approved, sanitized information moves into the Public Website Content Hub. Public calendars, broad service-area maps, newsletter archives, Amazon wishlists, and secure donation links are embedded or linked from the site.

The Google Site itself still needs to be created in the Google Sites editor because new Google Sites does not provide a general site-creation API. Everything in this kit is organized so that build is mostly copy, paste, embed, and link work.

