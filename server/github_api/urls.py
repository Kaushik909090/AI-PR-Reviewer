from django.urls import path

from .views import (
    repositories,
    pull_requests,
    pull_request_files,
)


urlpatterns = [

    path(
        "repositories/",
        repositories,
        name="repositories",
    ),

    path(
        "repositories/<str:owner>/<str:repo_name>/pull-requests/",
        pull_requests,
        name="pull_requests",
    ),

    path(
        "repositories/<str:owner>/<str:repo_name>/pull-requests/<int:pr_number>/files/",
        pull_request_files,
        name="pull_request_files",
    ),

]