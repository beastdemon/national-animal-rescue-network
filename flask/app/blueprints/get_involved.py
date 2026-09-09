"""Get Involved — volunteer role board."""
import urllib.parse
from flask import Blueprint, render_template, current_app
from .. import sheets

bp = Blueprint('get_involved', __name__, url_prefix='/get-involved')

ROLES = [
    {
        'id': 'foster',
        'title': 'Foster',
        'description': 'Take a dog into your home between rescue and placement. Feed, walk, and send updates so we can match them to the right adopter faster.',
        'commitment': '2–8 weeks typical, longer for medical or behavioral holds',
        'param': 'foster',
    },
    {
        'id': 'transport-ground',
        'title': 'Ground transport',
        'description': 'Drive one leg of a relay — a set pickup point, a set drop point, done. You get the route and the handoff details before you commit to a leg.',
        'commitment': 'One leg, usually 2–4 hours',
        'param': 'transport-ground',
    },
    {
        'id': 'transport-air',
        'title': 'Aviation transport',
        'description': 'Fly a dog in cabin or cargo on a trip you already have booked, or fly a leg we need covered if you pilot your own aircraft.',
        'commitment': 'Varies by flight, scheduled in advance',
        'param': 'transport-air',
    },
    {
        'id': 'photography',
        'title': 'Photography',
        'description': 'Shoot intake and adoption-ready photos that get a dog looked at twice. Bring a camera or a good phone and follow the shot list.',
        'commitment': '1–2 hours per session, as needed',
        'param': 'photography',
    },
    {
        'id': 'evaluator',
        'title': 'Dog evaluation',
        'description': 'Run a temperament read on an incoming dog — sociability, handling, resource guarding — so fosters and adopters know what they are getting.',
        'commitment': '30–60 minutes per evaluation',
        'param': 'evaluator',
    },
    {
        'id': 'advocacy',
        'title': 'Advocacy',
        'description': 'Speak for the network at local hearings, on shelter policy, or in your own network when a case needs visibility.',
        'commitment': 'As issues come up',
        'param': 'advocacy',
    },
    {
        'id': 'events',
        'title': 'Events & fundraising',
        'description': 'Run a table at an adoption event, or organize a fundraiser end to end — pitch, logistics, and payout.',
        'commitment': 'Per event, a few hours to a few weeks of lead time',
        'param': 'events',
    },
    {
        'id': 'state-rep',
        'title': 'State representative',
        'description': "Be the network's point of contact in your state — coordinate local fosters, transporters, and partner shelters.",
        'commitment': 'Ongoing, a few hours a week',
        'param': 'state-rep',
    },
    {
        'id': 'admin',
        'title': 'Administrative support',
        'description': 'Handle intake paperwork, data entry, or scheduling so the field side of the network can stay in the field.',
        'commitment': 'Flexible, remote-friendly',
        'param': 'admin',
    },
]


def _build_apply_url(base_url: str, param: str) -> str:
    if not base_url or not base_url.startswith('https://'):
        return ''
    sep = '&' if '?' in base_url else '?'
    return f"{base_url}{sep}role={urllib.parse.quote(param)}"


@bp.route('/')
def index():
    pub_id = current_app.config['PUBLIC_SPREADSHEET_ID']
    form_url = current_app.config.get('GENERAL_VOLUNTEER_FORM_URL', '')

    try:
        urgent_needs = sheets.get_volunteer_needs(pub_id)
    except Exception:
        urgent_needs = []

    roles = [
        {**role, 'applyUrl': _build_apply_url(form_url, role['param'])}
        for role in ROLES
    ]
    return render_template('get_involved/index.html', roles=roles, urgent_needs=urgent_needs)
