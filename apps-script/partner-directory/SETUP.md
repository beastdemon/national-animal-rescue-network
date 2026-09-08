# Filterable shelter & rescue partner directory setup

This optional Apps Script web app turns approved rows from the `Partner Directory` tab of the Public Website Content Hub into a filterable directory of participating shelters and rescues. It never reads the Private Operations Tracker.

This directory does not collect applications. A new organization that wants to join the network still applies through the separate Google Form described in `FORM_BLUEPRINTS.md` — this page only displays partners who have already been vetted and added to the sheet.

## Before deployment

1. Open the Public Website Content Hub.
2. Add (or confirm) a tab named exactly `Partner Directory`.
3. Give that tab a header row with exactly these column headers, spelled exactly as shown:
   - `Partner ID`
   - `Organization Name`
   - `State Or Service Area`
   - `Animal Types`
   - `Capacity Status`
   - `Constraints`
   - `Transport Support`
   - `Public Contact URL`
   - `Last Verified`
   - `Next Review Date`
4. Delete any `TEMPLATE-` row — a row is treated as a template and hidden from the public directory whenever its `Partner ID` begins with `TEMPLATE-`.
5. Use one of these exact values in `Capacity Status`: `Open`, `Limited`, `Waitlist`, `Closed`, or `Needs Confirmation`.
6. Use one of these exact values in `Transport Support`: `Yes`, `No`, or `Ask`.
7. Fill in `Next Review Date` for every row, with a real date. The web app compares this to today's date and automatically displays `Needs Confirmation` — overriding whatever is in `Capacity Status` — once that date has passed, or if the cell is blank or unparseable. This keeps stale capacity claims from lingering on the public site; update `Capacity Status` and push `Next Review Date` forward whenever you re-confirm a partner.
8. Use a comma-separated list for `Animal Types` (for example: `Dogs, Cats, Rabbits`) — the web app splits on commas/semicolons/slashes and builds its filter list from whatever values actually appear, so consistent spelling keeps the filter useful.
9. Use a state abbreviation or a named service region for `State Or Service Area`.
10. Use a public HTTPS link only in `Public Contact URL` (a general org contact page, not a named staffer's personal inbox). A non-HTTPS value, or a blank one, is dropped and the card shows "No public contact link on file" instead of a button.
11. Confirm the sheet contains no internal vetting notes, background-check or reference-check results, non-public contacts, private capacity assessments, applicant-level data, or unapproved submissions. "Public-safe" here means: every value in the row is something the organization is comfortable with any stranger on the internet reading, names no private individual, and requires no login to act on.

## Create the web app

1. Go to https://script.google.com and create a new project owned by the organization account.
2. Replace the default `Code.gs` with this folder's `Code.gs`.
3. Add an HTML file named `Index` and paste `Index.html` into it.
4. In Project Settings, enable "Show appsscript.json manifest file in editor," then replace it with this folder's `appsscript.json`.
5. Confirm `CONFIG.SPREADSHEET_ID` matches the Public Website Content Hub. It is prefilled for the Sheet created with this kit.
6. Run `getPartnerDirectoryData` once from the editor and authorize the script using the organization account.
7. Choose **Deploy → New deployment → Web app**.
8. Execute as the organization owner. Choose the audience needed for a truly public site. Review the authorization language carefully.
9. Open the deployment URL in a private/logged-out browser and verify that visitors are not prompted to sign in.
10. In Google Sites, choose **Insert → Embed → URL**, paste the deployment URL, and size the frame so the filters and several rows of partner cards are visible.

## Operation

- The directory caches approved partners for five minutes.
- Run `clearPartnerDirectoryCache` after an urgent capacity change if you need the directory to refresh immediately.
- Rows whose Partner ID begins with `TEMPLATE-` never display.
- Every card's status reflects the staleness rule above: a partner past its `Next Review Date` (or missing one) always shows `Needs Confirmation`, regardless of what `Capacity Status` says.
- Partners are sorted `Open` first, then `Limited`/`Waitlist`, then `Needs Confirmation`, then `Closed`, alphabetically by name within each group.
- The browser builds text using safe DOM methods rather than inserting Sheet content as raw HTML.
- The contact link must begin with HTTPS; other values are ignored.

Any change to the script requires updating the web-app deployment. Test the deployment URL again after every update.
