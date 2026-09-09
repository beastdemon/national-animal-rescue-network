"""Transport public page — info, request-a-transport form link, volunteer links."""
from flask import Blueprint, render_template

bp = Blueprint('transport_public', __name__, url_prefix='/transport')


@bp.route('/')
def index():
    return render_template('transport_public/index.html')
