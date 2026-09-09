"""Homepage blueprint."""
from flask import Blueprint, render_template, current_app
from .. import sheets

bp = Blueprint('main', __name__)


@bp.route('/')
def index():
    pub_id = current_app.config['PUBLIC_SPREADSHEET_ID']
    try:
        needs_data = sheets.get_current_needs(pub_id)
    except Exception:
        needs_data = {'needs': [], 'count': 0}
    try:
        dogs_data = sheets.get_dogs(pub_id)
        featured = [d for d in dogs_data['dogs'] if d['featured']][:3]
        if not featured:
            featured = dogs_data['dogs'][:3]
    except Exception:
        featured = []
    return render_template('main/index.html', needs=needs_data['needs'], featured_dogs=featured)
