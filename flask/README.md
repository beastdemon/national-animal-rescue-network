# NARN Flask — The National Animal Rescue Network Website

A full Flask web application replacing the original Google Sites build.
All dynamic content still comes from Google Sheets — you maintain the site
the same way you always planned: edit the Public Content Hub spreadsheet
and the changes appear on the site within 5 minutes (one cache cycle).

---

## Quick start

```bash
cd flask

# Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Run the development server
python run.py
```

The site will be available at **http://localhost:5000**.

---

## Project layout

```
flask/
├── run.py                      ← development entry point
├── requirements.txt
├── app/
│   ├── __init__.py             ← app factory (create_app)
│   ├── config.py               ← reads .env, exposes Config classes
│   ├── sheets.py               ← Google Sheets data layer (all 10 apps)
│   ├── blueprints/
│   │   ├── main.py             ← homepage
│   │   ├── adopt.py            ← Adopt & Foster (dog directory + foster openings)
│   │   ├── transport_public.py ← Transport public info page
│   │   ├── partners.py         ← Shelter & Rescue Partners directory
│   │   ├── get_involved.py     ← Get Involved (volunteer roles)
│   │   ├── resources.py        ← News & Resources (resources + newsletter archive)
│   │   ├── about.py            ← About (state champions + federal delegation)
│   │   ├── give.py             ← Give (funds + wishlists + future projects)
│   │   ├── transport_tracker.py← Private transport tracker (OAuth-gated)
│   │   ├── contact.py          ← Contact page
│   │   └── admin.py            ← Cache-clear endpoint (/admin/clear-cache)
│   ├── templates/
│   │   ├── base.html           ← shared layout (nav, footer, fonts, relay.css)
│   │   ├── main/index.html
│   │   ├── adopt/index.html
│   │   ├── transport_public/index.html
│   │   ├── partners/index.html
│   │   ├── get_involved/index.html
│   │   ├── resources/index.html
│   │   ├── about/index.html
│   │   ├── give/index.html
│   │   ├── transport_tracker/board.html
│   │   └── contact/index.html
│   └── static/
│       ├── css/relay.css       ← "The Relay" design system (ported from Apps Script)
│       ├── js/                 ← (reserved for future global JS)
│       └── images/
│           ├── narn-logo.png
│           ├── narn-favicon.png
│           └── narn-homepage-hero.png
```

---

## Environment configuration (.env)

All secrets and IDs live in `.env` at the repo root (one level above `flask/`).
The file is in `.gitignore` — never commit it.

| Variable | Purpose |
|---|---|
| `FLASK_SECRET_KEY` | Flask session signing key — change before deploying |
| `PUBLIC_SPREADSHEET_ID` | Google Sheet ID for the Public Website Content Hub |
| `PRIVATE_SPREADSHEET_ID` | Google Sheet ID for the Private Operations Tracker |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full service account JSON (single-line) for server-side Sheets reads |
| `GOOGLE_OAUTH_CLIENT_ID` | OAuth 2.0 client ID for transport tracker sign-in |
| `GOOGLE_OAUTH_CLIENT_SECRET` | OAuth 2.0 client secret |
| `GENERAL_VOLUNTEER_FORM_URL` | Published Google Form URL for the Get Involved page apply buttons |
| `CACHE_TTL` | Cache lifetime in seconds (default: 300 = 5 minutes) |

---

## Maintaining the site via Google Workspace

The data flow is the same as originally designed:

```
Volunteer/adopter submits → Google Form
                         → Private Sheet (raw responses, human review)
                         → Approved row added to Public Content Hub Sheet
                         → Flask reads Sheet → displays on website (within 5 min)
```

**To force an immediate refresh** (e.g. after a time-sensitive update), call:

```
POST /admin/clear-cache
```

From localhost in development (no token needed). In production, set an
`ADMIN_TOKEN` env var and pass it as `X-Admin-Token: <token>` in the header.
Or just wait 5 minutes.

---

## Transport tracker

The `/tracker/` route is the private, OAuth-gated replacement for the
`transport-tracking` Apps Script. It requires a Google sign-in and shows
each driver only their own assigned transports.

**OAuth setup:** The OAuth 2.0 client in your Google Cloud project needs
`http://localhost:5000/tracker/authorized` added as an authorized redirect
URI for local development. For production, add your real domain's equivalent.

---

## Deploying to production

1. Set `FLASK_ENV=production` in the environment.
2. Generate a strong `FLASK_SECRET_KEY` (e.g. `python -c "import secrets; print(secrets.token_hex(32))"`).
3. Run with a production WSGI server:
   ```bash
   pip install gunicorn
   gunicorn "app:create_app()" --workers 2 --bind 0.0.0.0:8000
   ```
   Or on Windows, use **waitress**:
   ```bash
   pip install waitress
   waitress-serve --port=8000 "app:create_app()"
   ```
4. Put Nginx or Caddy in front for HTTPS, static file serving, and compression.
5. Add the production domain to the OAuth client's authorized redirect URIs.
