# Filterable resources directory setup

This optional Apps Script web app turns approved rows from the `Resources` tab of the Public Website Content Hub into a filterable list of links for pet owners, adopters and fosters, shelters and rescues, and volunteers and transporters. It never reads the Private Operations Tracker.

## Before deployment

1. Open the Public Website Content Hub.
2. Add (or confirm) a tab named exactly `Resources`.
3. Give that tab a header row with exactly these column headers, spelled exactly as shown:
   - `Title`
   - `Audience`
   - `State Or Scope`
   - `Description`
   - `URL`
   - `Last Reviewed`
4. Delete any `TEMPLATE-` row — a row is treated as a template and hidden from the public list whenever its `Title` begins with `TEMPLATE-`.
5. Use a consistent value per row for `Audience` (for example: `Pet Owners`, `Adopters and Fosters`, `Shelters and Rescues`, `Volunteers and Transporters`) — the web app builds its filter dropdown from whatever values actually appear in the sheet, so consistent spelling keeps the filter useful.
6. Use a state abbreviation, region, or `National` for `State Or Scope`.
7. Use public HTTPS links only in `URL`. A non-HTTPS value (or a blank one) is dropped and the resource displays without a working link.
8. Confirm the Sheet contains no private notes, internal-only documents, login-gated pages, individual staff contact information, or unapproved submissions. "Public-safe" means: the link is something the organization is comfortable with any stranger on the internet opening, it requires no credentials, and it names no private individual.

## Create the web app

1. Go to https://script.google.com and create a new project owned by the organization account.
2. Replace the default `Code.gs` with this folder's `Code.gs`.
3. Add an HTML file named `Index` and paste `Index.html` into it.
4. In Project Settings, enable "Show appsscript.json manifest file in editor," then replace it with this folder's `appsscript.json`.
5. Confirm `CONFIG.SPREADSHEET_ID` matches the Public Website Content Hub. It is prefilled for the Sheet created with this kit.
6. Run `getResourcesData` once from the editor and authorize the script using the organization account.
7. Choose **Deploy → New deployment → Web app**.
8. Execute as the organization owner. Choose the audience needed for a truly public site. Review the authorization language carefully.
9. Open the deployment URL in a private/logged-out browser and verify that visitors are not prompted to sign in.
10. In Google Sites, choose **Insert → Embed → URL**, paste the deployment URL, and size the frame so the filters and several rows of resources are visible.

## Operation

- The directory caches approved resources for five minutes.
- Run `clearResourcesCache` after an urgent edit if you need the list to refresh immediately.
- Rows whose Title begins with `TEMPLATE-` never display.
- The browser builds text using safe DOM methods rather than inserting Sheet content as raw HTML.
- The resource link must begin with HTTPS; other values are ignored and the title displays as plain text instead of a link.

Any change to the script requires updating the web-app deployment. Test the deployment URL again after every update.
