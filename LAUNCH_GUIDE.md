# Ship it — the one-path launch guide

Everything else in this repo is reference material. This file is the sequence: start at step 1, work down, and open the referenced file only when you get to that step. If you're handing this project to a co-founder or volunteer to actually execute, hand them this file first.

The model: Google Sites is the public front door. Google Forms collect applications. Private Sheets and Drive hold review records. Only approved, sanitized information reaches the public Google Sheet, and from there either straight into Google Sites content or into one of the nine `apps-script/` mini-apps embedded in Sites. Nothing publishes automatically — every submission passes through a human review step first.

## 0. Decisions only the organization can make

Nothing below can be finished until these are settled. Most of the build work (steps 2–6) can proceed in parallel while these are pending, but do not go public until they're resolved.

- [ ] Legal organization name, nonprofit/EIN representation, mission, service area, official contact details
- [ ] Organization-owned Google Workspace account, with at least two accountable site owners (not one person's personal Gmail)
- [ ] Adoption, foster, evaluation, partner, transport, volunteer, privacy, retention, and safety policies
- [ ] Donation processor, fund terms, receipt language — and whether gifts can be called tax-deductible yet (assume no until confirmed)
- [ ] Board member/public meeting information approved for publication
- [ ] State Champion names, public aliases, and photo/bio consent
- [ ] Named rescues/shelters/animal control centers and their permission to publish animals and capacity
- [ ] **Aviation partnership structure — still undecided.** Keep the public "Aviation Partnership Inquiry" page generic. Do not name any individual publicly until their role and consent are confirmed.
- [ ] **The real General Volunteer Application Google Form URL.** `apps-script/get-involved/Code.gs` ships with a placeholder (`GENERAL_VOLUNTEER_FORM_URL`) — the Get Involved page's nine "Apply for this role" buttons will not work until this is replaced.
- [ ] Email/newsletter platform and sender address
- [ ] Custom domain and Analytics property, if pursuing either

## 1. Set up the Workspace foundation

- [ ] Confirm the organization-owned Google Workspace account from step 0 is the one used for every file below — not a personal account.
- [ ] Open the two spreadsheets already linked in `README.md` (Public Website Content Hub, Private Operations Tracker). Delete the `TEMPLATE-DELETE-ME` rows in both before using or embedding either one.
- [ ] Create Google Groups for role-based Drive/Sheet access instead of sharing files person by person.

## 2. Build the 12 Google Forms

- [ ] Open `FORM_BLUEPRINTS.md` and build each of the 12 forms exactly as specified (purpose copy, fields, branching, audience, confirmation text).
- [ ] Link each form to its own private response Sheet. Restrict every response Sheet independently of the form itself.
- [ ] Record every form + response Sheet pair in the Private Operations Tracker's Form Registry, with an owner and backup owner.
- [ ] Test each form once with fake data: verify branching, confirmation copy, notification routing, and mobile layout.

## 3. Populate the public content

- [ ] Add real, approved rows only to the Public Website Content Hub — this is the boundary between private submissions and what the public ever sees (see the Approval rule in `SITE_BUILD_KIT.md` section 6).
- [ ] Create the additional tabs the mini-apps need (see step 5) before deploying those apps, or leave a tab empty/absent until you have real content — the apps degrade gracefully rather than erroring on an empty tab.

## 4. Build the Google Site

**See `SITE_ASSEMBLY_GUIDE.md` for the full click-by-click walkthrough** — theme setup with exact hex codes and fonts, page order, the per-page cleanup recipe, and where each app/form embeds. This section is just the checklist version:

- [ ] Create the public Google Site. Set up the "Relay" custom theme (colors + Fraunces/IBM Plex Sans fonts) first — it cascades to every page built after.
- [ ] Fix page order and nest Contact under About.
- [ ] Upload `assets/narn-homepage-hero.png` as the homepage hero.
- [ ] Build pages and navigation per `SITE_BUILD_KIT.md` sections 3–5 (nav structure, homepage blocks, and per-page copy). Build Home, About, Contact, Get Involved, Give, and Resources first — the rest can follow.
- [ ] Embed the relevant Google Form on each application/submission page (Adoption Application, Foster Application, Partner Application, Evaluator Application, Transport Request, Event Proposal, Newsletter Signup, Contact).

## 5. Deploy the ten Apps Script mini-apps

Each mini-app lives in its own `apps-script/<name>/` folder with its own `SETUP.md` — that file is the authority on the exact tab name, column headers, and deployment steps for that app. This is just the deploy order and what each one needs first:

| Folder | Needs this sheet tab first | Also needs |
|---|---|---|
| `dog-directory` | `Dogs` | — |
| `foster-openings` | `Foster Openings` | — |
| `partner-directory` | `Partner Directory` | — |
| `get-involved` | *(none required)* | Real `GENERAL_VOLUNTEER_FORM_URL` in `Code.gs`; optional `Volunteer Needs` tab for urgent callouts |
| `state-champions` | `State Champions` | `Congressional Delegation` tab optional (real US Senators/Representatives, sourced from senate.gov/house.gov) |
| `current-needs` | `Current Needs` | Staff-curated only — never point this at a raw operational tab |
| `resources-directory` | `Resources` | — |
| `give-hub` | `Give Funds`, `Wishlists`, `Future Projects` | — |
| `newsletter-archive` | `Newsletter Archive` | — |
| `transport-tracking` | `Transports`, `Transport Waypoints`, `Transport Checkpoints`, `Transport Admins` — on the **Private Operations Tracker**, not the public hub | At least one Transport Admin email; deploy with sign-in required (see its `SETUP.md` — this one's deployment settings are the opposite of the other eight); never embed on the public Site |

For each one: create the tab with the exact headers from its `SETUP.md`, add at least one real row, then follow that same `SETUP.md`'s "Create the web app" steps (script.google.com project → paste `Code.gs` → add `Index` HTML file → replace `appsscript.json` → run once to authorize → Deploy → New deployment → Web app → test the URL in a logged-out/private browser window → embed in Google Sites via Insert → Embed → URL).

- [ ] Deploy and embed the nine public apps before removing the "coming soon" placeholder from any page that references one. Deploy `transport-tracking` separately with its own (different, sign-in-required) settings and share its URL directly — do not embed it.
- [ ] After any urgent data correction, run that app's `clear*Cache` function from the Apps Script editor rather than waiting out the ~5 minute cache.

## 6. Calendar, map, donations, wishlists, newsletter

- [ ] Create a public Calendar (approved meetings, adoption events, fundraisers, orientations) and a broad public My Map (states/corridors/airports only — never exact addresses or real-time routes).
- [ ] Connect the donation processor from step 0. Never collect card/bank details in a Google Form.
- [ ] Verify every Amazon wishlist's owner, destination, and URL before publishing it in `give-hub`.
- [ ] Set up the email/newsletter platform from step 0 with consent, unsubscribe, and suppression handling; publish the current issue on the Site and in `newsletter-archive`.

## 7. QA before going public

Run every item in `IMPLEMENTATION_CHECKLIST.md` — it's the full pre-launch audit (ownership/safety, forms, public content, maps/calendar, donations, and the Apps Script mini-app checklist at the bottom). Do this after steps 1–6, not instead of them.

## 8. Go live

- [ ] Connect the custom domain and Analytics only after confirming the public/private boundary in QA — no private Sheet, application, evaluation, or exact route is reachable from a logged-out browser.
- [ ] Announce, and set a maintenance owner + review cadence for every dynamic section (dogs, openings, partner status, current needs, newsletter).

## Reference map

| File | What it's for |
|---|---|
| `SITE_ASSEMBLY_GUIDE.md` | Click-by-click guide to actually building the Google Site pages (theme, order, cleanup, embeds) |
| `SITE_BUILD_KIT.md` | Navigation, page-by-page copy, the "Relay" brand system |
| `FORM_BLUEPRINTS.md` | Exact fields/branching/copy for all 12 Google Forms |
| `IMPLEMENTATION_CHECKLIST.md` | Full pre-launch QA checklist |
| `apps-script/<name>/SETUP.md` | Per-app sheet schema and deployment steps |
| `README.md` | Drive/Sheet links and repo orientation |

## Packaging a non-git copy

The repo itself is the canonical package going forward. If someone needs a single zip to email or drop in Drive instead of cloning the repo, regenerate it from the repo root:

```
git archive --format=zip -o NARN-Google-Sites-Build-Kit.zip HEAD
```

This produces a zip of exactly what's committed — regenerate it any time after a commit rather than hand-editing the old one.
