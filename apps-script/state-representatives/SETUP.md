# State representatives directory setup

This optional Apps Script web app turns approved rows from the `State Representatives` tab of the Public Website Content Hub into a searchable state roster. It never reads the Private Operations Tracker or raw, unreviewed applications.

## Before deployment

1. Open the Public Website Content Hub.
2. Add (or confirm) a tab named exactly `State Representatives`.
3. Give row 1 these exact column headers:
   - `State`
   - `Representative Name`
   - `Organization Or Alias Contact`
   - `Status`
   - `Apply URL`
4. Add one row per state (up to all 50 states + DC). A state with no row simply won't appear on the site — the app never invents a row for a state that isn't listed.
5. Set `Status` to exactly `Filled` for a state with a rep, or `Representative Needed` (or leave it blank) for an open state.
6. Delete the `TEMPLATE-DELETE-ME` row before launch. Any row whose `State` starts with `TEMPLATE-` is hidden automatically, so a template row left behind is harmless but should still be removed.
7. Public-safe means: `Representative Name` and `Organization Or Alias Contact` hold only what the rep has agreed to publish — an org alias inbox (e.g. `texas@narn.org`) or a public https:// contact page, not a personal cell number, home address, or personal email. `Apply URL` must be a public https:// application link. Keep applicant records, background-check results, and internal notes in the Private Operations Tracker, never in this Sheet.

## Create the web app

1. Go to https://script.google.com and create a new project owned by the organization account.
2. Replace the default `Code.gs` with this folder's `Code.gs`.
3. Add an HTML file named `Index` and paste `Index.html` into it.
4. In Project Settings, enable "Show appsscript.json manifest file in editor," then replace it with this folder's `appsscript.json`.
5. Confirm `CONFIG.SPREADSHEET_ID` matches the Public Website Content Hub. It is prefilled for the Sheet created with this kit.
6. Run `getStateRepData` once from the editor and authorize the script using the organization account.
7. Choose **Deploy → New deployment → Web app**.
8. Execute as the organization owner. Choose the audience needed for a truly public site. Review the authorization language carefully.
9. Open the deployment URL in a private/logged-out browser and verify that visitors are not prompted to sign in.
10. In Google Sites, choose **Insert → Embed → URL**, paste the deployment URL, and size the frame so the search box and several rows of state cards are visible.

## Operation

- The roster caches approved rows for five minutes.
- Run `clearStateRepCache` after an urgent status change (a new rep signs on, or a state opens up) if you need the roster to refresh immediately.
- Rows whose `State` begins with `TEMPLATE-` never display.
- Any `Organization Or Alias Contact` value that looks like a phone number is dropped rather than shown; only an email address or an https:// link is ever rendered as contact info.
- `Apply URL` must begin with `https://`; other values are ignored and the card shows "Apply link coming soon" instead of a broken button.
- The browser builds text using safe DOM methods rather than inserting Sheet content as raw HTML.

Any change to the script requires updating the web-app deployment. Test the deployment URL again after every update.
