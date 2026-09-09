"""About page — mission, state champions, board meetings."""
from flask import Blueprint, render_template, current_app
from .. import sheets

bp = Blueprint('about', __name__, url_prefix='/about')


@bp.route('/')
def index():
    pub_id = current_app.config['PUBLIC_SPREADSHEET_ID']
    try:
        champions_data = sheets.get_state_champions(pub_id)
    except Exception as e:
        champions_data = {'states': [], 'count': 0, 'error': str(e)}
    try:
        meetings_data = sheets.get_board_meetings(pub_id)
    except Exception as e:
        meetings_data = {'upcoming': [], 'past': [], 'count': 0, 'error': str(e)}
    return render_template(
        'about/index.html',
        champions_data=champions_data,
        meetings_data=meetings_data,
    )
