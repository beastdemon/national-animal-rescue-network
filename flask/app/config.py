"""
NARN Flask — application configuration.

Locally: secrets come from .env at the repo root (loaded by python-dotenv).
On Railway: environment variables are injected directly — no .env file needed.
"""
import json
import os
from dotenv import load_dotenv

# Load .env from the repo root when running locally.
# In production (Railway) this file won't exist — load_dotenv does nothing
# and os.environ already has everything Railway injected.
_repo_root = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(_repo_root, override=False)


class Config:
    # ---- Flask core ----
    SECRET_KEY = os.environ.get('FLASK_SECRET_KEY', 'dev-secret-change-me')

    # ---- Google Sheets IDs ----
    PUBLIC_SPREADSHEET_ID = os.environ.get(
        'PUBLIC_SPREADSHEET_ID',
        '1RmsTUYjzOMbP_2a9L4IPT55xeo284N97f4dxiFN9jDU'
    )
    PRIVATE_SPREADSHEET_ID = os.environ.get(
        'PRIVATE_SPREADSHEET_ID',
        '1kjfmQncW2LBI2-Lo9T4SzYW7lC-ddHZy_f9kNUlA1NY'
    )

    # ---- Service account JSON ----
    @staticmethod
    def service_account_info():
        raw = os.environ.get('GOOGLE_SERVICE_ACCOUNT_JSON', '')
        if not raw:
            raise RuntimeError(
                'GOOGLE_SERVICE_ACCOUNT_JSON is not set. '
                'Add it to Railway environment variables before deploying.'
            )
        return json.loads(raw)

    # ---- OAuth 2.0 (transport tracker sign-in) ----
    GOOGLE_OAUTH_CLIENT_ID = os.environ.get('GOOGLE_OAUTH_CLIENT_ID', '')
    GOOGLE_OAUTH_CLIENT_SECRET = os.environ.get('GOOGLE_OAUTH_CLIENT_SECRET', '')

    # ---- Volunteer form ----
    GENERAL_VOLUNTEER_FORM_URL = os.environ.get('GENERAL_VOLUNTEER_FORM_URL', '')

    # ---- Cache TTL ----
    CACHE_TTL = int(os.environ.get('CACHE_TTL', '300'))


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig,
}
