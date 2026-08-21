from datetime import datetime, timezone

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from database.mongodb import db

from github_api.github_service import (
    get_user_repositories,
    get_pull_requests,
    get_pull_request,
    get_pull_request_files,
    post_pull_request_comment,
)

from .ai_service import review_code


# ============================================================
# GET USER REPOSITORIES
# ============================================================

@require_GET
def repositories(request):
    """
    Return repositories accessible to the authenticated
    GitHub user.
    """

    github_id = request.session.get("github_id")

    if not github_id:
        return JsonResponse(
            {
                "error": "User is not authenticated."
            },
            status=401,
        )

    try:
        repos = get_user_repositories(
            github_id
        )

        return JsonResponse(
            {
                "success": True,
                "repositories": repos,
            }
        )

    except Exception as e:
        print(
            "ERROR FETCHING REPOSITORIES:",
            str(e),
        )

        return JsonResponse(
            {
                "error": "Failed to fetch repositories.",
                "details": str(e),
            },
            status=500,
        )


# ============================================================
# GET PULL REQUESTS
# ============================================================

@require_GET
def pull_requests(request):
    """
    Return pull requests for the selected
    GitHub repository.
    """

    github_id = request.session.get(
        "github_id"
    )

    if not github_id:
        return JsonResponse(
            {
                "error": "User is not authenticated."
            },
            status=401,
        )

    owner = request.GET.get(
        "owner"
    )

    repo_name = request.GET.get(
        "repo"
    )

    if not owner or not repo_name:
        return JsonResponse(
            {
                "error": (
                    "owner and repo "
                    "parameters are required."
                )
            },
            status=400,
        )

    try:
        prs = get_pull_requests(
            github_id,
            owner,
            repo_name,
        )

        return JsonResponse(
            {
                "success": True,
                "pull_requests": prs,
            }
        )

    except Exception as e:
        print(
            "ERROR FETCHING PULL REQUESTS:",
            str(e),
        )

        return JsonResponse(
            {
                "error": (
                    "Failed to fetch "
                    "pull requests."
                ),
                "details": str(e),
            },
            status=500,
        )


# ============================================================
# GET PULL REQUEST FILES
# ============================================================

@require_GET
def pull_request_files(request, owner=None, repo_name=None, pr_number=None):
    """
    Return the files changed in a GitHub Pull Request.

    Supports the URL style:
        repositories/<owner>/<repo_name>/pull-requests/<pr_number>/files/
    """

    github_id = request.session.get("github_id")

    if not github_id:
        return JsonResponse(
            {
                "error": "User is not authenticated."
            },
            status=401,
        )

    # Values may come from URL path parameters or query parameters.
    owner = owner or request.GET.get("owner")
    repo_name = repo_name or request.GET.get("repo")
    pr_number = pr_number or request.GET.get("pr")

    if not owner or not repo_name or not pr_number:
        return JsonResponse(
            {
                "error": (
                    "owner, repo and pr parameters "
                    "are required."
                )
            },
            status=400,
        )

    try:
        pr_number = int(pr_number)
    except (ValueError, TypeError):
        return JsonResponse(
            {
                "error": "PR number must be an integer."
            },
            status=400,
        )

    try:
        files = get_pull_request_files(
            github_id,
            owner,
            repo_name,
            pr_number,
        )

        return JsonResponse(
            {
                "success": True,
                "repository": f"{owner}/{repo_name}",
                "pull_request": pr_number,
                "files": files,
            }
        )

    except Exception as e:
        print(
            "ERROR FETCHING PULL REQUEST FILES:",
            str(e),
        )

        return JsonResponse(
            {
                "error": (
                    "Failed to fetch "
                    "pull request files."
                ),
                "details": str(e),
            },
            status=500,
        )


# ============================================================
# REVIEW PULL REQUEST
# ============================================================

