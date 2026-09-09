"""
NARN Flask — Google Sheets data layer.

Every public mini-app reads the Public Website Content Hub.
The transport tracker reads the Private Operations Tracker.

Caching: a simple in-process TTL cache (cachetools.TTLCache) mirrors the
5-minute CacheService used in the original Apps Script. For a multi-worker
deployment, swap this for Redis or Memcache — the interface stays the same.

All filtering, sorting, and data-shaping logic is ported 1:1 from the
original Code.gs files so the data contract to the templates is identical.
"""
import json
import re
from datetime import date, datetime
from functools import wraps

from cachetools import TTLCache
from google.oauth2 import service_account
from googleapiclient.discovery import build

# ---------------------------------------------------------------------------
# Credential + client bootstrap
# ---------------------------------------------------------------------------

_SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
_WRITE_SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

_service_readonly = None
_service_readwrite = None


def _get_service(write=False):
    """Return a cached Sheets API service client."""
    global _service_readonly, _service_readwrite
    from flask import current_app
    info = current_app.config['SERVICE_ACCOUNT_INFO']
    scopes = _WRITE_SCOPES if write else _SCOPES
    if write:
        if _service_readwrite is None:
            creds = service_account.Credentials.from_service_account_info(
                info, scopes=scopes
            )
            _service_readwrite = build('sheets', 'v4', credentials=creds, cache_discovery=False)
        return _service_readwrite
    else:
        if _service_readonly is None:
            creds = service_account.Credentials.from_service_account_info(
                info, scopes=scopes
            )
            _service_readonly = build('sheets', 'v4', credentials=creds, cache_discovery=False)
        return _service_readonly


# ---------------------------------------------------------------------------
# TTL cache (matches the 5-minute Apps Script CacheService)
# ---------------------------------------------------------------------------

_cache = TTLCache(maxsize=64, ttl=300)  # overridden by app config at init


def init_cache(ttl: int):
    """Call this from the app factory to apply the configured TTL."""
    global _cache
    _cache = TTLCache(maxsize=64, ttl=ttl)


def _cached(key_fn):
    """Decorator: cache the return value using key_fn(*args, **kwargs)."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            key = key_fn(*args, **kwargs)
            if key in _cache:
                return _cache[key]
            result = fn(*args, **kwargs)
            _cache[key] = result
            return result
        return wrapper
    return decorator


def clear_cache(key: str = None):
    """Clear one key or the entire cache (staff can trigger this via /admin/clear-cache)."""
    if key:
        _cache.pop(key, None)
    else:
        _cache.clear()


# ---------------------------------------------------------------------------
# Low-level sheet reader
# ---------------------------------------------------------------------------

def _read_sheet(spreadsheet_id: str, sheet_name: str):
    """
    Return (headers, rows) where headers is a list of trimmed strings and
    rows is a list of dicts keyed by header name. Missing cells are ''.
    Uses FORMATTED_VALUE so display strings match what staff see.
    Returns ([], []) if the tab doesn't exist yet rather than raising.
    """
    service = _get_service()
    try:
        result = (
            service.spreadsheets()
            .values()
            .get(
                spreadsheetId=spreadsheet_id,
                range=sheet_name,
                valueRenderOption='FORMATTED_VALUE',
                dateTimeRenderOption='FORMATTED_STRING',
            )
            .execute()
        )
    except Exception as e:
        # "Unable to parse range" means the tab doesn't exist yet — treat as empty
        err = str(e)
        if 'Unable to parse range' in err or '400' in err:
            return [], []
        raise
    raw_rows = result.get('values', [])
    if len(raw_rows) < 2:
        return [], []
    headers = [str(h).strip() for h in raw_rows[0]]
    rows = []
    for raw in raw_rows[1:]:
        # Pad short rows with empty strings
        padded = raw + [''] * (len(headers) - len(raw))
        rows.append({headers[i]: str(padded[i]).strip() for i in range(len(headers))})
    return headers, rows


def _read_sheet_raw(spreadsheet_id: str, sheet_name: str):
    """
    Same as _read_sheet but also returns UNFORMATTED_VALUE rows (for date
    comparison). Returns (headers, display_rows, raw_rows).
    Returns ([], [], []) if the tab doesn't exist yet rather than raising.
    """
    service = _get_service()
    sheet_range = sheet_name
    try:
        display_result = (
            service.spreadsheets()
            .values()
            .get(
                spreadsheetId=spreadsheet_id,
                range=sheet_range,
                valueRenderOption='FORMATTED_VALUE',
                dateTimeRenderOption='FORMATTED_STRING',
            )
            .execute()
        )
        raw_result = (
            service.spreadsheets()
            .values()
            .get(
                spreadsheetId=spreadsheet_id,
                range=sheet_range,
                valueRenderOption='UNFORMATTED_VALUE',
                dateTimeRenderOption='SERIAL_NUMBER',
            )
            .execute()
        )
    except Exception as e:
        err = str(e)
        if 'Unable to parse range' in err or '400' in err:
            return [], [], []
        raise
    disp_rows = display_result.get('values', [])
    raw_rows_data = raw_result.get('values', [])

    if len(disp_rows) < 2:
        return [], [], []

    headers = [str(h).strip() for h in disp_rows[0]]
    display_rows = []
    raw_rows = []
    for i, raw in enumerate(disp_rows[1:]):
        padded_disp = raw + [''] * (len(headers) - len(raw))
        raw_raw = raw_rows_data[i + 1] if i + 1 < len(raw_rows_data) else []
        padded_raw = raw_raw + [None] * (len(headers) - len(raw_raw))
        display_rows.append({headers[j]: str(padded_disp[j]).strip() for j in range(len(headers))})
        raw_rows.append({headers[j]: padded_raw[j] for j in range(len(headers))})
    return headers, display_rows, raw_rows


# ---------------------------------------------------------------------------
# Utility helpers (matching Apps Script helper functions)
# ---------------------------------------------------------------------------

def _public_url(value: str) -> str:
    """Return value only if it's a valid https:// URL, else ''."""
    url = str(value or '').strip()
    return url if re.match(r'^https://', url, re.IGNORECASE) else ''


