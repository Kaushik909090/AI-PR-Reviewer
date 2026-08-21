from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from django.views.decorators.csrf import ensure_csrf_cookie


@ensure_csrf_cookie
def csrf_token(request):
    return JsonResponse({
        "message": "CSRF cookie set"
    })


def home(request):
    return JsonResponse({
        "message": "AI PR Reviewer API is running!",
        "status": "success",
    })


urlpatterns = [
    path("", home, name="home"),

    path(
        "admin/",
        admin.site.urls,
    ),

    path(
        "auth/csrf/",
        csrf_token,
        name="csrf_token",
    ),

    path(
        "auth/",
        include("accounts.urls"),
    ),

    path(
        "api/github/",
        include("github_api.urls"),
    ),

    path(
        "api/review/",
        include("ai_review.urls"),
    ),
]