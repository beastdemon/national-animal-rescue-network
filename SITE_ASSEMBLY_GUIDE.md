# Building the actual Google Site — the fast path

This is the hands-on, click-by-click guide to assembling the Google Site itself. `SITE_BUILD_KIT.md` has the full copy and nav plan; `LAUNCH_GUIDE.md` has the whole project sequence (Workspace, forms, policies, domain). This file is just: *how do I build the Sites pages efficiently, in what order, without redoing work.*

There is no way to script this part — new Google Sites has no import/export format or content API, so everything below is done by hand in the Sites editor (see `README.md` for why). The good news: it's mostly copy-paste once you know the order and the two quirks below.

## Two things to know before you touch anything

1. **A tile inside a multi-column layout (headings, captions, etc.) usually needs two clicks, not one.** The first click just *selects* it and shows a small floating toolbar with a pencil icon. Click the pencil (or press **Enter**) to actually start typing. A single click into a *lone* text box (not inside a multi-column block) usually goes straight to editable — you'll know because the formatting toolbar shows up immediately.
2. **After typing, click away and look back before you trust it saved.** This editor occasionally doesn't commit a paste-style edit if you navigate away too fast, especially on the first try in a freshly-inserted content block. If a heading or caption ever reverts to "Click to edit text" after you moved on, just redo it — click the tile, click the pencil, retype. It sticks every time on the second attempt.

## Step 1 — Set the theme first (10 min, do this before any content)

Doing this first means every page you build after inherits the brand automatically, instead of you re-styling text by hand 9 times.

1. Open the site, click **Themes** in the right sidebar.
2. Under **Custom**, click **Create theme** (the `+` tile).
3. **Page 1 — Name & images:** name it "Relay". Skip the logo/banner here — add the real logo in Step 1a below instead, since the theme wizard's logo slot is easy to fumble and isn't needed to get colors/fonts applied. Click **Next**.
4. **Page 2 — Colors:** click the **Custom colors** tab (not Preset colors). You'll see 3 color swatches with hex fields. Set them to:
   - `#0B3358` (deep navy — primary/dark role)
   - `#F5EEDF` (warm parchment — background role)
   - `#C63F17` (flare-orange — accent role)

   Click each swatch's hex field, clear it, type the code. Click **Next**.

   *Note: the full "Relay" palette has 9 tokens (see `SITE_BUILD_KIT.md` section 2) but Sites' theme system only takes 3. These three are the ones that matter site-wide — the finer distinctions (surface vs. background, the marigold accentAlt, etc.) already live inside the 10 Apps Script embeds' own CSS and aren't affected by this setting.*
5. **Page 3 — Fonts:** click the **Titles and headings** font field → **More fonts** → search **Fraunces** → check it → **Done** → select it. Repeat for **Body text**, searching **IBM Plex Sans**.
6. Click **Create theme**. It applies immediately, site-wide.

## Step 1a — Apply the logo and favicon (2 min)

Both files are ready: `assets/narn-logo.png` (icon + full "National Animal Rescue Network" wordmark) and `assets/narn-favicon.png` (icon only, square, transparent background).

1. **Logo:** hover the site name in the top-left of the page (next to the nav), where the editor shows a small **Edit logo** control. Click it, upload `assets/narn-logo.png`. Sites fits it into the header at a small size — this is normal, the source file is high-res so it stays sharp.
2. **Favicon:** click **Settings** (gear icon, main toolbar) → the site icon/favicon upload square is on the **General** tab. Upload `assets/narn-favicon.png` there. This is the small icon shown in the browser tab, not the same slot as the logo.
3. Save/close Settings. Both changes apply site-wide immediately, same as the theme.

## Step 2 — Fix the page order (2 min)