def _split_list(value: str) -> list:
    """Split a comma/semicolon/slash-separated cell into a clean list."""
    return [p.strip() for p in re.split(r'[,;/]+', str(value or '')) if p.strip()]


def _urgency_rank(value: str) -> int:
    order = ['Urgent', 'Priority', 'Routine']
    try:
        return order.index(value)
    except ValueError:
        return len(order)


def _parse_amount(value: str) -> float:
    """Strip currency formatting so '$25,000' → 25000.0."""
    raw = re.sub(r'[^0-9.\-]', '', str(value or ''))
    try:
        return float(raw)
    except ValueError:
        return 0.0


def _serial_to_date(serial):
    """Convert a Google Sheets date serial number (days since 1899-12-30) to a date."""
    if serial is None or serial == '':
        return None
    try:
        n = float(serial)
    except (TypeError, ValueError):
        return None
    # Google Sheets epoch: December 30, 1899
    from datetime import timedelta
    epoch = date(1899, 12, 30)
    try:
        return epoch + timedelta(days=int(n))
    except (OverflowError, ValueError):
        return None


def _parse_date(value) -> date | None:
    """Try to parse a date from a display string or serial number."""
    if value is None or value == '':
        return None
    if isinstance(value, (int, float)):
        return _serial_to_date(value)
    text = str(value).strip()
    if not text:
        return None
    for fmt in ('%Y-%m-%d', '%m/%d/%Y', '%m/%d/%y', '%B %d, %Y', '%b %d, %Y'):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None


def _safe_contact(value: str) -> str:
    """Drop phone-number-like values from the contact field."""
    contact = str(value or '').strip()
    if not contact:
        return ''
    if re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', contact):
        return contact
    if re.match(r'^https://', contact, re.IGNORECASE):
        return contact
    digits = re.sub(r'[^0-9]', '', contact)
    if len(digits) >= 7 and len(digits) / max(len(contact), 1) > 0.5:
        return ''
    return contact


# ---------------------------------------------------------------------------
# Dog directory
# ---------------------------------------------------------------------------

DISPLAY_STATUSES = ['Available', 'Foster Needed', 'Adoption Pending']


@_cached(lambda spreadsheet_id: f'dogs:{spreadsheet_id}')
def get_dogs(spreadsheet_id: str) -> dict:
    _, rows = _read_sheet(spreadsheet_id, 'Dogs')
    required = [
        'Dog ID', 'Name', 'Listing Status', 'Primary Breed', 'Age Group', 'Sex',
        'Size', 'City', 'State', 'Partner Organization', 'Foster Needed?',
        'Urgency', 'Good With Dogs', 'Good With Cats', 'Good With Children',
        'Short Description', 'Photo URL', 'Adoption Application URL',
        'Sponsor URL', 'Featured?', 'Last Verified'
    ]
    if not rows:
        return {'dogs': [], 'count': 0}
    if not all(k in rows[0] for k in required):
        missing = [k for k in required if k not in rows[0]]
        raise ValueError(f'Dogs sheet missing columns: {", ".join(missing)}')

    dogs = []
    for r in rows:
        dog_id = r.get('Dog ID', '')
        if not dog_id or dog_id.startswith('TEMPLATE-'):
            continue
        if r.get('Listing Status', '') not in DISPLAY_STATUSES:
            continue
        dogs.append({
            'id': dog_id,
            'name': r.get('Name') or 'Dog in the network',
            'status': r.get('Listing Status', ''),
            'breed': r.get('Primary Breed') or 'Breed estimate unavailable',
            'ageGroup': r.get('Age Group') or 'Unknown',
            'sex': r.get('Sex') or 'Unknown',
            'size': r.get('Size') or 'Unknown',
            'city': r.get('City', ''),
            'state': r.get('State', ''),
            'partner': r.get('Partner Organization', ''),
            'fosterNeeded': r.get('Foster Needed?', ''),
            'urgency': r.get('Urgency') or 'Routine',
            'goodWithDogs': r.get('Good With Dogs') or 'Unknown',
            'goodWithCats': r.get('Good With Cats') or 'Unknown',
            'goodWithChildren': r.get('Good With Children') or 'Unknown',
            'description': r.get('Short Description', ''),
            'photoUrl': _public_url(r.get('Photo URL', '')),
            'adoptionUrl': _public_url(r.get('Adoption Application URL', '')),
            'sponsorUrl': _public_url(r.get('Sponsor URL', '')),
            'featured': r.get('Featured?', '') == 'Yes',
            'lastVerified': r.get('Last Verified', ''),
        })

    dogs.sort(key=lambda d: (
        not d['featured'],
        _urgency_rank(d['urgency']),
        d['name'].lower()
    ))
    return {'dogs': dogs, 'count': len(dogs)}


# ---------------------------------------------------------------------------
# Foster openings
# ---------------------------------------------------------------------------

@_cached(lambda spreadsheet_id: f'foster:{spreadsheet_id}')
def get_foster_openings(spreadsheet_id: str) -> dict:
    _, display_rows, raw_rows = _read_sheet_raw(spreadsheet_id, 'Foster Openings')
    if not display_rows:
        return {'openings': [], 'count': 0}

    today = date.today()
    openings = []
    for d, r in zip(display_rows, raw_rows):
        oid = d.get('Opening ID', '')
        if not oid or oid.startswith('TEMPLATE-'):
            continue
        if d.get('Status', '') != 'Open':
            continue
        # Expiration check using raw serial value
        exp_raw = r.get('Expiration Date')
        exp_date = _serial_to_date(exp_raw) if isinstance(exp_raw, (int, float)) else _parse_date(d.get('Expiration Date', ''))
        if exp_date is not None and exp_date < today:
            continue
        openings.append({
            'id': oid,
            'state': d.get('State') or 'Location not listed',
            'associatedDogId': d.get('Associated Dog ID', ''),
            'urgency': d.get('Urgency') or 'Routine',
            'needType': d.get('Need Type') or 'Foster support',
            'timing': d.get('Timing', ''),
            'homeRequirements': d.get('Home Requirements', ''),
            'supplies': _split_list(d.get('Supplies Or Support Provided', '')),
            'lastVerified': d.get('Last Verified', ''),
            'applyUrl': _public_url(d.get('Apply URL', '')),
            '_expSort': exp_date.toordinal() if exp_date else float('inf'),
        })

    openings.sort(key=lambda o: (_urgency_rank(o['urgency']), o['_expSort'], o['state']))
    for o in openings:
        del o['_expSort']
    return {'openings': openings, 'count': len(openings)}


