"""Adopt & Foster page — dog directory + foster openings board."""
from flask import Blueprint, render_template, current_app
from .. import sheets

bp = Blueprint('adopt', __name__, url_prefix='/adopt-foster')


@bp.route('/')
def index():
    pub_id = current_app.config['PUBLIC_SPREADSHEET_ID']
    try:
        dogs_data = sheets.get_dogs(pub_id)
    except Exception as e:
        dogs_data = {'dogs': [], 'count': 0, 'error': str(e)}
    try:
        foster_data = sheets.get_foster_openings(pub_id)
    except Exception as e:
        foster_data = {'openings': [], 'count': 0, 'error': str(e)}
    return render_template('adopt/index.html', dogs_data=dogs_data, foster_data=foster_data)
