from django.urls import path

from .views import (
    github_login,
    github_callback,
    github_me,
    github_logout,
)


urlpatterns = [
    path(
        "github/login/",
        github_login,
        name="github_login",
    ),

    path(
        "github/callback/",
        github_callback,
        name="github_callback",
    ),

    path(
        "me/",
        github_me,
        name="github_me",
    ),

    path(
        "logout/",
        github_logout,
        name="github_logout",
    ),
]