# ---------------------------------------------------------------------------
# Partner directory
# ---------------------------------------------------------------------------

STATUS_RANK = {'Open': 0, 'Limited': 1, 'Waitlist': 1, 'Needs Confirmation': 2, 'Closed': 3}


@_cached(lambda spreadsheet_id: f'partners:{spreadsheet_id}')
def get_partners(spreadsheet_id: str) -> dict:
    _, display_rows, raw_rows = _read_sheet_raw(spreadsheet_id, 'Partner Directory')
    if not display_rows:
        return {'partners': [], 'count': 0}

    today = date.today()
    partners = []
    for d, r in zip(display_rows, raw_rows):
        pid = d.get('Partner ID', '')
        if not pid or pid.startswith('TEMPLATE-'):
            continue
        stored_status = d.get('Capacity Status') or 'Needs Confirmation'
        review_raw = r.get('Next Review Date')
        review_date = _serial_to_date(review_raw) if isinstance(review_raw, (int, float)) else _parse_date(d.get('Next Review Date', ''))
        review_overdue = review_date is None or review_date < today
        status = 'Needs Confirmation' if review_overdue else stored_status
        partners.append({
            'id': pid,
            'name': d.get('Organization Name') or 'Partner organization',
            'area': d.get('State Or Service Area') or 'Service area not listed',
            'animalTypes': _split_list(d.get('Animal Types', '')),
            'status': status,
            'reviewOverdue': review_overdue,
            'constraints': d.get('Constraints', ''),
            'transportSupport': d.get('Transport Support') or 'Ask',
            'contactUrl': _public_url(d.get('Public Contact URL', '')),
            'lastVerified': d.get('Last Verified', ''),
        })

    partners.sort(key=lambda p: (STATUS_RANK.get(p['status'], 4), p['name'].lower()))
    return {'partners': partners, 'count': len(partners)}


# ---------------------------------------------------------------------------
# Current needs
# ---------------------------------------------------------------------------

MAX_NEEDS = 3


@_cached(lambda spreadsheet_id: f'needs:{spreadsheet_id}')
def get_current_needs(spreadsheet_id: str) -> dict:
    _, rows = _read_sheet(spreadsheet_id, 'Current Needs')
    if not rows:
        return {'needs': [], 'count': 0}

    needs = []
    for r in rows:
        nid = r.get('Need ID', '')
        if not nid or nid.startswith('TEMPLATE-'):
            continue
        if r.get('Active', '') != 'Yes':
            continue
        needs.append({
            'id': nid,
            'category': r.get('Category') or 'Other',
            'state': r.get('State', ''),
            'headline': r.get('Headline') or 'Current need in the network',
            'urgency': r.get('Urgency') or 'Routine',
            'lastVerified': r.get('Last Verified', ''),
            'actionLabel': r.get('Action Label') or 'Learn more',
            'actionUrl': _public_url(r.get('Action URL', '')),
        })

    def _last_verified_sort(lv):
        d = _parse_date(lv)
        return -d.toordinal() if d else float('inf')

    needs.sort(key=lambda n: (_urgency_rank(n['urgency']), _last_verified_sort(n['lastVerified'])))
    needs = needs[:MAX_NEEDS]
    return {'needs': needs, 'count': len(needs)}


# ---------------------------------------------------------------------------
# Resources directory
# ---------------------------------------------------------------------------

@_cached(lambda spreadsheet_id: f'resources:{spreadsheet_id}')
def get_resources(spreadsheet_id: str) -> dict:
    _, rows = _read_sheet(spreadsheet_id, 'Resources')
    if not rows:
        return {'resources': [], 'count': 0}

    resources = []
    for r in rows:
        title = r.get('Title', '')
        if not title or title.startswith('TEMPLATE-'):
            continue
        resources.append({
            'title': title,
            'audience': r.get('Audience') or 'General',
            'scope': r.get('State Or Scope') or 'National',
            'description': r.get('Description', ''),
            'url': _public_url(r.get('URL', '')),
            'lastReviewed': r.get('Last Reviewed', ''),
        })

    resources.sort(key=lambda r: (r['audience'].lower(), r['title'].lower()))
    return {'resources': resources, 'count': len(resources)}


# ---------------------------------------------------------------------------
# Give hub (funds + wishlists + future projects)
# ---------------------------------------------------------------------------

@_cached(lambda spreadsheet_id: f'give:{spreadsheet_id}')
def get_give_hub(spreadsheet_id: str) -> dict:
    _, funds_rows = _read_sheet(spreadsheet_id, 'Give Funds')
    _, wishlists_rows = _read_sheet(spreadsheet_id, 'Wishlists')
    _, projects_rows = _read_sheet(spreadsheet_id, 'Future Projects')

    funds = []
    for r in funds_rows:
        name = r.get('Fund Name', '')
        if not name or name.startswith('TEMPLATE-'):
            continue
        funds.append({
            'name': name,
            'description': r.get('Description', ''),
            'donateUrl': _public_url(r.get('Donate URL', '')),
        })

    wishlists = []
    for r in wishlists_rows:
        name = r.get('Program Or Partner', '')
        if not name or name.startswith('TEMPLATE-'):
            continue
        wishlists.append({
            'programOrPartner': name,
            'destination': r.get('Destination', ''),
            'priorityNeeds': r.get('Priority Needs', ''),
            'wishlistUrl': _public_url(r.get('Wishlist URL', '')),
            'lastVerified': r.get('Last Verified', ''),
        })

    projects = []
    for r in projects_rows:
        name = r.get('Project Name', '')
        if not name or name.startswith('TEMPLATE-'):
            continue
        goal = _parse_amount(r.get('Goal Amount', ''))
        raised = _parse_amount(r.get('Raised Amount', ''))
        percent = min(100, max(0, round((raised / goal) * 100))) if goal > 0 else 0
        projects.append({
            'name': name,
            'description': r.get('Description', ''),
            'goalAmount': goal,
            'raisedAmount': raised,
            'percent': percent,
            'milestoneNote': r.get('Milestone Note', ''),
        })

    return {'funds': funds, 'wishlists': wishlists, 'projects': projects}


