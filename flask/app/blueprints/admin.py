"""
Admin utilities — cache management.
Protect this blueprint with a secret token in production.
"""
from flask import Blueprint, request, jsonify, current_app
from .. import sheets

bp = Blueprint('admin', __name__, url_prefix='/admin')

_ADMIN_TOKEN_HEADER = 'X-Admin-Token'


def _check_token():
    """Return True if the request carries the configured admin token."""
    token = current_app.config.get('ADMIN_TOKEN', '')
    # If no token is configured, only allow from localhost in dev
    if not token:
        return current_app.debug and request.remote_addr in ('127.0.0.1', '::1')
    return request.headers.get(_ADMIN_TOKEN_HEADER) == token


@bp.route('/clear-cache', methods=['POST'])
def clear_cache():
    if not _check_token():
        return jsonify({'error': 'Unauthorized'}), 401
    key = request.args.get('key')
    sheets.clear_cache(key)
    return jsonify({'cleared': key or 'all'})


@bp.route('/publish-dogs', methods=['POST'])
def publish_dogs():
    """
    Publish approved shelter dog submissions to the public Dogs tab.
    A coordinator marks 'Publish? = Yes' on rows in the form response sheet,
    then triggers this. Nothing publishes without that human approval.
    """
    if not _check_token():
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        result = sheets.sync_submitted_dogs(
            response_spreadsheet_id=current_app.config['SUBMIT_DOG_RESPONSE_SHEET_ID'],
            response_sheet_name=current_app.config['SUBMIT_DOG_RESPONSE_TAB'],
            public_spreadsheet_id=current_app.config['PUBLIC_SPREADSHEET_ID'],
        )
        return jsonify(result)
    except RuntimeError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Sync failed: {e}'}), 500
