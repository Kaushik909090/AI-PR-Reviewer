import secrets
from urllib.parse import urlencode

from django.conf import settings


GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"


def generate_state():
    """
    Generate a random state value to protect
    the OAuth flow against CSRF attacks.
    """
    return secrets.token_urlsafe(32)


def get_github_authorization_url(state):
    """
    Build the GitHub OAuth authorization URL.
    """

    params = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "redirect_uri": settings.GITHUB_REDIRECT_URI,
        "scope": "read:user user:email repo",
        "state": state,
    }

    return f"{GITHUB_AUTHORIZE_URL}?{urlencode(params)}"