# ---------------------------------------------------------------------------
# Newsletter archive
# ---------------------------------------------------------------------------

@_cached(lambda spreadsheet_id: f'newsletter:{spreadsheet_id}')
def get_newsletter_archive(spreadsheet_id: str) -> dict:
    _, display_rows, raw_rows = _read_sheet_raw(spreadsheet_id, 'Newsletter Archive')
    if not display_rows:
        return {'issues': [], 'count': 0}

    issues = []
    for d, r in zip(display_rows, raw_rows):
        title = d.get('Issue Title Or Month', '')
        if not title or title.startswith('TEMPLATE-'):
            continue
        pub_display = d.get('Published Date', '')
        pub_raw = r.get('Published Date')
        pub_date = _serial_to_date(pub_raw) if isinstance(pub_raw, (int, float)) else _parse_date(pub_display)
        year = str(pub_date.year) if pub_date else _extract_year(pub_display, title)
        issues.append({
            'title': title,
            'url': _public_url(d.get('Issue URL', '')),
            'publishedDate': pub_display,
            'featured': d.get('Featured', '').lower() == 'yes',
            'year': year,
            '_sort': pub_date.toordinal() if pub_date else -1,
        })

    issues.sort(key=lambda i: -i['_sort'])
    for i in issues:
        del i['_sort']
    return {'issues': issues, 'count': len(issues)}


def _extract_year(pub_display: str, title: str) -> str:
    m = re.search(r'(19|20)\d{2}', pub_display + ' ' + title)
    return m.group(0) if m else 'Undated'


# ---------------------------------------------------------------------------
# State champions + congressional delegation
# ---------------------------------------------------------------------------

@_cached(lambda spreadsheet_id: f'advocates:{spreadsheet_id}')
def get_state_champions(spreadsheet_id: str) -> dict:
    delegation = _read_delegation(spreadsheet_id)
    _, rows = _read_sheet(spreadsheet_id, 'State Advocates')
    if not rows:
        return {'states': [], 'count': 0}

    states = []
    for r in rows:
        state = r.get('State', '')
        if not state or state.startswith('TEMPLATE-'):
            continue
        filled = r.get('Status', '').lower() == 'filled'
        states.append({
            'state': state,
            'championName': r.get('Champion Name', ''),
            'contact': _safe_contact(r.get('Organization Or Alias Contact', '')),
            'status': 'Filled' if filled else 'Champion Needed',
            'applyUrl': _public_url(r.get('Apply URL', '')),
            'photoUrl': _public_url(r.get('Photo URL', '')),
            'bio': r.get('Bio Or Message', ''),
            'delegation': delegation.get(state, []),
        })

    states.sort(key=lambda s: s['state'])
    return {'states': states, 'count': len(states)}


def _read_delegation(spreadsheet_id: str) -> dict:
    try:
        _, rows = _read_sheet(spreadsheet_id, 'Congressional Delegation')
        if not rows:
            return {}
        by_state = {}
        for r in rows:
            state = r.get('State', '')
            name = r.get('Name', '')
            if not state or state.startswith('TEMPLATE-') or not name:
                continue
            chamber_raw = r.get('Chamber', '').lower()
            chamber = 'Senate' if chamber_raw == 'senate' else ('House' if chamber_raw == 'house' else '')
            if not chamber:
                continue
            district = r.get('District', '') if chamber == 'House' else ''
            by_state.setdefault(state, []).append({
                'chamber': chamber,
                'name': name,
                'district': district,
                'contactUrl': _public_url(r.get('Official Contact URL', '')),
            })
        for state in by_state:
            by_state[state].sort(key=lambda d: (0 if d['chamber'] == 'Senate' else 1, int(d['district']) if d['district'].isdigit() else 0))
        return by_state
    except Exception:
        return {}


# ---------------------------------------------------------------------------
# Get-involved volunteer needs (optional sheet)
# ---------------------------------------------------------------------------

@_cached(lambda spreadsheet_id: f'volunteer_needs:{spreadsheet_id}')
def get_volunteer_needs(spreadsheet_id: str) -> list:
    try:
        _, rows = _read_sheet(spreadsheet_id, 'Volunteer Needs')
        if not rows:
            return []
        needs = []
        for r in rows:
            role = r.get('Role', '')
            if not role or role.startswith('TEMPLATE-'):
                continue
            needs.append({
                'role': role,
                'state': r.get('State', ''),
                'note': r.get('Note', ''),
                'lastVerified': r.get('Last Verified', ''),
            })
        return needs[:3]
    except Exception:
        return []


# ---------------------------------------------------------------------------
# Transport tracker (Private Operations Tracker, read+write)
# ---------------------------------------------------------------------------

def get_transport_board(spreadsheet_id: str, viewer_email: str) -> dict:
    """
    Per-viewer: never cached. Admins see all transports; non-admins see only
    transports where their email matches driver, backup, or coordinator.
    """
    data = _load_tracker_data(spreadsheet_id)
    viewer = viewer_email.lower().strip()
    is_admin = viewer in data['admin_emails']

    transports = [
        t for t in data['transports']
        if is_admin or _viewer_matches(t, viewer)
    ]
    transports = _sort_transports(transports)
    transport_views = [
        _build_transport_view(t, data, viewer, is_admin)
        for t in transports
    ]

    return {
        'signed_in': True,
        'viewer_email': viewer,
        'is_admin': is_admin,
        'count': len(transport_views),
        'transports': transport_views,
        'overall_statuses': OVERALL_STATUSES,
        'checkpoint_statuses': CHECKPOINT_STATUSES,
    }


