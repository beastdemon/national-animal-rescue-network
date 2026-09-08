# Current Needs widget setup

This optional Apps Script web app turns approved rows from the `Current Needs` tab of the Public Website Content Hub into a compact, three-card homepage widget. It never reads the Private Operations Tracker, and it never reads the raw Foster Openings, Transport, or Sponsorship operational tabs directly — only this one small, staff-curated public tab.

## Before deployment

1. Open the Public Website Content Hub.
2. Add (or confirm) a tab named exactly `Current Needs` with these column headers in row 1, spelled exactly as shown:
   - `Need ID`
   - `Category` (`Foster`, `Transport`, `Medical`, `Sponsorship`, or `Other`)
   - `State`
   - `Headline` (short — e.g. "Transport needed: TX to OH")
   - `Urgency` (use `Urgent`, `Priority`, or `Routine` — rows sort in that order, so keep it consistent)
   - `Last Verified`
   - `Action Label` (the exact button text, e.g. "Volunteer to drive")
   - `Action URL`
   - `Active` (`Yes` or `No`)
3. Delete the `TEMPLATE-DELETE-ME` row.
4. Add at least one need with `Active` set to `Yes` if you want the widget to show anything.
5. Use HTTPS action URLs only (a public volunteer form, a specific fundraiser page, etc.).
6. **Public-safe means public-safe.** Every row in this tab must already be staff-reviewed, sanitized summary copy — never an exact address, a private phone number or email, a specific animal's private medical file, or a submission that hasn't been through coordinator review. This mirrors the network's approval rule: private submission → coordinator review → approved sanitized copy → this tab → public hub. If a need can't be described this way without exposing something private, don't post it here — route the ask through the appropriate private tool instead.

## Create the web app

1. Go to https://script.google.com and create a new project owned by the organization account.
2. Replace the default `Code.gs` with this folder's `Code.gs`.
3. Add an HTML file named `Index` and paste `Index.html` into it.
4. In Project Settings, enable "Show appsscript.json manifest file in editor," then replace it with this folder's `appsscript.json`.
5. Confirm `CONFIG.SPREADSHEET_ID` matches the Public Website Content Hub. It is prefilled for the Sheet created with this kit.
6. Run `getCurrentNeedsData` once from the editor and authorize the script using the organization account.
7. Choose **Deploy → New deployment → Web app**.
8. Execute as the organization owner. Choose the audience needed for a truly public site. Review the authorization language carefully.
9. Open the deployment URL in a private/logged-out browser and verify that visitors are not prompted to sign in.
10. In Google Sites, choose **Insert → Embed → URL**, paste the deployment URL, and size the frame as a short band — tall enough for one row of up to three compact cards, not a full page.

## Operation

- The widget caches the current-needs feed for five minutes.
- Run `clearCurrentNeedsCache` after posting or resolving an urgent need if you need the widget to refresh immediately.
- Only rows with `Active` set to `Yes` display; rows whose Need ID begins with `TEMPLATE-` never display.
- The widget shows at most the 3 most urgent needs, sorted by `Urgency` (Urgent, then Priority, then Routine) and, within the same urgency, by the most recently `Last Verified`.
- Each card's button uses that row's own `Action Label` text and links to its `Action URL`.
- The browser builds text using safe DOM methods rather than inserting Sheet content as raw HTML.
- Action links must begin with HTTPS; other values are ignored and the button is omitted for that row.

Any change to the script requires updating the web-app deployment. Test the deployment URL again after every update.
