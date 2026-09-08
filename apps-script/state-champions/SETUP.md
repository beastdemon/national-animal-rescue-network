# State Champions & federal delegation — directory setup

This Apps Script web app shows two things on one page:

1. **State Champions** — NARN's own network-appointed advocate per state. A "Champion" is a network volunteer role, not a government office. Never call this role "State Representative" anywhere — that title belongs to an actual elected official, and this app also displays real ones (below), so the two must stay clearly distinct in every label, heading, and Sheet column.
2. **Congressional Delegation** — each state's actual, real US Senators and US House Representatives, shown for reference on every state's card. This is public factual information about real elected officials, not an endorsement of any of them.

Both tabs live on the Public Website Content Hub. Neither reads the Private Operations Tracker or raw, unreviewed applications.

**Deliberately out of scope: state senators and state representatives (state legislature members).** There are often 100+ of these per state, they're redrawn and re-elected far more often than a small nonprofit can hand-track, and district boundaries make "one per state" meaningless. Rather than hand-maintaining a roster that goes stale fast, the page links out to [Congress.gov's own maintained index of every state legislature's website](https://www.congress.gov/state-legislature-websites) (Library of Congress) — a visitor picks their own state there and reaches that state's official "find your legislator" tool. Do not attempt to add a state-legislature roster to this app; if that need grows later, treat it as a separate project (it would need a real civic-data API, not a hand-maintained Sheet).

## Before deployment — two tabs on the Public Website Content Hub

### 1. `State Champions`

Give row 1 these exact column headers:

- `State`
- `Champion Name`
- `Organization Or Alias Contact`
- `Status`
- `Apply URL`
- `Photo URL`
- `Bio Or Message`

- Add one row per state (up to all 50 states + DC). A state with no row simply won't appear — the app never invents one.
- Set `Status` to exactly `Filled` for a state with a Champion, or `Champion Needed` (or leave it blank) for an open state.
- Delete the `TEMPLATE-DELETE-ME` row before launch. Any row whose `State` starts with `TEMPLATE-` is hidden automatically.
- Public-safe means: `Champion Name` and `Organization Or Alias Contact` hold only what the Champion has agreed to publish — an org alias inbox (e.g. `texas@narn.org`) or a public https:// contact page, never a personal cell number, home address, or personal email. `Apply URL` must be a public https:// application link.
- `Photo URL` and `Bio Or Message` are optional per row (the columns must still exist), and should only be filled in after that specific Champion has separately consented to a public photo and bio — the State Champion Application (see `FORM_BLUEPRINTS.md`) collects that consent at appointment time, not at application time. `Photo URL` must be a public https:// image link.

### 2. `Congressional Delegation`

Give row 1 these exact column headers:

- `State`
- `Chamber` — exactly `Senate` or `House`.
- `Name`
- `District` — the US House district number (e.g. `12`). Leave blank for `Senate` rows.
- `Official Contact URL` — that member's own official senate.gov or house.gov contact page.

This tab is **optional** — if it doesn't exist yet, the page still works and simply shows no federal delegation section on any card. A malformed row or a missing column here can never take down the State Champions roster above it; a bad `Congressional Delegation` tab just makes the delegation section disappear until it's fixed.

**Source this from official government directories, not from memory or an AI's guess** — elected officials change with every election, special election, resignation, and (for the House) every two years:

- US Senators: [senate.gov/senators/senators-contact.htm](https://www.senate.gov/senators/senators-contact.htm)
- US House Representatives: [house.gov/representatives](https://www.house.gov/representatives) or [house.gov/representatives/find-your-representative](https://www.house.gov/representatives/find-your-representative)

Add 2 `Senate` rows and one `House` row per district for every state you want federal delegation data to appear for. A state can have `State Champions` data with no `Congressional Delegation` rows (and vice versa) — the two tabs are independent.

**Re-verification schedule:** re-check the whole `Congressional Delegation` tab after every general election (every 2 years, since the entire US House and roughly a third of the Senate are up each cycle) and immediately after any reported special election, resignation, or appointment. A stale entry here is just an outdated public fact, not a private-data risk, but it should still be fixed promptly — treat it the same as any other "last verified" content on the site.

## Create the web app

1. Go to https://script.google.com and create a new project owned by the organization account.
2. Replace the default `Code.gs` with this folder's `Code.gs`.
3. Add an HTML file named `Index` and paste `Index.html` into it.
4. In Project Settings, enable "Show appsscript.json manifest file in editor," then replace it with this folder's `appsscript.json`.
5. Confirm `CONFIG.SPREADSHEET_ID` matches the Public Website Content Hub. It is prefilled for the Sheet created with this kit.
6. Run `getStateChampionsData` once from the editor and authorize the script using the organization account.
7. Choose **Deploy → New deployment → Web app**.
8. Execute as the organization owner. Choose the audience needed for a truly public site. Review the authorization language carefully.
9. Open the deployment URL in a private/logged-out browser and verify that visitors are not prompted to sign in.
10. In Google Sites, choose **Insert → Embed → URL**, paste the deployment URL, and size the frame so the search box, a card, and its federal delegation section are all visible.

## Operation

- The combined roster + delegation payload caches for five minutes.
- Run `clearStateChampionsCache` after an urgent change (a new Champion signs on, a state opens up, or a Congressional Delegation update) if you need the page to refresh immediately.
- Rows whose `State` begins with `TEMPLATE-` never display, in either tab.
- `Apply URL` and `Photo URL` must begin with `https://`; other values are ignored — `Apply URL` shows "Apply link coming soon" instead of a broken button, and `Photo URL` falls back to a placeholder icon.
- Any `Organization Or Alias Contact` value that looks like a phone number is dropped rather than shown; only an email address or an https:// link is ever rendered as contact info.
- Each state's federal delegation renders inside a collapsed `<details>` section (so a large state's full US House delegation doesn't dominate the card) — Senators are always listed first, House members ordered by district number.
- The browser builds text using safe DOM methods rather than inserting Sheet content as raw HTML.

Any change to the script requires updating the web-app deployment. Test the deployment URL again after every update.
