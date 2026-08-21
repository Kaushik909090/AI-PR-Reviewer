from django.http import JsonResponse

from .github_service import (
    GitHubAPIError,
    get_user_repositories,
    get_pull_requests,
    get_pull_request_files,
)


# ============================================================
# GET USER REPOSITORIES
# ============================================================

def repositories(request):
    """
    Return repositories for the authenticated GitHub user.
    """

    github_id = request.session.get(
        "github_id"
    )


    if not github_id:

        return JsonResponse(
            {
                "error":
                    "User is not authenticated."
            },
            status=401,
        )


    try:

        github_repositories = (
            get_user_repositories(
                github_id
            )
        )


    except GitHubAPIError as e:

        return JsonResponse(
            {
                "error":
                    str(e)
            },
            status=e.status_code or 500,
        )


    except Exception:

        return JsonResponse(
            {
                "error":
                    "Failed to fetch GitHub repositories."
            },
            status=500,
        )


    repositories_data = []


    for repo in github_repositories:

        repositories_data.append(

            {
                "id":
                    repo.get("id"),

                "name":
                    repo.get("name"),

                "full_name":
                    repo.get("full_name"),

                "description":
                    repo.get("description"),

                "private":
                    repo.get("private"),

                "html_url":
                    repo.get("html_url"),

                "default_branch":
                    repo.get("default_branch"),

                "language":
                    repo.get("language"),

                "updated_at":
                    repo.get("updated_at"),

                "owner": {

                    "login":
                        repo.get(
                            "owner",
                            {}
                        ).get(
                            "login"
                        ),
                },
            }
        )


    return JsonResponse(
        {
            "repositories":
                repositories_data,

            "count":
                len(repositories_data),
        }
    )


# ============================================================
# GET PULL REQUESTS
# ============================================================

def pull_requests(
    request,
    owner,
    repo_name,
):
    """
    Return open pull requests for a GitHub repository.
    """

    github_id = request.session.get(
        "github_id"
    )


    if not github_id:

        return JsonResponse(
            {
                "error":
                    "User is not authenticated."
            },
            status=401,
        )


    try:

        github_pull_requests = (
            get_pull_requests(
                github_id,
                owner,
                repo_name,
            )
        )


    except GitHubAPIError as e:

        return JsonResponse(
            {
                "error":
                    str(e)
            },
            status=e.status_code or 500,
        )


    except Exception:

        return JsonResponse(
            {
                "error":
                    "Failed to fetch GitHub pull requests."
            },
            status=500,
        )


    pull_requests_data = []


    for pr in github_pull_requests:

        pull_requests_data.append(

            {
                "id":
                    pr.get("id"),

                "number":
                    pr.get("number"),

                "title":
                    pr.get("title"),

                "body":
                    pr.get("body"),

                "state":
                    pr.get("state"),

                "html_url":
                    pr.get("html_url"),

                "created_at":
                    pr.get("created_at"),

                "updated_at":
                    pr.get("updated_at"),

                "user": {

                    "login":
                        pr.get(
                            "user",
                            {}
                        ).get(
                            "login"
                        ),

                    "avatar_url":
                        pr.get(
                            "user",
                            {}
                        ).get(
                            "avatar_url"
                        ),
                },

                "head": {

                    "ref":
                        pr.get(
                            "head",
                            {}
                        ).get(
                            "ref"
                        ),

                    "sha":
                        pr.get(
                            "head",
                            {}
                        ).get(
                            "sha"
                        ),
                },

                "base": {

                    "ref":
                        pr.get(
                            "base",
                            {}
                        ).get(
                            "ref"
                        ),
                },
            }
        )


    return JsonResponse(
        {
            "pull_requests":
                pull_requests_data,

            "count":
                len(pull_requests_data),
        }
    )


# ============================================================
# GET PULL REQUEST FILES
# ============================================================

def pull_request_files(
    request,
    owner,
    repo_name,
    pr_number,
):
    """
    Return files changed in a GitHub Pull Request.

    The `patch` field contains the actual code changes
    that we later send to the AI reviewer.
    """

    # --------------------------------------------------------
    # 1. Check authentication
    # --------------------------------------------------------

    github_id = request.session.get(
        "github_id"
    )


    if not github_id:

        return JsonResponse(
            {
                "error":
                    "User is not authenticated."
            },
            status=401,
        )


    # --------------------------------------------------------
    # 2. Fetch PR files from GitHub
    # --------------------------------------------------------

    try:

        github_files = (
            get_pull_request_files(
                github_id,
                owner,
                repo_name,
                pr_number,
            )
        )


    except GitHubAPIError as e:

        return JsonResponse(
            {
                "error":
                    str(e)
            },
            status=e.status_code or 500,
        )


    except Exception:

        return JsonResponse(
            {
                "error":
                    "Failed to fetch pull request files."
            },
            status=500,
        )


    # --------------------------------------------------------
    # 3. Prepare file data for frontend
    # --------------------------------------------------------

    files_data = []


    for file in github_files:

        files_data.append(

            {
                "filename":
                    file.get("filename"),

                "status":
                    file.get("status"),

                "additions":
                    file.get("additions"),

                "deletions":
                    file.get("deletions"),

                "changes":
                    file.get("changes"),

                "patch":
                    file.get("patch"),

                "blob_url":
                    file.get("blob_url"),

                "raw_url":
                    file.get("raw_url"),
            }
        )


    # --------------------------------------------------------
    # 4. Return response
    # --------------------------------------------------------

    return JsonResponse(
        {
            "files":
                files_data,

            "count":
                len(files_data),
        }
    )