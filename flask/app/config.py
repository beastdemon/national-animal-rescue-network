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

    # ---- Volunteer form (kept for backward compat; also in FORMS below) ----
    GENERAL_VOLUNTEER_FORM_URL = os.environ.get(
        'GENERAL_VOLUNTEER_FORM_URL',
        'https://docs.google.com/forms/d/e/1FAIpQLSefNYceX2vLE4M5EGdiYRwGJ8Mz6CVuveFhJ-eJYHc6cR_5Og/viewform'
    )

    # ---- Google Form live URLs (share/viewform links) ----
    # Each can be overridden by an env var of the same name if forms are
    # rebuilt. Defaults are the current live forms.
    FORMS = {
        'adoption':        os.environ.get('FORM_ADOPTION',        'https://docs.google.com/forms/d/e/1FAIpQLSfcD6dSMTWMZSg2UA-_AV3yRMO8klhueH4dVvSDi69RBv73jA/viewform'),
        'foster':          os.environ.get('FORM_FOSTER',          'https://docs.google.com/forms/d/e/1FAIpQLSfDh_unULLyJ9jOta0FIkN64jkBOWTHinr2DO6zDS0ZVuJCrQ/viewform'),
        'volunteer':       os.environ.get('FORM_VOLUNTEER',       'https://docs.google.com/forms/d/e/1FAIpQLSefNYceX2vLE4M5EGdiYRwGJ8Mz6CVuveFhJ-eJYHc6cR_5Og/viewform'),
        'evaluator':       os.environ.get('FORM_EVALUATOR',       'https://docs.google.com/forms/d/e/1FAIpQLSdkBXJOiagbtLPs6b9FvCGfM_sBraprKKHrkhxNzvLzl_lGJg/viewform'),
        'partner':         os.environ.get('FORM_PARTNER',         'https://docs.google.com/forms/d/e/1FAIpQLSe8DvMPsqwmMbaPzFsfGGp_rT_uzLXlpu2KzgDPPqhjZHt1Wg/viewform'),
        'submit_dog':      os.environ.get('FORM_SUBMIT_DOG',      'https://docs.google.com/forms/d/e/1FAIpQLScCjCFzP0UHUeaWc8h3kfUVz2Isyo-Mxsfqe_KWOeFWu-rRwg/viewform'),
        'rescue_availability': os.environ.get('FORM_RESCUE_AVAILABILITY', 'https://docs.google.com/forms/d/e/1FAIpQLSdQphpGYrp6TTvUshXmDDONCZFB9Rp16fDVAacA-TLabYaQ2Q/viewform'),
        'transport_request': os.environ.get('FORM_TRANSPORT_REQUEST', 'https://docs.google.com/forms/d/e/1FAIpQLScU-FsNLKU-nNvvgQeCYfG8NI1QorTmFpvB83vim9ivpNRNLg/viewform'),
        'evaluation_submission': os.environ.get('FORM_EVALUATION_SUBMISSION', 'https://docs.google.com/forms/d/e/1FAIpQLScwQTOHyOJg0RGOeQB4dpvBzhTUj3EiIbg_0kah9QgNF7Ea4Q/viewform'),
        'event_proposal':  os.environ.get('FORM_EVENT_PROPOSAL',  'https://docs.google.com/forms/d/e/1FAIpQLSflPY5yvNeLiYRnBxPHIiIQL5jSFcuYoNf0uf65WUYM622alg/viewform'),
        'newsletter':      os.environ.get('FORM_NEWSLETTER',      'https://docs.google.com/forms/d/e/1FAIpQLSdPcrg0Ah3ZbgvQjVIalmE28A5xcj_aIlOtKDbbx9PZrJIhZg/viewform'),
        'contact':         os.environ.get('FORM_CONTACT',         'https://docs.google.com/forms/d/e/1FAIpQLSf4QfsVD1j5DPfWKaChyqtxu4AT3_KiV9vpP_3cUMvcgFmy6A/viewform'),
        'state_advocate':  os.environ.get('FORM_STATE_ADVOCATE',  'https://docs.google.com/forms/d/e/1FAIpQLSc83yujRBx0X6VoiY5MoPmR7lDVvBPzAxH3_URbyDHz7uVQCg/viewform'),
    }

    # ---- Social media links (empty until Amber provides them) ----
    # Set these via env vars when the accounts exist; the footer icons only
    # appear for links that are set.
    # Generic platform URLs as defaults so the footer icons are visible now.
    # Amber replaces each with the real profile URL via env vars when ready.
    # `or default` so an empty env var (e.g. SOCIAL_FACEBOOK= in .env) still
    # falls back to the generic platform URL rather than rendering blank.
    SOCIAL = {
        'facebook':  os.environ.get('SOCIAL_FACEBOOK')  or 'https://www.facebook.com/',
        'instagram': os.environ.get('SOCIAL_INSTAGRAM') or 'https://www.instagram.com/',
        'tiktok':    os.environ.get('SOCIAL_TIKTOK')    or 'https://www.tiktok.com/',
        'youtube':   os.environ.get('SOCIAL_YOUTUBE')   or 'https://www.youtube.com/',
        'x':         os.environ.get('SOCIAL_X')         or 'https://x.com/',
    }

    # ---- Shelter dog submission sync ----
    # The spreadsheet ID of the "Submit or Update a Dog" form's response sheet,
    # and the tab name within it (Google names the first tab "Form Responses 1").
    # Find the ID in the response sheet URL:
    #   https://docs.google.com/spreadsheets/d/<THIS_ID>/edit
    SUBMIT_DOG_RESPONSE_SHEET_ID = os.environ.get('SUBMIT_DOG_RESPONSE_SHEET_ID', '1sK3_1tHw8wWjMCStQx39h1K5ducARmNxyfjIwE10jvo')
    SUBMIT_DOG_RESPONSE_TAB = os.environ.get('SUBMIT_DOG_RESPONSE_TAB', 'Form Responses 1')

    # ---- Admin token (protects /admin endpoints in production) ----
    ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN', '')

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