@csrf_exempt
@require_POST
def review_pull_request(request):
    """
    Review a GitHub Pull Request.

    IMPORTANT:

    The review is associated with the PR's HEAD commit SHA.

    Same PR + same SHA
        -> return existing review

    Same PR + new SHA
        -> generate a new AI review
    """

    # ========================================================
    # 1. CHECK AUTHENTICATION
    # ========================================================

    github_id = request.session.get(
        "github_id"
    )

    if not github_id:

        return JsonResponse(
            {
                "error": "User is not authenticated."
            },
            status=401,
        )


    # ========================================================
    # 2. GET REQUEST PARAMETERS
    # ========================================================

    owner = request.GET.get(
        "owner"
    )

    repo_name = request.GET.get(
        "repo"
    )

    pr_number = request.GET.get(
        "pr"
    )


    if (
        not owner
        or not repo_name
        or not pr_number
    ):

        return JsonResponse(
            {
                "error": (
                    "owner, repo and pr "
                    "parameters are required."
                )
            },
            status=400,
        )


    # ========================================================
    # 3. VALIDATE PR NUMBER
    # ========================================================

    try:

        pr_number = int(
            pr_number
        )

    except (ValueError, TypeError):

        return JsonResponse(
            {
                "error": (
                    "PR number must be an integer."
                )
            },
            status=400,
        )


    # ========================================================
    # 4. START REVIEW
    # ========================================================

    print("======================================")
    print("STARTING AI PR REVIEW")

    print(
        "Repository:",
        f"{owner}/{repo_name}"
    )

    print(
        "Pull Request:",
        pr_number
    )

    print(
        "GitHub ID:",
        github_id
    )

    print("======================================")


    # ========================================================
    # 5. GET CURRENT PULL REQUEST
    # ========================================================

    try:

        pull_request = get_pull_request(
            github_id,
            owner,
            repo_name,
            pr_number,
        )

    except Exception as e:

        print(
            "ERROR FETCHING PULL REQUEST:",
            str(e)
        )

        return JsonResponse(
            {
                "error": (
                    "Failed to fetch "
                    "GitHub pull request."
                ),

                "details": str(e),
            },
            status=500,
        )


    # ========================================================
    # 6. GET CURRENT HEAD SHA
    # ========================================================

    current_sha = (
        pull_request
        .get("head", {})
        .get("sha")
    )


    if not current_sha:

        return JsonResponse(
            {
                "error": (
                    "Could not determine "
                    "the current PR commit SHA."
                )
            },
            status=500,
        )


    print(
        "Current HEAD SHA:",
        current_sha
    )


    # ========================================================
    # 7. CHECK MONGODB FOR EXISTING REVIEW
    # ========================================================

    print(
        "Checking MongoDB for existing review..."
    )


    try:

        existing_review = db[
            "reviews"
        ].find_one(
            {
                "github_id": github_id,

                "owner": owner,

                "repo": repo_name,

                "pr_number": pr_number,

                "commit_sha": current_sha,
            }
        )

    except Exception as e:

        print(
            "ERROR CHECKING REVIEW CACHE:",
            str(e)
        )

        return JsonResponse(
            {
                "error": (
                    "Failed to check "
                    "review cache."
                ),

                "details": str(e),
            },
            status=500,
        )


    # ========================================================
    # 8. EXISTING REVIEW FOUND
    # ========================================================

    if existing_review:

        print("======================================")
        print("CACHED REVIEW FOUND")

        print(
            "Repository:",
            f"{owner}/{repo_name}"
        )

        print(
            "Pull Request:",
            pr_number
        )

        print(
            "Commit SHA:",
            current_sha
        )

        print(
            "OpenRouter will NOT be called."
        )

        print("======================================")


        return JsonResponse(
            {
                "success": True,

                "cached": True,

                "repository": (
                    f"{owner}/{repo_name}"
                ),

                "pull_request": pr_number,

                "commit_sha": current_sha,

                "files_reviewed": (
                    existing_review.get(
                        "files_reviewed",
                        0,
                    )
                ),

                "review": (
                    existing_review.get(
                        "review"
                    )
                ),
            }
        )


    # ========================================================
    # 9. NO EXISTING REVIEW
    # ========================================================

    print("======================================")
    print("NO CACHED REVIEW FOUND")

    print(
        "New review required."
    )

    print(
        "Commit SHA:",
        current_sha
    )

    print("======================================")


    # ========================================================
    # 10. GET CHANGED FILES
    # ========================================================

    try:

        files = get_pull_request_files(
            github_id,
            owner,
            repo_name,
            pr_number,
        )

    except Exception as e:

        print(
            "ERROR FETCHING PR FILES:",
            str(e)
        )

        return JsonResponse(
            {
                "error": (
                    "Failed to fetch "
                    "pull request files."
                ),

                "details": str(e),
            },
            status=500,
        )


    # ========================================================
    # 11. CHECK FILES
    # ========================================================

    print(
        "Files received:",
        len(files)
    )


    if not files:

        print(
            "No files available for review."
        )

        return JsonResponse(
            {
                "error": (
                    "This pull request "
                    "contains no files to review."
                )
            },
            status=400,
        )


    # ========================================================
    # 12. PRINT FILE NAMES
    # ========================================================

    for file in files:

        print(
            "Reviewing file:",
            file.get("filename")
        )


    # ========================================================
    # 13. SEND FILES TO OPENROUTER
    # ========================================================

    print(
        "Sending PR changes to OpenRouter..."
    )


    try:

        review = review_code(
            files
        )

    except Exception as e:

        print(
            "OPENROUTER ERROR:",
            str(e)
        )

        return JsonResponse(
            {
                "error": (
                    "AI code review failed."
                ),

                "details": str(e),
            },
            status=500,
        )


    # ========================================================
    # 14. OPENROUTER SUCCESS
    # ========================================================

    print(
        "OpenRouter review completed successfully."
    )


    # ========================================================
    # 15. SAVE REVIEW TO MONGODB
    # ========================================================

    review_document = {

        "github_id":
            github_id,

        "owner":
            owner,

        "repo":
            repo_name,

        "pr_number":
            pr_number,

        "commit_sha":
            current_sha,

        "files_reviewed":
            len(files),

        "review":
            review,

        "created_at":
            datetime.now(
                timezone.utc
            ),
    }


    try:

        db[
            "reviews"
        ].insert_one(
            review_document
        )

        print(
            "Review saved to MongoDB."
        )

    except Exception as e:

        # The AI review itself succeeded.
        # Therefore still return it to frontend.

        print(
            "WARNING: Failed to save review:",
            str(e)
        )


    # ========================================================
    # 16. RETURN NEW REVIEW
    # ========================================================

    print("======================================")
    print("NEW AI REVIEW RETURNED")

    print(
        "Repository:",
        f"{owner}/{repo_name}"
    )

    print(
        "Pull Request:",
        pr_number
    )

    print(
        "Commit SHA:",
        current_sha
    )

    print("======================================")


    return JsonResponse(
        {
            "success": True,

            "cached": False,

            "repository": (
                f"{owner}/{repo_name}"
            ),

            "pull_request": pr_number,

            "commit_sha": current_sha,

            "files_reviewed": len(
                files
            ),

            "review": review,
        }
    )

