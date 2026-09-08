# Newsletter archive setup

This optional Apps Script web app turns approved rows from the `Newsletter Archive` tab of the Public Website Content Hub into a reverse-chronological list of past issues, with the latest issue highlighted at the top. It never reads the Private Operations Tracker or raw, unreviewed submissions.

This page does not collect email addresses. The subscribe form is a separate Google Form (see `FORM_BLUEPRINTS.md`, "Newsletter Signup") embedded elsewhere on the site.

## Before deployment

1. Open the Public Website Content Hub.
2. Add (or confirm) a tab named exactly `Newsletter Archive`.
3. Give that tab a header row with exactly these column headers, spelled exactly as shown:
   - `Issue Title Or Month`
   - `Issue URL`
   - `Published Date`
   - `Featured`
4. Delete any `TEMPLATE-` row — a row is treated as a template and hidden from the public archive whenever its `Issue Title Or Month` begins with `TEMPLATE-`.
5. Use a clear, human label per row in `Issue Title Or Month` (for example: `September 2026` or `September 2026 — Fall Transport Push`).
6. Use a public HTTPS link only in `Issue URL` — a hosted PDF, a public Google Doc/Site page, or a public newsletter-platform archive link. A non-HTTPS value (or a blank one) is dropped and the issue displays without a working link.
7. Fill in `Published Date` with an actual date (or a month/year the sheet can read as one, such as `September 2026`) so the archive can sort and group issues correctly. A row with no readable date sorts to the bottom and groups under "Undated."
8. Set `Featured` to `Yes` on at most the one issue you want pinned as "Latest issue" at the top; leave every other row `No` (or blank). If no row is marked `Yes`, the most recently published issue is used instead.
9. Confirm the Sheet contains no private notes, unpublished drafts, donor-only content, individual staff contact information, or any link that requires a login to view. "Public-safe" means: the linked issue is something the organization is comfortable with any stranger on the internet opening, requires no credentials, and names no private individual.

## Create the web app

1. Go to https://script.google.com and create a new project owned by the organization account.
2. Replace the default `Code.gs` with this folder's `Code.gs`.
3. Add an HTML file named `Index` and paste `Index.html` into it.
4. In Project Settings, enable "Show appsscript.json manifest file in editor," then replace it with this folder's `appsscript.json`.
5. Confirm `CONFIG.SPREADSHEET_ID` matches the Public Website Content Hub. It is prefilled for the Sheet created with this kit.
6. Run `getNewsletterArchiveData` once from the editor and authorize the script using the organization account.
7. Choose **Deploy → New deployment → Web app**.
8. Execute as the organization owner. Choose the audience needed for a truly public site. Review the authorization language carefully.
9. Open the deployment URL in a private/logged-out browser and verify that visitors are not prompted to sign in.
10. In Google Sites, choose **Insert → Embed → URL**, paste the deployment URL, and size the frame so the latest-issue card and a few years of the list are visible.

## Operation

- The archive caches approved issues for five minutes.
- Run `clearNewsletterArchiveCache` after an urgent edit (a broken link, a wrong `Featured` flag) if you need the page to refresh immediately.
- Rows whose `Issue Title Or Month` begins with `TEMPLATE-` never display.
- The browser builds text using safe DOM methods rather than inserting Sheet content as raw HTML.
- The issue link must begin with HTTPS; other values are ignored and the title displays as plain text instead of a link.

Any change to the script requires updating the web-app deployment. Test the deployment URL again after every update.
