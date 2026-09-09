"""Local News page (distinct from the emailed newsletter)."""
from flask import Blueprint, render_template, current_app
from .. import sheets

bp = Blueprint('news', __name__, url_prefix='/news')


@bp.route('/')
def index():
    pub_id = current_app.config['PUBLIC_SPREADSHEET_ID']
    try:
        data = sheets.get_local_news(pub_id)
    except Exception as e:
        data = {'news_items': [], 'count': 0, 'error': str(e)}
    return render_template('news/index.html', data=data)
