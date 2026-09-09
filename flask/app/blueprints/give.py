"""Give page — fund designations, Amazon wishlists, future project funding."""
from flask import Blueprint, render_template, current_app
from .. import sheets

bp = Blueprint('give', __name__, url_prefix='/give')


@bp.route('/')
def index():
    pub_id = current_app.config['PUBLIC_SPREADSHEET_ID']
    try:
        data = sheets.get_give_hub(pub_id)
    except Exception as e:
        data = {'funds': [], 'wishlists': [], 'projects': [], 'error': str(e)}
    try:
        inkind = sheets.get_inkind_donations(pub_id)
    except Exception:
        inkind = {'donation_items': [], 'count': 0}
    return render_template('give/index.html', data=data, inkind=inkind)
