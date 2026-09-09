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
