from django.urls import path

from .views import (
    repositories,
    pull_requests,
    pull_request_files,
    review_pull_request,
    review_history,
    post_review_to_github,
)


urlpatterns = [

    # ============================================================
    # REPOSITORIES
    # ============================================================

    path(
        "repositories/",
        repositories,
        name="repositories",
    ),

    # ============================================================
    # PULL REQUESTS
    # ============================================================

    path(
        "repositories/<str:owner>/<str:repo_name>/pull-requests/",
        pull_requests,
        name="pull_requests",
    ),

    # ============================================================
    # PULL REQUEST FILES
    # ============================================================

    path(
        "repositories/<str:owner>/<str:repo_name>/pull-requests/<int:pr_number>/files/",
        pull_request_files,
        name="pull_request_files",
    ),

    # ============================================================
    # AI REVIEW
    # ============================================================

    path(
        "review/",
        review_pull_request,
        name="review_pull_request",
    ),

    # ============================================================
    # REVIEW HISTORY
    # ============================================================

    path(
        "history/",
        review_history,
        name="review_history",
    ),

    # ============================================================
    # POST AI REVIEW TO GITHUB
    # ============================================================

    path(
        "review/post-to-github/",
        post_review_to_github,
        name="post_review_to_github",
    ),
]