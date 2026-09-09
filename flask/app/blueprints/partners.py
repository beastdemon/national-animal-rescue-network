"""Shelter & Rescue Partners directory."""
from flask import Blueprint, render_template, current_app
from .. import sheets

bp = Blueprint('partners', __name__, url_prefix='/partners')


@bp.route('/')
def index():
    pub_id = current_app.config['PUBLIC_SPREADSHEET_ID']
    try:
        data = sheets.get_partners(pub_id)
    except Exception as e:
        data = {'partners': [], 'count': 0, 'error': str(e)}
    return render_template('partners/index.html', data=data)