OVERALL_STATUSES = ['Not Started', 'In Progress', 'Delayed', 'Completed', 'Cancelled']
CHECKPOINT_STATUSES = ['Departed', 'En Route', 'Rest Stop', 'Delayed', 'Issue', 'Arrived', 'Handoff Complete']
STATUS_PRIORITY = {'In Progress': 0, 'Delayed': 1, 'Not Started': 2, 'Completed': 3, 'Cancelled': 4}
NOTE_MAX_LENGTH = 500


def log_checkpoint(spreadsheet_id: str, viewer_email: str, transport_id: str,
                   waypoint_sequence, status: str, note_raw: str):
    """
    Write-path for the transport tracker. Re-verifies authorization from a
    fresh sheet read — never trusts anything from the session.
    """
    viewer = viewer_email.lower().strip()
    if not viewer:
        raise PermissionError('Sign-in required.')
    if status not in CHECKPOINT_STATUSES:
        raise ValueError('Invalid checkpoint status.')

    tid = str(transport_id or '').strip()
    if not tid:
        raise ValueError('Transport ID is required.')

    data = _load_tracker_data(spreadsheet_id)
    is_admin = viewer in data['admin_emails']
    transport_row = next((t for t in data['transports'] if t['id'] == tid), None)

    # Generic message — don't reveal whether the ID exists to unauthorized callers
    if not transport_row or (not is_admin and not _viewer_matches(transport_row, viewer)):
        raise PermissionError('That transport was not found or you are not authorized to update it.')

    # Sanitize waypoint sequence
    wp_seq = ''
    if waypoint_sequence not in ('', None):
        try:
            wp_seq = int(waypoint_sequence)
        except (TypeError, ValueError):
            wp_seq = ''

    # Sanitize note against formula injection
    note = _sanitize_for_sheet(str(note_raw or '').strip()[:NOTE_MAX_LENGTH])

    # Append checkpoint row — timestamp and logged-by are always server-set
    service = _get_service(write=True)
    now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    service.spreadsheets().values().append(
        spreadsheetId=spreadsheet_id,
        range='Transport Checkpoints',
        valueInputOption='USER_ENTERED',
        insertDataOption='INSERT_ROWS',
        body={'values': [[tid, wp_seq, now, status, note, viewer]]}
    ).execute()

    # Return a fresh view of this single transport
    refreshed = _load_tracker_data(spreadsheet_id)
    refreshed_row = next((t for t in refreshed['transports'] if t['id'] == tid), None)
    if not refreshed_row:
        raise RuntimeError('Transport disappeared after write — contact an admin.')
    return _build_transport_view(refreshed_row, refreshed, viewer, is_admin)


def _load_tracker_data(spreadsheet_id: str) -> dict:
    """Load all four private tracker tabs. Not cached — always fresh for transport tracker."""
    _, transport_rows = _read_sheet(spreadsheet_id, 'Transports')
    _, waypoint_rows = _read_sheet(spreadsheet_id, 'Transport Waypoints')
    _, checkpoint_rows = _read_sheet(spreadsheet_id, 'Transport Checkpoints')
    _, admin_rows = _read_sheet(spreadsheet_id, 'Transport Admins')

    admin_emails = {r.get('Email', '').lower().strip() for r in admin_rows if r.get('Email', '').strip()}

    transports = []
    for r in transport_rows:
        tid = r.get('Transport ID', '').strip()
        if not tid or tid.startswith('TEMPLATE-'):
            continue
        transports.append({
            'id': tid,
            'requestingPartner': r.get('Requesting Partner', ''),
            'origin': r.get('Origin', ''),
            'destination': r.get('Destination', ''),
            'driverName': r.get('Assigned Driver Name', ''),
            'driverEmail': r.get('Assigned Driver Email', '').lower().strip(),
            'backupName': r.get('Backup Contact Name', ''),
            'backupEmail': r.get('Backup Contact Email', '').lower().strip(),
            'coordinatorEmail': r.get('Coordinator Email', '').lower().strip(),
            'scheduledDate': r.get('Scheduled Date', ''),
            'status': r.get('Overall Status', '') or 'Not Started',
            'notes': r.get('Notes', ''),
            '_sort_date': _parse_date(r.get('Scheduled Date', '')),
        })

    waypoints_by_transport = {}
    for r in waypoint_rows:
        tid = r.get('Transport ID', '').strip()
        if not tid:
            continue
        try:
            seq = int(r.get('Sequence', 0))
        except (TypeError, ValueError):
            seq = 0
        try:
            lat = float(r.get('Latitude', 0))
            lng = float(r.get('Longitude', 0))
        except (TypeError, ValueError):
            lat, lng = 0.0, 0.0
        waypoints_by_transport.setdefault(tid, []).append({
            'sequence': seq,
            'label': r.get('Label', ''),
            'lat': lat,
            'lng': lng,
        })
    for tid in waypoints_by_transport:
        waypoints_by_transport[tid].sort(key=lambda w: w['sequence'])

    checkpoints_by_transport = {}
    for r in checkpoint_rows:
        tid = r.get('Transport ID', '').strip()
        if not tid:
            continue
        try:
            wp_seq = int(r.get('Waypoint Sequence', '')) if r.get('Waypoint Sequence', '') else None
        except (TypeError, ValueError):
            wp_seq = None
        checkpoints_by_transport.setdefault(tid, []).append({
            'timestamp': r.get('Timestamp', ''),
            'status': r.get('Status', ''),
            'note': r.get('Note', ''),
            'loggedByEmail': r.get('Logged By Email', ''),
            'waypointSequence': wp_seq,
        })

    return {
        'transports': transports,
        'admin_emails': admin_emails,
        'waypoints_by_transport': waypoints_by_transport,
        'checkpoints_by_transport': checkpoints_by_transport,
    }


def _viewer_matches(transport: dict, email_lower: str) -> bool:
    return email_lower in (transport['driverEmail'], transport['backupEmail'], transport['coordinatorEmail'])


