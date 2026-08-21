import requests

from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import redirect

from database.mongodb import db
from database.users import create_or_update_user

from .github_oauth import (
    generate_state,
    get_github_authorization_url,
)


# ============================================================
# GITHUB LOGIN
# ============================================================

def github_login(request):
    """
    Start the GitHub OAuth login process.
    """

    state = generate_state()

    # Store OAuth state in Django session.
    request.session["github_oauth_state"] = state

    authorization_url = get_github_authorization_url(
        state
    )

    return redirect(authorization_url)


# ============================================================
# GITHUB CALLBACK
# ============================================================

def github_callback(request):
    """
    Handle the GitHub OAuth callback.
    """

    # --------------------------------------------------------
    # 1. Check whether GitHub returned an error
    # --------------------------------------------------------

    error = request.GET.get("error")

    if error:
        error_description = request.GET.get(
            "error_description",
            "GitHub authorization was denied."
        )

        return JsonResponse(
            {
                "error": error,
                "message": error_description,
            },
            status=400,
        )

    # --------------------------------------------------------
    # 2. Get authorization code
    # --------------------------------------------------------

    code = request.GET.get("code")

    if not code:
        return JsonResponse(
            {
                "error": "Authorization code not found."
            },
            status=400,
        )

    # --------------------------------------------------------
    # 3. Validate OAuth state
    # --------------------------------------------------------

    state = request.GET.get("state")

    stored_state = request.session.get(
        "github_oauth_state"
    )

    if not state or state != stored_state:
        return JsonResponse(
            {
                "error": "Invalid OAuth state."
            },
            status=400,
        )

    # State successfully validated.
    request.session.pop(
        "github_oauth_state",
        None
    )

    # --------------------------------------------------------
    # 4. Exchange authorization code for access token
    # --------------------------------------------------------

    try:
        token_response = requests.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.GITHUB_REDIRECT_URI,
            },
            headers={
                "Accept": "application/json",
            },
            timeout=10,
        )

    except requests.RequestException as e:
        return JsonResponse(
            {
                "error": "Could not connect to GitHub.",
                "details": str(e),
            },
            status=502,
        )

    if token_response.status_code != 200:
        return JsonResponse(
            {
                "error": "Failed to exchange authorization code."
            },
            status=400,
        )

    token_data = token_response.json()

    access_token = token_data.get(
        "access_token"
    )

    if not access_token:
        return JsonResponse(
            {
                "error": "GitHub did not return an access token."
            },
            status=400,
        )

    # --------------------------------------------------------
    # 5. Get GitHub user information
    # --------------------------------------------------------

    try:
        user_response = requests.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            },
            timeout=10,
        )

    except requests.RequestException as e:
        return JsonResponse(
            {
                "error": "Could not connect to GitHub.",
                "details": str(e),
            },
            status=502,
        )

    if user_response.status_code != 200:
        return JsonResponse(
            {
                "error": "Failed to fetch GitHub user."
            },
            status=400,
        )

    github_user = user_response.json()

    # --------------------------------------------------------
    # 6. Save user + encrypted token in MongoDB
    # --------------------------------------------------------

    try:
        create_or_update_user(
            github_user,
            access_token,
        )

    except Exception as e:
        return JsonResponse(
            {
                "error": "Failed to save user.",
                "details": str(e),
            },
            status=500,
        )

    # --------------------------------------------------------
    # 7. Store GitHub ID in Django session
    # --------------------------------------------------------

    request.session["github_id"] = github_user["id"]

    # Explicitly save the session.
    request.session.save()

    # --------------------------------------------------------
    # 8. Redirect to React Dashboard
    # --------------------------------------------------------

    return redirect(
        f"{settings.FRONTEND_URL}/dashboard"
    )


# ============================================================
# CURRENT USER
# ============================================================

def github_me(request):
    """
    Return the currently authenticated GitHub user.
    """

    # Get GitHub ID from Django session.
    github_id = request.session.get(
        "github_id"
    )

    if not github_id:
        return JsonResponse(
            {
                "authenticated": False,
                "message": "User is not authenticated.",
            },
            status=401,
        )

    # Find user in MongoDB.
    user = db["users"].find_one(
        {
            "github_id": github_id
        },
        {
            "_id": 0,

            # Only return public information.
            "github_id": 1,
            "username": 1,
            "name": 1,
            "avatar_url": 1,
        }
    )

    if not user:

        # MongoDB user no longer exists.
        request.session.flush()

        return JsonResponse(
            {
                "authenticated": False,
                "message": "User account not found.",
            },
            status=401,
        )

    return JsonResponse(
        {
            "authenticated": True,
            "user": user,
        }
    )


# ============================================================
# LOGOUT
# ============================================================

def github_logout(request):
    """
    Log out the current user by destroying
    the Django session.
    """

    request.session.flush()

    return JsonResponse(
        {
            "message": "Logged out successfully.",
            "authenticated": False,
        }
    )