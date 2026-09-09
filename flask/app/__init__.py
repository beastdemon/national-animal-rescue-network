"""
NARN Flask — application factory.
"""
import os
from flask import Flask
from .config import config
from . import sheets as _sheets


def create_app(config_name: str = None) -> Flask:
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__, instance_relative_config=False)
    cfg = config.get(config_name, config['default'])
    app.config.from_object(cfg)

    # Resolve service account info once at startup
    app.config['SERVICE_ACCOUNT_INFO'] = cfg.service_account_info()

    # Apply cache TTL
    _sheets.init_cache(app.config['CACHE_TTL'])

    # ---- Register blueprints ----
    from .blueprints.main import bp as main_bp
    from .blueprints.adopt import bp as adopt_bp
    from .blueprints.transport_public import bp as transport_public_bp
    from .blueprints.partners import bp as partners_bp
    from .blueprints.get_involved import bp as get_involved_bp
    from .blueprints.resources import bp as resources_bp
    from .blueprints.about import bp as about_bp
    from .blueprints.give import bp as give_bp
    from .blueprints.transport_tracker import bp as tracker_bp
    from .blueprints.contact import bp as contact_bp
    from .blueprints.admin import bp as admin_bp
    from .blueprints.events import bp as events_bp
    from .blueprints.news import bp as news_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(adopt_bp)
    app.register_blueprint(transport_public_bp)
    app.register_blueprint(partners_bp)
    app.register_blueprint(get_involved_bp)
    app.register_blueprint(resources_bp)
    app.register_blueprint(about_bp)
    app.register_blueprint(give_bp)
    app.register_blueprint(tracker_bp)
    app.register_blueprint(contact_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(news_bp)

    # Inject `now` and the form URLs into every template.
    from datetime import datetime as _dt
    import re as _re

    def _embed_url(view_url: str) -> str:
        """Turn a Google Form /viewform link into an ?embedded=true version."""
        if not view_url:
            return ''
        base = _re.sub(r'\?.*$', '', view_url)
        sep = '&' if '?' in view_url else '?'
        return f'{view_url}{sep}embedded=true' if '?' not in view_url else f'{base}?embedded=true'

    @app.context_processor
    def inject_globals():
        return {
            'now': _dt.utcnow(),
            'forms': app.config.get('FORMS', {}),
            'embed_form': _embed_url,
            'social': app.config.get('SOCIAL', {}),
        }

    return app