In the **Pages** tab, drag pages into this order:
```
Home
Adopt & Foster
Transport
Shelter & Rescue Partners
Get Involved
News & Resources
About
Give
```
Then drag **Contact** to sit *inside* **About** as a sub-page (drop it slightly indented under About, not between two top-level pages — the tree shows a nesting indicator when you're about to drop it as a child rather than a sibling).

## Step 3 — The repeatable recipe for every page

Every page — Home and the 6 new ones — currently has the same leftover consulting-template junk. Do this same cleanup on each one before adding real content:

1. Open the page. Click the header image → **Image** → upload a real photo (use `assets/narn-homepage-hero.png` on Home; for other pages, see the shot list in Step 3a below, or leave the current stock photo for now and swap later — don't let missing photos block getting the copy in).
2. Click the header title text, replace "[Page Name]" with the real page title from the nav list above.
3. Scroll down. You'll find a stray teal band reading **"Call or email to book an appointment: 555-555-5555 or [ email address ]"** — this is generic template filler, not shared/site-wide (each page got its own copy). Click it, click the trash/delete icon on its section toolbar (top-right of that section when hovered) to remove the whole section. Do this on every page.
4. If the page also has a leftover image carousel or an extra "National Animal Rescue Network" heading-over-photo section (mainly on Home), delete those sections the same way — hover the section, click **Delete section** in its toolbar.
5. Now the page is a clean slate: just the header. Add content using **Insert → Text box** for paragraphs, and **Insert → Content blocks** (the small preview tiles under Insert) for multi-column layouts like comparison cards or role grids.

## Step 3a — Photo shot list (real/stock, not AI)

Every header photo on the site should be a real photograph — either the network's own (once you have consented photos of actual dogs/volunteers) or licensed stock in the meantime. Free stock libraries (Unsplash, Pexels, Pixabay) all allow commercial nonprofit use without attribution; just avoid anything showing a recognizable branded shelter, visible license plate, or identifiable minor. Search terms below are starting points, not exact titles.

| Page | Subject & mood | Framing | Search terms |
|---|---|---|---|
| Home | Done — `assets/narn-homepage-hero.png` (volunteers with a group of shelter dogs, golden hour) | — | — |
| Adopt & Foster | A person on the floor or couch with one dog, warm domestic light — sells "this dog in a home," not "this dog in a kennel" | Wide banner, dog + one person, indoor or backyard | "foster dog home", "adopting shelter dog living room" |
| Transport | A dog being loaded into a car/van, or riding calmly in a crate in the back seat — conveys the journey, not distress | Wide banner, vehicle + crate/dog, daylight | "dog transport rescue van", "rescue dog car ride crate" |
| Shelter & Rescue Partners | A row of kennels or a volunteer working alongside shelter staff — grounds the "overlooked shelters" mission without looking bleak | Wide banner, human + shelter environment, not empty cages alone | "animal shelter volunteer kennel", "shelter staff dog walk" |
| Get Involved | A small group of different volunteers doing different tasks (one with a camera, one with a leash, one with a clipboard) — signals many roles, not just dog-walking | Wide banner, 2-3 people, varied activity | "animal rescue volunteers group", "shelter volunteer team" |
| News & Resources | Someone reading on a phone/tablet outdoors, or a community info table — informational, lower-key than the mission pages | Wide banner, calmer/neutral tone | "reading newsletter outdoors", "community info table" |
| About | A calm, editorial shot of a rescued dog resting or a hand gently on a dog — mission/values tone, not action | Wide banner, close/medium shot, soft light | "rescue dog resting calm", "hand petting rescue dog" |
| Give | A dog at a vet visit, or hands packing a supply box — shows where donations go | Wide banner, care/supplies focused | "shelter dog vet visit", "packing pet supply donation box" |

Google Sites header images crop to a wide banner automatically — pick landscape-orientation photos with the main subject centered or right-of-center (the site title text sits on the left).

## Step 4 — Page-by-page content

For each page, open the matching section of `SITE_BUILD_KIT.md` and paste its copy in. Rough content shape per page (exact wording is in `SITE_BUILD_KIT.md`, section noted):

| Page | SITE_BUILD_KIT.md section | Shape |
|---|---|---|
| Home | §4 | Hero (done) → quick-action band (4 tiles: Adopt/Foster/Transport/Give) → mission section → current needs → featured dogs → ways to help → newsletter → donation close |
| Adopt & Foster | §5 "Adopt & Foster landing page" | Intro (done) → 3-column comparison (done) → process line (done) → embed `dog-directory` app further down |
| Transport | §5 "Transport" | Headline/copy → 3 CTAs (Request/Volunteer/Fund) → embed transport coverage map (public My Map, not the private `transport-tracking` app) |
| Shelter & Rescue Partners | §5 "Shelter & Rescue Partners" | Intro → onboarding steps → embed `partner-directory` app |
| Get Involved | §5 "Get Involved" | Intro → role cards → embed `get-involved` app |
| News & Resources | §5 "News & Newsletter", "Resources" | Two sub-sections: news copy, then embed `resources-directory` and `newsletter-archive` apps |
| About | §5 "Shelter & Rescue Partners" area / §5 mission/board sections | Mission & how the network works → embed `state-champions` app → Board & Meetings copy |
| Give | §5 "Give", "Amazon Wishlists", "Future Projects" | Fund designations → embed `give-hub` app |

## Step 5 — Embedding the Apps Script mini-apps

Each app in `apps-script/` needs to be deployed once (its own `SETUP.md` has the exact steps — create the sheet tab, paste the code, Deploy → New deployment → Web app). Once you have a deployment URL:

1. On the target page, click **Insert → Embed**.
2. Choose **By URL**, paste the deployment URL.
3. Resize the frame so a few rows of cards are visible without excessive scrolling.

Do this once per app, on the page listed in the table above. `transport-tracking` is the one exception — never embed it; share its URL directly with drivers/coordinators (see its `SETUP.md`).

## Step 6 — Forms

Same pattern: build each Google Form from `FORM_BLUEPRINTS.md`, then **Insert → Embed → By URL** with the form's own share link, on the page it belongs to (Adoption Application → Adopt & Foster page, etc.).

## Step 7 — Publish

Once the public/private boundary is verified (see `IMPLEMENTATION_CHECKLIST.md`), click **Publish** in the top-right. Everything after this — domain, Analytics — is covered in `LAUNCH_GUIDE.md`.