def _sort_transports(transports: list) -> list:
    def _key(t):
        priority = STATUS_PRIORITY.get(t['status'], 5)
        sort_date = t.get('_sort_date')
        date_ord = sort_date.toordinal() if sort_date else 99999999
        return (priority, date_ord, t['id'])
    return sorted(transports, key=_key)


def _build_transport_view(transport: dict, data: dict, viewer_email: str, is_admin: bool) -> dict:
    tid = transport['id']
    waypoints = data['waypoints_by_transport'].get(tid, [])
    checkpoints = data['checkpoints_by_transport'].get(tid, [])
    return {
        'id': tid,
        'requestingPartner': transport['requestingPartner'],
        'origin': transport['origin'],
        'destination': transport['destination'],
        'driverName': transport['driverName'],
        'driverEmail': transport['driverEmail'],
        'backupName': transport['backupName'],
        'backupEmail': transport['backupEmail'],
        'coordinatorEmail': transport['coordinatorEmail'],
        'scheduledDate': transport['scheduledDate'],
        'status': transport['status'],
        'notes': transport['notes'],
        'waypoints': _compute_waypoint_states(waypoints, checkpoints),
        'checkpoints': [
            {
                'timestamp': c['timestamp'],
                'status': c['status'],
                'note': c['note'],
                'loggedByEmail': c['loggedByEmail'],
            }
            for c in checkpoints
        ],
        'canLog': is_admin or _viewer_matches(transport, viewer_email),
    }


def _compute_waypoint_states(waypoints: list, checkpoints: list) -> list:
    if not waypoints:
        return []
    logged_seqs = {c['waypointSequence'] for c in checkpoints if c['waypointSequence'] is not None}
    max_reached = max((w['sequence'] for w in waypoints if w['sequence'] in logged_seqs), default=None)
    current_assigned = False
    result = []
    for w in waypoints:
        if max_reached is not None and w['sequence'] <= max_reached:
            state = 'reached'
        elif not current_assigned:
            state = 'current'
            current_assigned = True
        else:
            state = 'upcoming'
        result.append({**w, 'state': state})
    return result


def _sanitize_for_sheet(note: str) -> str:
    """Prevent formula injection: prefix with apostrophe if note starts with =,+,-,@."""
    if note and note[0] in ('=', '+', '-', '@'):
        return "'" + note
    return note


# ---------------------------------------------------------------------------
# Events / Fundraisers
# ---------------------------------------------------------------------------

@_cached(lambda spreadsheet_id: f'events:{spreadsheet_id}')
def get_events(spreadsheet_id: str) -> dict:
    """
    Upcoming events and fundraisers. Sorted by date, soonest first.
    Past events (Event Date before today) are hidden automatically.
    """
    _, display_rows, raw_rows = _read_sheet_raw(spreadsheet_id, 'Events')
    if not display_rows:
        return {'events': [], 'count': 0}

    today = date.today()
    events = []
    for d, r in zip(display_rows, raw_rows):
        eid = d.get('Event ID', '')
        if not eid or eid.startswith('TEMPLATE-'):
            continue
        if d.get('Status', '') and d.get('Status', '') not in ('Published', 'Confirmed', 'Open'):
            continue
        date_raw = r.get('Event Date')
        event_date = _serial_to_date(date_raw) if isinstance(date_raw, (int, float)) else _parse_date(d.get('Event Date', ''))
        # Hide events that have already passed
        if event_date is not None and event_date < today:
            continue
        events.append({
            'id': eid,
            'title': d.get('Title') or 'Network event',
            'type': d.get('Event Type') or 'Event',
            'date': d.get('Event Date', ''),
            'time': d.get('Time', ''),
            'location': d.get('Location', ''),
            'state': d.get('State', ''),
            'description': d.get('Description', ''),
            'rsvpLabel': d.get('RSVP Label') or 'Learn more',
            'rsvpUrl': _public_url(d.get('RSVP URL', '')),
            'featured': d.get('Featured', '').lower() == 'yes',
            '_sort': event_date.toordinal() if event_date else float('inf'),
        })

    events.sort(key=lambda e: (not e['featured'], e['_sort']))
    for e in events:
        del e['_sort']
    return {'events': events, 'count': len(events)}


# ---------------------------------------------------------------------------
# Board meetings
# ---------------------------------------------------------------------------

@_cached(lambda spreadsheet_id: f'board_meetings:{spreadsheet_id}')
def get_board_meetings(spreadsheet_id: str) -> dict:
    """
    Public board / monthly meeting schedule. Upcoming meetings first, then
    a short list of recent past meetings (with minutes links if available).
    """
    _, display_rows, raw_rows = _read_sheet_raw(spreadsheet_id, 'Board Meetings')
    if not display_rows:
        return {'upcoming': [], 'past': [], 'count': 0}

    today = date.today()
    upcoming, past = [], []
    for d, r in zip(display_rows, raw_rows):
        mid = d.get('Meeting ID', '')
        if not mid or mid.startswith('TEMPLATE-'):
            continue
        date_raw = r.get('Meeting Date')
        meeting_date = _serial_to_date(date_raw) if isinstance(date_raw, (int, float)) else _parse_date(d.get('Meeting Date', ''))
        entry = {
            'id': mid,
            'title': d.get('Title') or 'Board meeting',
            'date': d.get('Meeting Date', ''),
            'time': d.get('Time', ''),
            'location': d.get('Location Or Link', ''),
            'agendaUrl': _public_url(d.get('Agenda URL', '')),
            'minutesUrl': _public_url(d.get('Minutes URL', '')),
            'openToPublic': d.get('Open To Public', '').lower() == 'yes',
            '_sort': meeting_date.toordinal() if meeting_date else 0,
        }
        if meeting_date is not None and meeting_date < today:
            past.append(entry)
        else:
            upcoming.append(entry)

    upcoming.sort(key=lambda m: m['_sort'])       # soonest first
    past.sort(key=lambda m: -m['_sort'])          # most recent first
    past = past[:6]                                # only show recent past meetings
    for m in upcoming + past:
        del m['_sort']
    return {'upcoming': upcoming, 'past': past, 'count': len(upcoming) + len(past)}


