# Google Sites implementation and launch checklist

## Ownership and safety

- [ ] Use an organization-controlled Google Workspace account, not a volunteer’s personal Gmail, as the long-term owner.
- [ ] Assign at least two accountable site owners and document recovery procedures.
- [ ] Apply for Google for Nonprofits if eligible.
- [ ] Approve privacy, data retention/deletion, transport safety, animal disclosure, screening, photo rights, and incident policies.
- [ ] Keep the Private Operations Tracker and raw Form response Sheets restricted.
- [ ] Create Google Groups for role-based access rather than sharing every file person by person.
- [ ] Confirm which board meetings, people, documents, and contact aliases are public.

## Google Sites build

- [ ] Create the public Site with the navigation in `SITE_BUILD_KIT.md`.
- [ ] Apply the teal/rust/cream theme and upload `assets/narn-homepage-hero.png`.
- [ ] Build the homepage in this order: hero, quick actions, mission, current needs, featured dogs, volunteer roles, newsletter, donation close.
- [ ] Add a consistent footer with legal organization name, official contact, privacy, accessibility/contact option, donation disclosure, and social links.
- [ ] Use one primary action per section and descriptive button labels; avoid “click here.”
- [ ] Use heading levels in order and add alt text to every meaningful image.
- [ ] Check text contrast and avoid placing body copy directly over busy photography.
- [ ] Use the announcement banner only for current urgent needs and remove expired notices.

## Forms and workflow

- [ ] Build the 12 Forms in `FORM_BLUEPRINTS.md`.
- [ ] Create separate private response Sheets and identify a form owner and backup owner.
- [ ] Add purpose, next steps, privacy link, consent, and confirmation copy to every form.
- [ ] Test branching, validation, confirmation emails, response receipts, and mobile use.
- [ ] Restrict partner, evaluator, animal-upload, availability-update, and transport forms to approved audiences.
- [ ] Confirm file-upload requirements, type limits, count limits, size limits, and organization storage ownership.
- [ ] Record every Form and response Sheet in the Private Operations Tracker’s Form Registry.
- [ ] Document coordinator review and escalation responsibilities.

## Animals and public content

- [ ] Delete the TEMPLATE-DELETE-ME rows before using or embedding either workbook.
- [ ] Populate only reviewed, public-safe fields in the Public Website Content Hub.
- [ ] Add a unique Dog ID to every intake, evaluation, listing, application link, sponsor link, and transport case.
- [ ] Establish a status-update schedule and archive adopted/transferred/stale listings promptly.
- [ ] Record permission for each photo and public bio.
- [ ] Use Yes/No/Unknown rather than presenting missing compatibility information as positive.
- [ ] Deploy the `apps-script/dog-directory/` mini-app or manually create a consistent Google Sites profile for each active dog.

## Apps Script mini-apps (`apps-script/`)

- [ ] For each of the 9 mini-apps, create its required sheet tab in the Public Website Content Hub with the exact column headers listed in that folder's `SETUP.md`: `dog-directory` (Dogs), `foster-openings` (Foster Openings), `partner-directory` (Partner Directory), `get-involved` (Volunteer Needs — optional), `state-representatives` (State Representatives), `current-needs` (Current Needs — staff-curated only, never raw operational data), `resources-directory` (Resources), `give-hub` (Give Funds, Wishlists, Future Projects), `newsletter-archive` (Newsletter Archive).
- [ ] Replace the placeholder `GENERAL_VOLUNTEER_FORM_URL` in `apps-script/get-involved/Code.gs` with the real, published General Volunteer Application Google Form URL before deploying that app.
- [ ] Deploy each mini-app as its own Apps Script web app following the folder's `SETUP.md`, test the deployment URL in a logged-out browser, then embed it in Google Sites via Insert → Embed → URL.
- [ ] After any urgent edit to a tab, run that app's `clear*Cache` function from the Apps Script editor if you don't want to wait out the ~5 minute cache.
- [ ] Confirm all 9 public mini-apps share the same "Relay" brand system (colors, fonts, component styles) documented in `SITE_BUILD_KIT.md` section 2 — they were built and cross-checked together for this, but re-verify after any future edit to one of them.

## Transport tracking (`apps-script/transport-tracking/`) — private, sign-in-gated, separate from the checklist above

- [ ] Create its four tabs (Transports, Transport Waypoints, Transport Checkpoints, Transport Admins) on the **Private Operations Tracker**, not the public hub. Exact headers are in its `SETUP.md`.
- [ ] Add at least one real email to `Transport Admins` before relying on this tool.
- [ ] Deploy with **Execute as: User accessing the web app** and **Who has access: Anyone with a Google account** — never "Anyone, even anonymous." This is the opposite of how the other 9 apps are deployed; double-check it.
- [ ] Verify every `Assigned Driver Email` / `Backup Contact Email` / `Coordinator Email` is a real Google account email, entered exactly as that person signs in.
- [ ] Test cross-user isolation before trusting it: open the deployment URL as a Transport Admin and confirm you see everything; open it in a separate signed-in session as one specific assigned driver and confirm they see only their own transport(s) — including checking the raw `google.script.run` response in browser devtools, not just what renders.
- [ ] Do not embed this page on the public Google Site or link to it from public nav. Share the deployment URL directly with drivers/coordinators.

## Maps, calendar, and meetings

- [ ] Create a public Calendar for approved meetings, adoption events, fundraisers, and orientations.
- [ ] Keep private board links and working materials on a separate restricted calendar/hub.
- [ ] Create a public My Map showing only states, cities, counties, airports, corridors, and broad service areas.
- [ ] Keep personal addresses, overnight locations, handoff details, and real-time routes private.
- [ ] Check permissions on every embedded Calendar, Map, Doc, Sheet, and file in a logged-out browser.

## Donations, wishlists, and newsletter

- [ ] Select a secure nonprofit payment processor supporting recurring gifts, designations, receipts, and campaign or dog IDs.
- [ ] Never collect card or bank details in Google Forms or Sheets.
- [ ] Confirm tax-deductibility and restricted-gift language with the organization’s qualified advisor before publishing.
- [ ] Verify every Amazon wishlist owner, destination, URL, and last-reviewed date.
- [ ] Select an email platform or confirm eligible Gmail mail merge; configure consent, unsubscribe, bounce, and suppression handling.
- [ ] Publish the same monthly newsletter on the Site and retain an accessible archive.

## Domain, analytics, and launch QA

- [ ] Connect a custom domain only after the public Site and embedded assets have correct permissions.
- [ ] Add Google Analytics if desired and disclose tracking as required by the organization’s policy and applicable law.
- [ ] Test every page on desktop and mobile.
- [ ] Test keyboard navigation, focus order, alt text, contrast, zoom, and form errors.
- [ ] Submit every Form once with test data; verify routing, notifications, access, and deletion.
- [ ] Test every CTA, dog-specific application link, sponsor link, wishlist, calendar, map, and downloadable file.
- [ ] Verify no private Sheet, applicant data, personal address, evaluation, exact transport route, draft minutes, or internal notes are public.
- [ ] Add a maintenance owner and review cadence to every dynamic section.

