# Give hub setup

This optional Apps Script web app turns three approved tabs of the Public Website Content Hub — `Give Funds`, `Wishlists`, and `Future Projects` — into a single tabbed page: "Where your gift goes," "Amazon wishlists," and "Future projects." It never reads the Private Operations Tracker or raw, unreviewed submissions.

One `getGiveHubData` call on the server reads all three tabs and returns them together as `{ funds, wishlists, projects }`, cached as one entry, instead of three separate `google.script.run` calls — they're small tabs maintained by the same staff and always shown together on this one page, so one call is simpler to reason about than three.

## Before deployment

Add (or confirm) all three tabs below in the Public Website Content Hub, each with a header row spelled exactly as shown. Any tab that's missing, or missing a required column, makes the whole page fail to load (see Operation), so set up all three before deploying.

1. **`Give Funds`** — the fund cards under "Where your gift goes."
   - `Fund Name`
   - `Description`
   - `Donate URL`

   Render whatever rows exist — the seven designations (`General`, `Transport`, `Medical`, `Foster Support`, `Dog Sponsorship`, `Dog Food Truck`, `Mobile Bathing and Grooming`) are not hardcoded in the script, so staff can add, rename, or retire a fund by editing the sheet, no redeploy required. There's no dedicated ID column on this tab — `Fund Name` doubles as the identifying column, so a template row's `Fund Name` should start with `TEMPLATE-` to stay hidden.

2. **`Wishlists`** — the cards under "Amazon wishlists."
   - `Program Or Partner`
   - `Destination`
   - `Priority Needs`
   - `Wishlist URL`
   - `Last Verified`

   `Wishlist URL` must be `https://` — a common case is an amazon.com or amzn.to link, but the field isn't restricted to those hosts; any public `https://` wishlist or registry link works. A non-`https://` value is dropped and the card renders without a "View wishlist" button. `Program Or Partner` doubles as the identifying column for the `TEMPLATE-` filter, same as `Fund Name` above.

3. **`Future Projects`** — the progress-bar cards under "Future projects."
   - `Project Name`
   - `Description`
   - `Goal Amount`
   - `Raised Amount`
   - `Milestone Note`

   `Goal Amount` and `Raised Amount` can be typed as plain numbers or currency-formatted text (`25000` or `$25,000` both work) — the script strips everything but digits, a decimal point, and a leading minus sign before doing the math. The progress bar clamps visually at 100% even if `Raised Amount` exceeds `Goal Amount`. `Project Name` doubles as the identifying column for the `TEMPLATE-` filter.

**Public-safe means public-safe** on all three tabs: every row here is something the organization is comfortable with any stranger on the internet reading and clicking — a donate link, a public wishlist, a project pitch. No internal fundraising targets that haven't been approved for public display, no donor names or amounts, no draft or unapproved project write-ups, and no login-gated links.

## Create the web app

1. Go to https://script.google.com and create a new project owned by the organization account.
2. Replace the default `Code.gs` with this folder's `Code.gs`.
3. Add an HTML file named `Index` and paste `Index.html` into it.
4. In Project Settings, enable "Show appsscript.json manifest file in editor," then replace it with this folder's `appsscript.json`.
5. Confirm `CONFIG.SPREADSHEET_ID` matches the Public Website Content Hub. It is prefilled for the Sheet created with this kit.
6. Run `getGiveHubData` once from the editor and authorize the script using the organization account.
7. Choose **Deploy → New deployment → Web app**.
8. Execute as the organization owner. Choose the audience needed for a truly public site. Review the authorization language carefully.
9. Open the deployment URL in a private/logged-out browser and verify that visitors are not prompted to sign in.
10. In Google Sites, choose **Insert → Embed → URL**, paste the deployment URL, and size the frame so the three tabs and a row of cards are comfortably visible.

## Operation

- All three tabs cache together, for five minutes, under one cache entry.
- Run `clearGiveHubCache` from the editor after an urgent edit to any of the three tabs if you need the page to refresh immediately.
- Rows whose identifying column (`Fund Name`, `Program Or Partner`, or `Project Name`) begins with `TEMPLATE-` never display.
- If any of the three tabs is missing, or is missing a required column, the whole page shows an error state instead of a partial page — fix the sheet and reload rather than trying to work around it from the browser.
- The browser builds text using safe DOM methods rather than inserting Sheet content as raw HTML.
- Donate and wishlist links must begin with HTTPS; other values are dropped and the card renders without that button.

Any change to the script requires updating the web-app deployment. Test the deployment URL again after every update.
