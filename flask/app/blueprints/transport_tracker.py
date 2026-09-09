"""
Transport tracker blueprint — private, sign-in-gated.

Uses Google OAuth (Authlib) to authenticate drivers and coordinators.
The viewer's identity comes ONLY from the verified Google ID token —
never from any client-supplied parameter.

Access model (mirrors the original Apps Script implementation):
  - Admin (email in Transport Admins tab) → sees all transports.
  - Non-admin → sees ONLY transports where their email matches the
    Assigned Driver Email, Backup Contact Email, or Coordinator Email.

Never embed this on the public site. Share the /tracker/ URL directly
with drivers and coordinators.
"""
import json
from functools import wraps
from flask import (
    Blueprint, render_template, session, redirect, url_for,
    request, jsonify, current_app, flash
)
from authlib.integrations.flask_client import OAuth
from .. import sheets

bp = Blueprint('transport_tracker', __name__, url_prefix='/tracker')

# Authlib OAuth registry — initialized lazily so it picks up app config
_oauth = OAuth()
_google_registered = False


def _get_google_client():
    """Return (and lazily register) the Google OAuth client."""
    global _google_registered
    if not _google_registered:
        _oauth.init_app(current_app._get_current_object())
        _oauth.register(
            name='google',
            client_id=current_app.config['GOOGLE_OAUTH_CLIENT_ID'],
            client_secret=current_app.config['GOOGLE_OAUTH_CLIENT_SECRET'],
            server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
            client_kwargs={'scope': 'openid email profile'},
        )
        _google_registered = True
    return _oauth.google


def _login_required(fn):
    """Decorator: redirect to Google sign-in if not authenticated."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if 'viewer_email' not in session:
            session['next'] = request.url
            return redirect(url_for('transport_tracker.login'))
        return fn(*args, **kwargs)
    return wrapper


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------

@bp.route('/login')
def login():
    redirect_uri = url_for('transport_tracker.authorized', _external=True)
    return _get_google_client().authorize_redirect(redirect_uri)


@bp.route('/authorized')
def authorized():
    try:
        token = _get_google_client().authorize_access_token()
        user_info = token.get('userinfo') or _get_google_client().userinfo()
        email = user_info.get('email', '').lower().strip()
        if not email:
            flash('Could not retrieve your Google account email. Try again.', 'error')
            return redirect(url_for('transport_tracker.board'))
        session['viewer_email'] = email
        session['viewer_name'] = user_info.get('name', email)
    except Exception as e:
        flash(f'Sign-in failed: {e}', 'error')
        return redirect(url_for('transport_tracker.board'))
    next_url = session.pop('next', url_for('transport_tracker.board'))
    return redirect(next_url)


@bp.route('/logout')
def logout():
    session.pop('viewer_email', None)
    session.pop('viewer_name', None)
    return redirect(url_for('transport_tracker.board'))


# ---------------------------------------------------------------------------
# Board (read)
# ---------------------------------------------------------------------------

@bp.route('/')
@_login_required
def board():
    viewer = session['viewer_email']
    priv_id = current_app.config['PRIVATE_SPREADSHEET_ID']
    try:
        data = sheets.get_transport_board(priv_id, viewer)
    except Exception as e:
        data = {
            'signed_in': True,
            'viewer_email': viewer,
            'is_admin': False,
            'count': 0,
            'transports': [],
            'overall_statuses': sheets.OVERALL_STATUSES,
            'checkpoint_statuses': sheets.CHECKPOINT_STATUSES,
            'error': str(e),
        }
    return render_template('transport_tracker/board.html', data=data)


# ---------------------------------------------------------------------------
# Log checkpoint (write)
# ---------------------------------------------------------------------------

@bp.route('/log-checkpoint', methods=['POST'])
@_login_required
def log_checkpoint():
    """
    AJAX endpoint. Called from the transport board page via fetch().
    Returns JSON: { transport: <updated transport view> } on success,
    or { error: <message> } on failure.

    Authorization is re-verified server-side on every write — nothing from
    the client or the session is trusted for access decisions except the
    verified viewer email in session['viewer_email'].
    """
    viewer = session['viewer_email']
    priv_id = current_app.config['PRIVATE_SPREADSHEET_ID']

    payload = request.get_json(silent=True) or {}
    transport_id = str(payload.get('transport_id', '')).strip()
    waypoint_seq = payload.get('waypoint_sequence', '')
    status = str(payload.get('status', '')).strip()
    note = str(payload.get('note', '')).strip()

    try:
        updated = sheets.log_checkpoint(priv_id, viewer, transport_id, waypoint_seq, status, note)
        return jsonify({'transport': updated})
    except PermissionError as e:
        return jsonify({'error': str(e)}), 403
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Could not save that update. Try again. ({e})'}), 500