# ---------------------------------------------------------------------------
# Local news
# ---------------------------------------------------------------------------

@_cached(lambda spreadsheet_id: f'local_news:{spreadsheet_id}')
def get_local_news(spreadsheet_id: str) -> dict:
    """
    Local news / announcements feed, distinct from the emailed newsletter.
    Most recent first.
    """
    _, display_rows, raw_rows = _read_sheet_raw(spreadsheet_id, 'Local News')
    if not display_rows:
        return {'news_items': [], 'count': 0}

    items = []
    for d, r in zip(display_rows, raw_rows):
        nid = d.get('News ID', '')
        if not nid or nid.startswith('TEMPLATE-'):
            continue
        if d.get('Active', '') and d.get('Active', '').lower() != 'yes':
            continue
        date_raw = r.get('Date')
        news_date = _serial_to_date(date_raw) if isinstance(date_raw, (int, float)) else _parse_date(d.get('Date', ''))
        items.append({
            'id': nid,
            'headline': d.get('Headline') or 'Update',
            'date': d.get('Date', ''),
            'state': d.get('State', ''),
            'summary': d.get('Summary', ''),
            'linkLabel': d.get('Link Label') or 'Read more',
            'linkUrl': _public_url(d.get('Link URL', '')),
            'featured': d.get('Featured', '').lower() == 'yes',
            '_sort': news_date.toordinal() if news_date else -1,
        })

    items.sort(key=lambda i: (not i['featured'], -i['_sort']))
    for i in items:
        del i['_sort']
    return {'news_items': items, 'count': len(items)}


# ---------------------------------------------------------------------------
# In-kind donations (used crates, supplies, physical goods)
# ---------------------------------------------------------------------------

@_cached(lambda spreadsheet_id: f'inkind:{spreadsheet_id}')
def get_inkind_donations(spreadsheet_id: str) -> dict:
    """
    Accepted physical/in-kind donations (used crates, supplies, etc.),
    distinct from Amazon wishlists (buy-new) and cash Give Funds.
    """
    _, rows = _read_sheet(spreadsheet_id, 'In-Kind Donations')
    if not rows:
        return {'donation_items': [], 'count': 0}

    items = []
    for r in rows:
        name = r.get('Item', '')
        if not name or name.startswith('TEMPLATE-'):
            continue
        if r.get('Active', '') and r.get('Active', '').lower() != 'yes':
            continue
        items.append({
            'item': name,
            'condition': r.get('Condition Needed', '') or 'Good, clean condition',
            'notes': r.get('Notes', ''),
            'dropoff': r.get('Dropoff Or Pickup', ''),
            'contactUrl': _public_url(r.get('Contact URL', '')),
        })

    items.sort(key=lambda i: i['item'].lower())
    return {'donation_items': items, 'count': len(items)}


# ---------------------------------------------------------------------------
# Sponsor a Dog — individual dogs with a funding goal + progress
# ---------------------------------------------------------------------------

@_cached(lambda spreadsheet_id: f'sponsor_dog:{spreadsheet_id}')
def get_sponsor_dogs(spreadsheet_id: str) -> dict:
    """
    Individual dogs needing sponsorship, each with a photo, bio, funding goal,
    amount raised, and a progress percentage. Distinct from the general
    Give Funds — this is 'help THIS specific dog get home.'
    """
    _, rows = _read_sheet(spreadsheet_id, 'Sponsor A Dog')
    if not rows:
        return {'sponsor_dogs': [], 'count': 0}

    dogs = []
    for r in rows:
        dog_id = r.get('Dog ID', '')
        if not dog_id or dog_id.startswith('TEMPLATE-'):
            continue
        if r.get('Status', '') and r.get('Status', '').lower() != 'active':
            continue
        goal = _parse_amount(r.get('Goal Amount', ''))
        raised = _parse_amount(r.get('Raised Amount', ''))
        percent = min(100, max(0, round((raised / goal) * 100))) if goal > 0 else 0
        dogs.append({
            'id': dog_id,
            'name': r.get('Name') or 'A dog who needs you',
            'photoUrl': _public_url(r.get('Photo URL', '')),
            'bio': r.get('Bio', ''),
            'goalAmount': goal,
            'raisedAmount': raised,
            'percent': percent,
            'covers': r.get('What This Covers', ''),
            'sponsorUrl': _public_url(r.get('Sponsor URL', '')),
            'funded': goal > 0 and raised >= goal,
        })

    # Unfunded first (still need help), then by how close to goal (most funded first)
    dogs.sort(key=lambda d: (d['funded'], -d['percent']))
    return {'sponsor_dogs': dogs, 'count': len(dogs)}


# ---------------------------------------------------------------------------
# Shelter dog submission -> approval -> publish sync
# ---------------------------------------------------------------------------
#
# Flow (semi-automatic, keeps a human approval step):
#   1. Shelter submits the "Submit or Update a Dog" Google Form.
#   2. Responses land in that form's private response spreadsheet.
#   3. A coordinator reviews each row and puts "Yes" in an approval column
#      named "Publish?" (add this column to the response sheet once), and
#      optionally fills a "Dog ID" if not provided.
#   4. This sync copies rows where Publish? == Yes and Published? != Yes into
#      the public Dogs tab, then marks them Published? = Yes so they aren't
#      copied again.
#
# Nothing reaches the public site without that human "Publish? = Yes". This is
# deliberate: it's the safety boundary the whole project is built around.

