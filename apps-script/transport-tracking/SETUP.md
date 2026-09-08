# Transport tracking setup

This Apps Script web app is **fundamentally different** from every other tool in `apps-script/`. The dog directory, foster openings board, partner directory, and the rest are all public, anonymous-access, read-only pages sourced from the **Public Website Content Hub**. This one is **private**, requires **Google sign-in**, is **read + write**, and shows different data to different signed-in people depending on their role.

It reads and writes the **Private Operations Tracker** spreadsheet — a **different Sheet file** from the Public Website Content Hub every other mini-app uses:

- Spreadsheet ID: `1kjfmQncW2LBI2-Lo9T4SzYW7lC-ddHZy_f9kNUlA1NY`
- This ID is already set in `CONFIG.SPREADSHEET_ID` in `Code.gs`. Do not point it at the public hub, and do not point any other mini-app at this spreadsheet.

Why this must be private: the network's own published policy is that real-time transport routes and exact handoff details must never be public (the public **Transport Coverage Map** page shows only broad corridors/states/airports — never a live route). This app is the private, authenticated tool that policy anticipates.

## Before deployment — create four tabs on the Private Operations Tracker

Open the **Private Operations Tracker** (not the public hub) and create these four tabs with these exact header rows.

### 1. `Transports`

| Column | Notes |
|---|---|
| `Transport ID` | Unique per row, e.g. `TR-2026-014`. |
| `Requesting Partner` | The shelter/rescue that requested the transport. |
| `Origin` | |
| `Destination` | |
| `Assigned Driver Name` | |
| `Assigned Driver Email` | Must be the driver's actual Google account email — see "Google accounts" below. |
| `Backup Contact Name` | |
| `Backup Contact Email` | Must be a real Google account email. |
| `Coordinator Email` | Must be a real Google account email. |
| `Scheduled Date` | A real date value. |
| `Overall Status` | One of exactly: `Not Started`, `In Progress`, `Delayed`, `Completed`, `Cancelled`. |
| `Notes` | Free text, shown on the card. |

### 2. `Transport Waypoints`

| Column | Notes |
|---|---|
| `Transport ID` | Matches a row in `Transports`. |
| `Sequence` | A number. Waypoints are plotted and ordered ascending by this value (1, 2, 3, …). |
| `Label` | e.g. `Pickup — Dallas, TX` or `Fuel/rest — Texarkana, AR`. |
| `Latitude` | A decimal number. |
| `Longitude` | A decimal number. |

Coordinators fill in `Latitude`/`Longitude` by hand — the easiest way is to open Google Maps, find the approximate location, right-click it, and click the coordinates that appear at the top of the context menu to copy them (they copy as `lat, lng` — split them into the two columns). These are **approximate, human-chosen waypoints along the route, never a live GPS feed**. A transport with no rows yet in this tab simply shows no map on its card, just the checkpoint timeline.

### 3. `Transport Checkpoints`

| Column | Notes |
|---|---|
| `Transport ID` | Matches a row in `Transports`. |
| `Waypoint Sequence` | May be left blank for a general update not tied to a specific waypoint. |
| `Timestamp` | |
| `Status` | One of exactly: `Departed`, `En Route`, `Rest Stop`, `Delayed`, `Issue`, `Arrived`, `Handoff Complete`. |
| `Note` | |
| `Logged By Email` | |

**This tab is append-only from the app's point of view.** The app only ever adds a new row here when someone logs an update — it never edits or reads a row back into an edit form. Do not build any "edit a past checkpoint" feature against this tab; if a logged entry is wrong, add a new corrective checkpoint rather than editing history. `Timestamp` and `Logged By Email` are always written by the script itself from the signed-in session — nothing in the web app ever lets a caller supply either value directly, so the log can't be backdated or attributed to someone else.

### 4. `Transport Admins`

| Column | Notes |
|---|---|
| `Email` | One address per row. |

**To add a Transport Admin:** add a row with that person's Google account email in the `Email` column. Anyone listed here gets full visibility into every transport (not just ones they're assigned to) and can post a checkpoint to any of them. This is meant for coordinators/board members who need the whole picture, not for individual drivers — don't add a driver here just to make one specific transport visible to them; instead put their email on that transport's row in `Transports`.

## Google accounts — read this before assigning anyone

Every `Assigned Driver Email`, `Backup Contact Email`, and `Coordinator Email` value must be an email address tied to an actual Google account (a personal Gmail address is completely fine) and must be entered **exactly** as that person signs in. The app matches emails case-insensitively and trims whitespace, but it cannot match a typo'd address or a non-Google email to anything — that person will see the "nothing assigned to you yet" state forever if their row doesn't match how they actually sign in.

## How a coordinator sets up a new transport

