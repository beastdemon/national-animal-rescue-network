"""News & Resources page — resources directory + newsletter archive."""
from itertools import groupby
from flask import Blueprint, render_template, current_app
from .. import sheets

bp = Blueprint('resources', __name__, url_prefix='/resources')


@bp.route('/')
def index():
    pub_id = current_app.config['PUBLIC_SPREADSHEET_ID']
    try:
        res_data = sheets.get_resources(pub_id)
    except Exception as e:
        res_data = {'resources': [], 'count': 0, 'error': str(e)}
    try:
        news_data = sheets.get_newsletter_archive(pub_id)
        # Group issues by year, maintaining newest-first order
        issues_by_year = {}
        for issue in news_data['issues']:
            issues_by_year.setdefault(issue['year'], []).append(issue)
        year_groups = [
            {'year': year, 'issues': issues}
            for year, issues in issues_by_year.items()
        ]
    except Exception as e:
        year_groups = []
        news_data = {'issues': [], 'count': 0, 'error': str(e)}
    return render_template(
        'resources/index.html',
        res_data=res_data,
        year_groups=year_groups,
        news_data=news_data,
    )