# Maps public Dogs columns <- best-guess source columns from the form response.
# The form's question titles become the response-sheet headers; we match on a
# normalized (lowercased, punctuation-stripped) version so small wording
# differences still line up. Any unmatched public column is left blank.
_DOG_FIELD_ALIASES = {
    'Dog ID':                   ['dog id', 'existing dog id for updateremove', 'existing dog id'],
    'Name':                     ['dog name', 'name'],
    'Listing Status':           ['listing status', 'status'],
    'Primary Breed':            ['breed estimate', 'primary breed', 'breed'],
    'Age Group':                ['age group', 'age'],
    'Sex':                      ['sex'],
    'Size':                     ['size'],
    'City':                     ['city', 'current location city state', 'current location'],
    'State':                    ['state'],
    'Partner Organization':     ['partner id', 'organization', 'partner organization'],
    'Foster Needed?':           ['foster or transport need', 'foster needed'],
    'Urgency':                  ['urgency', 'urgent safety notes'],
    'Good With Dogs':           ['good with dogs'],
    'Good With Cats':           ['good with cats'],
    'Good With Children':       ['good with children'],
    'Short Description':        ['public bio', 'short description', 'bio'],
    'Photo URL':                ['photo video uploads', 'photo url', 'photo'],
    'Adoption Application URL': ['adoption application url for this dog', 'adoption application url'],
    'Sponsor URL':              ['sponsorship eligibility goal', 'sponsor url'],
    'Featured?':                ['featured'],
    'Last Verified':            ['timestamp', 'last verified'],
}


def _norm_header(h: str) -> str:
    return re.sub(r'[^a-z0-9 ]', '', str(h or '').lower()).strip()


def sync_submitted_dogs(response_spreadsheet_id: str, response_sheet_name: str,
                        public_spreadsheet_id: str) -> dict:
    """
    Copy approved dog submissions from the form response sheet into the public
    Dogs tab. Returns a summary dict. Requires a 'Publish?' column in the
    response sheet (coordinator sets it to 'Yes' to approve) and adds/uses a
    'Published?' column to avoid double-publishing.

    Raises RuntimeError with a clear message if the response sheet is missing
    the required approval columns, so a coordinator knows exactly what to add.
    """
    service = _get_service(write=True)

    # --- Read the response sheet (with header row) ---
    resp = (
        service.spreadsheets().values()
        .get(spreadsheetId=response_spreadsheet_id, range=response_sheet_name,
             valueRenderOption='FORMATTED_VALUE')
        .execute()
    )
    rows = resp.get('values', [])
    if len(rows) < 2:
        return {'published': 0, 'skipped': 0, 'message': 'No submissions to review.'}

    headers = [str(h).strip() for h in rows[0]]
    norm_headers = [_norm_header(h) for h in headers]

    def col_idx(*candidates):
        for cand in candidates:
            n = _norm_header(cand)
            if n in norm_headers:
                return norm_headers.index(n)
        return None

    publish_idx = col_idx('Publish?', 'Publish', 'Approved', 'Approve')
    if publish_idx is None:
        raise RuntimeError(
            "The response sheet has no 'Publish?' column. Add a column named "
            "'Publish?' and put 'Yes' in it for each reviewed, approved dog "
            "before running the sync."
        )
    published_idx = col_idx('Published?', 'Published')

    # If there's no Published? column, we add one so we can mark rows done.
    if published_idx is None:
        published_idx = len(headers)
        headers.append('Published?')
        norm_headers.append(_norm_header('Published?'))
        # Write the new header cell
        service.spreadsheets().values().update(
            spreadsheetId=response_spreadsheet_id,
            range=f"'{response_sheet_name}'!{_col_letter(published_idx)}1",
            valueInputOption='RAW', body={'values': [['Published?']]}
        ).execute()

    # --- Build public Dogs rows from approved, unpublished submissions ---
    public_headers, _ = _read_sheet(public_spreadsheet_id, 'Dogs')
    if not public_headers:
        # Fall back to the canonical order if the Dogs tab has no header yet
        public_headers = list(_DOG_FIELD_ALIASES.keys())

    to_publish = []          # rows for the public Dogs tab
    rows_to_mark = []        # response-sheet row numbers (1-based) to mark published
    skipped = 0

    for i, row in enumerate(rows[1:], start=2):  # start=2 -> 1-based incl. header
        def cell(idx):
            return row[idx].strip() if idx is not None and idx < len(row) else ''

        approved = cell(publish_idx).lower() in ('yes', 'true', 'approved', 'y')
        already = cell(published_idx).lower() in ('yes', 'true', 'y')
        if not approved or already:
            skipped += 1
            continue

        # Map each public column from the best-matching source column
        record = {}
        for public_col in public_headers:
            aliases = _DOG_FIELD_ALIASES.get(public_col, [public_col])
            src = col_idx(*aliases)
            record[public_col] = cell(src)

        # Sensible defaults so the public directory logic accepts the row
        if not record.get('Dog ID'):
            record['Dog ID'] = f'SUB-{i}'
        if not record.get('Listing Status'):
            record['Listing Status'] = 'Available'
        if not record.get('Urgency'):
            record['Urgency'] = 'Routine'

        to_publish.append([record.get(col, '') for col in public_headers])
        rows_to_mark.append(i)

    if not to_publish:
        return {'published': 0, 'skipped': skipped,
                'message': 'No newly approved submissions to publish.'}

    # --- Append to public Dogs tab ---
    service.spreadsheets().values().append(
        spreadsheetId=public_spreadsheet_id, range='Dogs',
        valueInputOption='USER_ENTERED', insertDataOption='INSERT_ROWS',
        body={'values': to_publish}
    ).execute()

    # --- Mark those response rows Published? = Yes ---
    data = [{
        'range': f"'{response_sheet_name}'!{_col_letter(published_idx)}{r}",
        'values': [['Yes']]
    } for r in rows_to_mark]
    service.spreadsheets().values().batchUpdate(
        spreadsheetId=response_spreadsheet_id,
        body={'valueInputOption': 'RAW', 'data': data}
    ).execute()

    # Bust the public dogs cache so the new dogs show right away
    clear_cache(f'dogs:{public_spreadsheet_id}')

    return {'published': len(to_publish), 'skipped': skipped,
            'message': f'Published {len(to_publish)} dog(s) to the public directory.'}


def _col_letter(idx0: int) -> str:
    """0-based column index -> spreadsheet letter (0->A, 26->AA)."""
    n = idx0 + 1
    letters = ''
    while n > 0:
        n, rem = divmod(n - 1, 26)
        letters = chr(65 + rem) + letters
    return letters
