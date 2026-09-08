# Get Involved (volunteer role board) setup

This optional Apps Script web app shows the nine standing volunteer roles and, when the org has one set up, a short "Urgently needed" callout pulled from the `Volunteer Needs` tab of the Public Website Content Hub. It never reads the Private Operations Tracker or raw, unreviewed volunteer submissions. The nine role cards themselves are fixed in the script — there is nothing to fill in on a sheet to make the board itself appear.

## Before deployment

1. **Fill in the general volunteer application form URL.** Open `Code.gs` and replace the placeholder value of `CONFIG.GENERAL_VOLUNTEER_FORM_URL` (`REPLACE_WITH_GENERAL_VOLUNTEER_FORM_URL`) with the org's real, published Google Form URL. Every role button appends its own `?role=...` query parameter (`foster`, `transport-ground`, `transport-air`, `photography`, `evaluator`, `advocacy`, `events`, `state-rep`, `admin`) to that same base URL, so once the placeholder is replaced you can wire up per-role prefill entry IDs on one shared form. Until this is replaced with a real `https://` form link, the apply buttons will not point anywhere usable — do not launch the page publicly with the placeholder still in place.
2. **The `Volunteer Needs` tab is optional.** If your org wants to run the "Urgently needed" callouts, add a tab named exactly `Volunteer Needs` to the Public Website Content Hub with this exact header row:
   - `Role`
   - `State`
   - `Note`
   - `Last Verified`
3. If you add rows to `Volunteer Needs`, keep each row public-safe: a role name, a state, a one-line note a visitor can read (for example, "No approved fosters within 100 miles"), and the date it was last confirmed accurate. No applicant names, no addresses, no internal case notes, no private evaluations.
4. Only the first three rows are shown, so keep the tab trimmed to your current top needs.
5. Delete or leave alone any row whose `Role` starts with `TEMPLATE-` — those rows are always skipped.
6. If the `Volunteer Needs` tab does not exist yet, is empty, or is missing a required column, the page simply skips the callout section — it will not show an error to visitors.

## Create the web app

1. Go to https://script.google.com and create a new project owned by the organization account.
2. Replace the default `Code.gs` with this folder's `Code.gs` (after you've filled in the form URL from step 1 above).
3. Add an HTML file named `Index` and paste `Index.html` into it.
4. In Project Settings, enable "Show appsscript.json manifest file in editor," then replace it with this folder's `appsscript.json`.
5. Confirm `CONFIG.SPREADSHEET_ID` matches the Public Website Content Hub. It is prefilled for the Sheet created with this kit.
6. Run `getRoleBoardData` once from the editor and authorize the script using the organization account.
7. Choose **Deploy → New deployment → Web app**.
8. Execute as the organization owner. Choose the audience needed for a truly public site. Review the authorization language carefully.
9. Open the deployment URL in a private/logged-out browser and verify that visitors are not prompted to sign in.
10. In Google Sites, choose **Insert → Embed → URL**, paste the deployment URL, and size the frame so all nine role cards and any needs callouts are comfortably visible.

## Operation

- The role board (and any needs callouts) cache together for five minutes.
- Run `clearRoleBoardCache` from the editor after an urgent `Volunteer Needs` edit if you need the page to refresh immediately.
- The nine roles and their order are fixed in `Code.gs` under `CONFIG.ROLES` — edit that array (title, description, commitment note, `param`) if a role changes, then redeploy.
- The browser builds text using safe DOM methods rather than inserting Sheet content as raw HTML.

Any change to the script requires updating the web-app deployment. Test the deployment URL again after every update.