1. Add a new row to `Transports` with a unique `Transport ID`, the origin/destination, the assigned driver's and backup's names and **exact** Google account emails, your own coordinator email, the scheduled date, and `Overall Status` set to `Not Started`.
2. Optionally add rows to `Transport Waypoints` for that same `Transport ID` — at least a pickup and a drop-off, plus any planned rest stops or handoff points, each with an ascending `Sequence` number and hand-picked latitude/longitude.
3. That's it — the driver, backup, and coordinator on that row will now see the transport the next time they open the tool, and any of the three (or any Transport Admin) can log checkpoints against it.
4. As the transport proceeds, whoever is on the road (or a coordinator relaying for them) uses the "Log an update" form on that transport's card to post checkpoints — optionally against a specific waypoint, with one of the fixed statuses and a short note.
5. Update `Overall Status` on the `Transports` row directly in the Sheet as the transport progresses (e.g. to `In Progress`, `Delayed`, or `Completed`) — the app does not currently write this column, only the four checkpoint fields.

## Access control — how this app decides what each signed-in person sees

This is the part that must not be gotten wrong, so it's documented precisely:

- The viewer's identity comes **only** from `Session.getActiveUser().getEmail()`, read fresh on the server for every call. It is never taken from anything the browser sends.
- If that comes back empty, the server returns a plain "sign-in required" result — it does not throw, and it does not touch the spreadsheet at all. (See the deployment setting below — this is the scenario a misconfigured deployment produces.)
- If the viewer's email is listed on `Transport Admins`, they receive every row from `Transports`, with that row's full waypoints and checkpoint history.
- Otherwise, they receive **only** the `Transports` rows where their email matches `Assigned Driver Email`, `Backup Contact Email`, or `Coordinator Email` on that specific row — nothing else, not even a summary of other rows. This filtering happens inside the Apps Script server function itself, before anything is turned into JSON, so a curious driver opening their browser's developer tools and inspecting the raw response still can't see another driver's transport.
- Posting a checkpoint (`logCheckpoint`) independently re-checks the same rule — admin, or assigned driver/backup/coordinator on that exact Transport ID — inside the function that performs the write. It does not trust anything the page already showed. An unauthorized attempt throws an error rather than silently doing nothing.
- The checkpoint's `Timestamp` and `Logged By Email` are always set by the script from `new Date()` and the verified session email, never from client input.
- This app does not use `CacheService` anywhere, unlike the other eight mini-apps. Every response here is scoped to one specific viewer, so a shared cache key would risk serving one person's filtered data to someone else. Traffic for this tool is a handful of drivers and coordinators, not public volume, so there is no need to cache at all — every load reads the Sheet fresh.

## Deployment — this is different from every other app in this repo

The other eight apps deploy with **Execute as: Me** and **Who has access: Anyone, even anonymous**, because they're public read-only pages. **Do not deploy this app that way.** This app must be deployed with:

- **Execute as: User accessing the web app**
- **Who has access: Anyone with a Google account**

Never choose "Anyone, even anonymous" for this app — that setting means `Session.getActiveUser().getEmail()` always returns an empty string, which this entire app depends on to know who's asking. With the anonymous setting, everyone would only ever see the "sign-in required" state, no matter who they are.

"Anyone with a Google account" does **not** mean anyone can see transport data — it only means anyone with a Google account can *open* the page and go through Google's sign-in prompt. What they actually see once signed in is still controlled entirely by the access-control logic above: only people whose email is listed somewhere relevant in `Transports` or `Transport Admins` will see any transports at all. Think of it as two separate, both-required layers: the deployment setting is the sign-in gate (can this person even reach the app's logic), and the `Transports`/`Transport Admins` lookup is the data-visibility gate (what does the app show them once they're in). Getting either layer wrong breaks the model — loosen the deployment setting and anonymous visitors get in; loosen the sheet-lookup logic and a signed-in stranger could see someone else's transport.

### Steps

1. Go to https://script.google.com and create a new project owned by the organization account.
2. Replace the default `Code.gs` with this folder's `Code.gs`.
3. Add an HTML file named `Index` and paste `Index.html` into it.
4. In Project Settings, enable "Show appsscript.json manifest file in editor," then replace it with this folder's `appsscript.json`.
5. Confirm `CONFIG.SPREADSHEET_ID` matches the **Private Operations Tracker** (it is prefilled above) — double-check it is not the Public Website Content Hub ID used by the other apps.
6. Run `getTransportBoard` once from the editor and authorize the script using the organization account.
7. Choose **Deploy → New deployment → Web app**.
8. Set **Execute as: User accessing the web app** and **Who has access: Anyone with a Google account** — exactly as described above, not the settings used by the other apps in this repo.
9. Open the deployment URL yourself while signed in with an account listed on `Transport Admins` and confirm you see every transport.
10. Open the deployment URL in a separate browser profile signed in as an assigned driver (not an admin) and confirm they see only their own transport(s), and cannot see any other driver's rows even via browser devtools inspecting the `google.script.run` response.
11. Share the deployment URL directly with drivers, backups, and coordinators (email, text, or your existing group thread). Do not embed this page on the public Google Site — it belongs only in front of people who are actually signed in and assigned.

## What this tool intentionally does not do

This page has no messaging or chat feature of any kind, on purpose. Real-time coordination with drivers — "call me when you're 20 minutes out," rerouting around a closed road, swapping a handoff time — happens over the network's existing group text/WhatsApp thread, the same as it does today. This page exists only to keep a durable, shared log of transport status (who's where, what happened, when) so the record doesn't live solely in a fast-moving chat thread. Don't try to replace the group thread with this tool; use both together.