# ============================================================
# REVIEW HISTORY
# ============================================================

@require_GET
def review_history(request):
    """
    Return all stored AI reviews for the selected Pull Request.

    History is kept per commit SHA, so old reviews remain available
    after a new commit is reviewed.
    """

    github_id = request.session.get("github_id")

    if not github_id:
        return JsonResponse(
            {
                "error": "User is not authenticated."
            },
            status=401,
        )

    owner = request.GET.get("owner")
    repo_name = request.GET.get("repo")
    pr_number = request.GET.get("pr")

    if not owner or not repo_name or not pr_number:
        return JsonResponse(
            {
                "error": (
                    "owner, repo and pr "
                    "parameters are required."
                )
            },
            status=400,
        )

    try:
        pr_number = int(pr_number)
    except (ValueError, TypeError):
        return JsonResponse(
            {
                "error": "PR number must be an integer."
            },
            status=400,
        )

    try:
        cursor = (
            db["reviews"]
            .find(
                {
                    "github_id": github_id,
                    "owner": owner,
                    "repo": repo_name,
                    "pr_number": pr_number,
                }
            )
            .sort(
                "created_at",
                -1,
            )
        )

        reviews = []

        for item in cursor:
            created_at = item.get("created_at")

            reviews.append(
                {
                    "id": str(item.get("_id")),
                    "github_id": item.get("github_id"),
                    "owner": item.get("owner"),
                    "repo": item.get("repo"),
                    "pr_number": item.get("pr_number"),
                    "commit_sha": item.get("commit_sha"),
                    "files_reviewed": item.get(
                        "files_reviewed",
                        0,
                    ),
                    "review": item.get("review") or {},
                    "created_at": (
                        created_at.isoformat()
                        if created_at
                        else None
                    ),
                }
            )

        return JsonResponse(
            {
                "success": True,
                "repository": f"{owner}/{repo_name}",
                "pull_request": pr_number,
                "reviews": reviews,
                "count": len(reviews),
            }
        )

    except Exception as e:
        print(
            "ERROR LOADING REVIEW HISTORY:",
            str(e),
        )

        return JsonResponse(
            {
                "error": "Failed to load review history.",
                "details": str(e),
            },
            status=500,
        )


# ============================================================
# POST AI REVIEW TO GITHUB
# ============================================================

