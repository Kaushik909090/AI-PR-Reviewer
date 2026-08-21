from django.urls import path

from .views import (
    github_login,
    github_callback,
    github_me,
    github_logout,
)


urlpatterns = [

    # GitHub OAuth login
    path(
        "github/login/",
        github_login,
        name="github_login",
    ),

    # GitHub OAuth callback
    path(
        "github/callback/",
        github_callback,
        name="github_callback",
    ),

    # Current authenticated user
    path(
        "github/me/",
        github_me,
        name="github_me",
    ),

    # Logout
    path(
        "github/logout/",
        github_logout,
        name="github_logout",
    ),

]