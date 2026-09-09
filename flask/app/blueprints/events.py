"""Events & Fundraisers page."""
from flask import Blueprint, render_template, current_app
from .. import sheets

bp = Blueprint('events', __name__, url_prefix='/events')


@bp.route('/')
def index():
    pub_id = current_app.config['PUBLIC_SPREADSHEET_ID']
    try:
        data = sheets.get_events(pub_id)
    except Exception as e:
        data = {'events': [], 'count': 0, 'error': str(e)}
    return render_template('events/index.html', data=data)