@csrf_exempt
@require_POST
def post_review_to_github(request):
    """Post the cached AI review for the current PR HEAD to GitHub."""
    github_id = request.session.get("github_id")

    if not github_id:
        return JsonResponse(
            {"error": "User is not authenticated."},
            status=401,
        )

    owner = request.GET.get("owner")
    repo_name = request.GET.get("repo")
    pr_number = request.GET.get("pr")

    if not owner or not repo_name or not pr_number:
        return JsonResponse(
            {"error": "owner, repo and pr parameters are required."},
            status=400,
        )

    try:
        pr_number = int(pr_number)
    except (ValueError, TypeError):
        return JsonResponse(
            {"error": "PR number must be an integer."},
            status=400,
        )

    try:
        pull_request = get_pull_request(
            github_id,
            owner,
            repo_name,
            pr_number,
        )

        current_sha = (
            pull_request.get("head", {}).get("sha")
        )

        if not current_sha:
            return JsonResponse(
                {"error": "Could not determine the current PR commit SHA."},
                status=500,
            )

        stored_review = db["reviews"].find_one(
            {
                "github_id": github_id,
                "owner": owner,
                "repo": repo_name,
                "pr_number": pr_number,
                "commit_sha": current_sha,
            }
        )

        if not stored_review:
            return JsonResponse(
                {
                    "error": (
                        "No cached AI review exists for the current "
                        "commit. Review the PR first."
                    )
                },
                status=404,
            )

        review = stored_review.get("review") or {}

        risk = str(
            review.get("risk_level", "LOW")
        ).upper()

        issues = review.get("issues") or []

        risk_emoji = {
            "CRITICAL": "🔴",
            "HIGH": "🟠",
            "MEDIUM": "🟡",
            "LOW": "🟢",
        }.get(risk, "⚪")

        lines = [
            "## 🤖 AI PR Review",
            "",
            f"**Risk:** {risk_emoji} **{risk}**",
            f"**Commit:** `{current_sha[:12]}`",
            f"**Issues found:** {len(issues)}",
            "",
            "### Overall Assessment",
            "",
            str(
                review.get(
                    "overall_assessment",
                    "No overall assessment was provided.",
                )
            ),
        ]

        if issues:
            lines.extend(["", "### Issues", ""])

            for index, issue in enumerate(issues, 1):
                severity = str(
                    issue.get("severity", "INFO")
                ).upper()

                filename = issue.get(
                    "file",
                    issue.get("filename", "unknown"),
                )

                line = issue.get("line")
                location = (
                    f"{filename}:{line}"
                    if line
                    else str(filename)
                )

                lines.extend(
                    [
                        f"**{index}. {severity} — `{location}`**",
                        "",
                        f"**Problem:** {issue.get('problem', 'Issue detected')}",
                    ]
                )

                explanation = issue.get("explanation")
                if explanation:
                    lines.extend(
                        ["", f"**Explanation:** {explanation}"]
                    )

                suggested_fix = issue.get("suggested_fix")
                if suggested_fix:
                    lines.extend(
                        ["", f"**Suggested Fix:** {suggested_fix}"]
                    )

                lines.append("")

        positive_points = review.get(
            "what_was_done_well"
        ) or []

        if positive_points:
            lines.extend(
                ["### What Was Done Well", ""]
            )
            lines.extend(
                [f"- {point}" for point in positive_points]
            )
            lines.append("")

        recommendations = review.get(
            "main_recommendations"
        ) or []

        if recommendations:
            lines.extend(
                ["### Main Recommendations", ""]
            )
            lines.extend(
                [f"- {item}" for item in recommendations]
            )
            lines.append("")

        lines.extend(
            [
                "---",
                "",
                "Generated by **AI PR Reviewer**.",
            ]
        )

        result = post_pull_request_comment(
            github_id,
            owner,
            repo_name,
            pr_number,
            "\n".join(lines),
        )

        db["review_github_comments"].insert_one(
            {
                "github_id": github_id,
                "owner": owner,
                "repo": repo_name,
                "pr_number": pr_number,
                "commit_sha": current_sha,
                "comment_id": result.get("id"),
                "comment_url": result.get("url"),
                "created_at": datetime.now(timezone.utc),
            }
        )

        return JsonResponse(
            {
                "success": True,
                "commit_sha": current_sha,
                "comment_id": result.get("id"),
                "comment_url": result.get("url"),
            }
        )

    except Exception as e:
        print(
            "ERROR POSTING AI REVIEW TO GITHUB:",
            str(e),
        )

        return JsonResponse(
            {
                "error": "Failed to post AI review to GitHub.",
                "details": str(e),
            },
            status=500,
        )