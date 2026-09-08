# Foster openings board setup

This optional Apps Script web app turns approved rows from the `Foster Openings` tab of the Public Website Content Hub into a filterable board of open foster needs. It never reads the Private Operations Tracker or raw, unreviewed foster submissions.

## Before deployment

1. Open the Public Website Content Hub.
2. Confirm the tab is named exactly `Foster Openings`.
3. Confirm the tab has a header row (row 1) with these exact column headers:
   - `Opening ID`
   - `State`
   - `Associated Dog ID`
   - `Urgency` (`Urgent`, `Priority`, or `Routine`)
   - `Need Type` (`Emergency`, `Short-Term`, `Long-Term`, `Medical`, or `Decompression`)
   - `Timing`
   - `Home Requirements`
   - `Supplies Or Support Provided`
   - `Last Verified`
   - `Expiration Date`
   - `Apply URL`
   - `Status` (`Open`, `Filled`, or `Expired`)
4. Delete the `TEMPLATE-DELETE-ME` row.
5. Add at least one approved opening with `Status` set to `Open`.
6. `Associated Dog ID` may be left blank for openings not tied to a specific dog already listed in the `Dogs` tab.
7. `Expiration Date` may be left blank for an opening with no fixed deadline. When it is set, the board hides the row automatically once that date has passed — no manual cleanup needed for expired postings, though moving `Status` to `Expired` is still good practice.
8. Use a public HTTPS `Apply URL` (a form, application page, or contact page — never a direct email address exposed as a mailto link).
9. "Public-safe" for this tab means: no foster applicant names, phone numbers, emails, or home addresses; no internal home-visit or evaluation notes; no shelter-intake or medical file attachments. `Home Requirements` and `Supplies Or Support Provided` should describe what a prospective foster needs to bring or expect in general terms, not case-specific private details.

## Create the web app

1. Go to https://script.google.com and create a new project owned by the organization account.
2. Replace the default `Code.gs` with this folder's `Code.gs`.
3. Add an HTML file named `Index` and paste `Index.html` into it.
4. In Project Settings, enable "Show appsscript.json manifest file in editor," then replace it with this folder's `appsscript.json`.
5. Confirm `CONFIG.SPREADSHEET_ID` matches the Public Website Content Hub. It is prefilled for the Sheet created with this kit.
6. Run `getFosterOpeningsData` once from the editor and authorize the script using the organization account.
7. Choose **Deploy → New deployment → Web app**.
8. Execute as the organization owner. Choose the audience needed for a truly public site. Review the authorization language carefully.
9. Open the deployment URL in a private/logged-out browser and verify that visitors are not prompted to sign in.
10. In Google Sites, choose **Insert → Embed → URL**, paste the deployment URL, and size the frame so filters and several card rows are visible.

## Operation

- The board caches approved, non-expired openings for five minutes.
- Run `clearFosterOpeningsCache` after posting, filling, or pulling an opening if you do not want to wait five minutes for the change to show.
- Only rows with `Status` equal to `Open` display, and only when `Expiration Date` is blank or is today or later (compared as real dates, not text).
- Rows whose Opening ID begins with `TEMPLATE-` never display.
- The browser builds text using safe DOM methods rather than inserting Sheet content as raw HTML.
- The `Apply URL` link must begin with HTTPS; other values are ignored and the button is omitted.

Any change to the script requires updating the web-app deployment. Test the deployment URL again after every update.
