# Filterable dog directory setup

This optional Apps Script web app turns approved rows from the `Dogs` tab of the Public Website Content Hub into responsive cards and filters. It never reads the Private Operations Tracker.

## Before deployment

1. Open the Public Website Content Hub.
2. Add (or confirm) a tab named exactly `Dogs`.
3. Give that tab a header row with exactly these column headers, spelled exactly as shown:
   - `Dog ID`
   - `Name`
   - `Listing Status` (`Available`, `Foster Needed`, or `Adoption Pending` to display; any other value is hidden)
   - `Primary Breed`
   - `Age Group`
   - `Sex`
   - `Size`
   - `City`
   - `State`
   - `Partner Organization`
   - `Foster Needed?`
   - `Urgency` (`Urgent`, `Priority`, or `Routine`)
   - `Good With Dogs`
   - `Good With Cats`
   - `Good With Children`
   - `Short Description`
   - `Photo URL`
   - `Adoption Application URL`
   - `Sponsor URL`
   - `Featured?` (`Yes` to pin a dog first; leave blank or `No` otherwise)
   - `Last Verified`
4. Delete the `TEMPLATE-DELETE-ME` row — any row whose `Dog ID` begins with `TEMPLATE-` is hidden automatically, so a template row left behind is harmless but should still be removed.
5. Add at least one approved dog with Listing Status `Available`, `Foster Needed`, or `Adoption Pending`.
6. Use public HTTPS photo URLs and dog-specific HTTPS application/sponsorship URLs. A non-HTTPS value (or a blank one) is dropped and that photo/link is omitted.
7. Confirm the Sheet contains no private notes, exact foster addresses, applicant information, private evaluations, or unapproved submissions.

## Create the web app

1. Go to https://script.google.com and create a new project owned by the organization account.
2. Replace the default `Code.gs` with this folder’s `Code.gs`.
3. Add an HTML file named `Index` and paste `Index.html` into it.
4. In Project Settings, enable “Show appsscript.json manifest file in editor,” then replace it with this folder’s `appsscript.json`.
5. Confirm `CONFIG.SPREADSHEET_ID` matches the Public Website Content Hub. It is prefilled for the Sheet created with this kit.
6. Run `getDirectoryData` once from the editor and authorize the script using the organization account.
7. Choose **Deploy → New deployment → Web app**.
8. Execute as the organization owner. Choose the audience needed for a truly public site. Review the authorization language carefully.
9. Open the deployment URL in a private/logged-out browser and verify that visitors are not prompted to sign in.
10. In Google Sites, choose **Insert → Embed → URL**, paste the deployment URL, and size the frame so filters and several card rows are visible.

## Operation

- The directory caches approved listings for five minutes.
- Run `clearDirectoryCache` after an urgent removal if you need the directory to refresh immediately.
- Only three statuses display: `Available`, `Foster Needed`, and `Adoption Pending`.
- Rows whose Dog ID begins with `TEMPLATE-` never display.
- The browser builds text using safe DOM methods rather than inserting Sheet content as raw HTML.
- Photo/application/sponsorship links must begin with HTTPS; other values are ignored.

Any change to the script requires updating the web-app deployment. Test the deployment URL again after every update.

