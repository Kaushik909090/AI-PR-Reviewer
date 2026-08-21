import requests

from cryptography.fernet import Fernet
from django.conf import settings

from database.mongodb import db


# ============================================================
# CUSTOM GITHUB API ERROR
# ============================================================

class GitHubAPIError(Exception):
    """
    Safe exception for GitHub API failures.

    The exception intentionally does not contain
    GitHub's raw response body because that information
    should not be exposed to the frontend.
    """

    def __init__(
        self,
        message,
        status_code=None,
    ):

        super().__init__(message)

        self.status_code = status_code


# ============================================================
# GET GITHUB ACCESS TOKEN
# ============================================================

def get_github_token(github_id):
    """
    Find the authenticated GitHub user in MongoDB
    and decrypt their GitHub access token.

    The decrypted token exists only on the backend.
    """

    # --------------------------------------------------------
    # 1. Find user
    # --------------------------------------------------------

    if not github_id:

        raise GitHubAPIError(
            "GitHub authentication information is missing.",
            401,
        )


    user = db["users"].find_one(
        {
            "github_id": github_id
        }
    )


    if not user:

        raise GitHubAPIError(
            "GitHub user not found.",
            401,
        )


    # --------------------------------------------------------
    # 2. Get encrypted token
    # --------------------------------------------------------

    encrypted_token = user.get(
        "encrypted_access_token"
    )


    if not encrypted_token:

        raise GitHubAPIError(
            "GitHub access token is not available.",
            401,
        )


    # --------------------------------------------------------
    # 3. Get encryption key
    # --------------------------------------------------------

    encryption_key = (
        settings.GITHUB_TOKEN_ENCRYPTION_KEY
    )


    if not encryption_key:

        raise GitHubAPIError(
            "GitHub token encryption is not configured.",
            500,
        )


    # --------------------------------------------------------
    # 4. Decrypt token
    # --------------------------------------------------------

    try:

        cipher = Fernet(
            encryption_key.encode()
        )

        access_token = cipher.decrypt(
            encrypted_token.encode()
        ).decode()

    except Exception as e:

        # Never expose the original exception.
        raise GitHubAPIError(
            "Could not decrypt GitHub access token.",
            500,
        ) from e


    if not access_token:

        raise GitHubAPIError(
            "GitHub access token is empty.",
            401,
        )


    return access_token


# ============================================================
# GITHUB API HEADERS
# ============================================================

def get_github_headers(access_token):
    """
    Create common headers for GitHub API requests.

    The access token is used only server-side.
    """

    if not access_token:

        raise GitHubAPIError(
            "GitHub access token is missing.",
            401,
        )


    return {

        "Authorization":
            f"Bearer {access_token}",

        "Accept":
            "application/vnd.github+json",

        "X-GitHub-Api-Version":
            "2022-11-28",
    }


# ============================================================
# HANDLE GITHUB RESPONSE ERROR
# ============================================================

def handle_github_error(
    response,
    resource_name="GitHub resource",
):
    """
    Convert GitHub API errors into safe application errors.

    The raw GitHub response body is deliberately not included.
    """

    status_code = response.status_code


    if status_code == 401:

        raise GitHubAPIError(
            "GitHub authentication has expired or is invalid.",
            401,
        )


    if status_code == 403:

        raise GitHubAPIError(
            "GitHub access was denied.",
            403,
        )


    if status_code == 404:

        raise GitHubAPIError(
            f"{resource_name} was not found or is not accessible.",
            404,
        )


    if status_code == 422:

        raise GitHubAPIError(
            f"Invalid GitHub request for {resource_name}.",
            422,
        )


    if status_code == 429:

        raise GitHubAPIError(
            "GitHub API rate limit exceeded.",
            429,
        )


    if 500 <= status_code <= 599:

        raise GitHubAPIError(
            "GitHub is temporarily unavailable.",
            502,
        )


    raise GitHubAPIError(
        f"GitHub request for {resource_name} failed.",
        status_code,
    )


# ============================================================
# GET USER REPOSITORIES
# ============================================================

def get_user_repositories(github_id):
    """
    Fetch repositories accessible to the authenticated
    GitHub user.
    """

    # --------------------------------------------------------
    # 1. Get GitHub token
    # --------------------------------------------------------

    access_token = get_github_token(
        github_id
    )


    # --------------------------------------------------------
    # 2. Create headers
    # --------------------------------------------------------

    headers = get_github_headers(
        access_token
    )


    # --------------------------------------------------------
    # 3. Get repositories
    # --------------------------------------------------------

    repositories = []

    page = 1


    while True:

        response = requests.get(

            "https://api.github.com/user/repos",

            headers=headers,

            params={
                "visibility": "all",

                "affiliation": (
                    "owner,collaborator,"
                    "organization_member"
                ),

                "sort": "updated",

                "per_page": 100,

                "page": page,
            },

            timeout=15,
        )


        if response.status_code != 200:

            handle_github_error(
                response,
                "repository list",
            )


        data = response.json()


        if not data:

            break


        repositories.extend(
            data
        )


        if len(data) < 100:

            break


        page += 1


    return repositories


# ============================================================
# GET PULL REQUESTS
# ============================================================

def get_pull_requests(
    github_id,
    owner,
    repo_name,
):
    """
    Fetch open pull requests for a GitHub repository.

    The request is made using the authenticated user's
    GitHub token, so GitHub enforces repository access.
    """

    # --------------------------------------------------------
    # Validate parameters
    # --------------------------------------------------------

    if not owner or not repo_name:

        raise GitHubAPIError(
            "Repository information is required.",
            400,
        )


    # --------------------------------------------------------
    # 1. Get GitHub token
    # --------------------------------------------------------

    access_token = get_github_token(
        github_id
    )


    # --------------------------------------------------------
    # 2. GitHub API headers
    # --------------------------------------------------------

    headers = get_github_headers(
        access_token
    )


    # --------------------------------------------------------
    # 3. GitHub Pull Request URL
    # --------------------------------------------------------

    url = (
        "https://api.github.com/repos/"
        f"{owner}/{repo_name}/pulls"
    )


    # --------------------------------------------------------
    # 4. Request open pull requests
    # --------------------------------------------------------

    response = requests.get(

        url,

        headers=headers,

        params={
            "state": "open",
            "sort": "updated",
            "direction": "desc",
            "per_page": 100,
            "page": 1,
        },

        timeout=15,
    )


    # --------------------------------------------------------
    # 5. Handle errors
    # --------------------------------------------------------

    if response.status_code != 200:

        handle_github_error(
            response,
            "pull request list",
        )


    # --------------------------------------------------------
    # 6. Parse response
    # --------------------------------------------------------

    pull_requests = response.json()


    return pull_requests


# ============================================================
# GET SINGLE PULL REQUEST
# ============================================================

def get_pull_request(
    github_id,
    owner,
    repo_name,
    pr_number,
):
    """
    Fetch one GitHub Pull Request.

    Used by the AI reviewer to obtain the current
    HEAD commit SHA before checking the review cache.
    """

    # --------------------------------------------------------
    # Validate parameters
    # --------------------------------------------------------

    if not owner or not repo_name:

        raise GitHubAPIError(
            "Repository information is required.",
            400,
        )


    if not pr_number:

        raise GitHubAPIError(
            "Pull Request number is required.",
            400,
        )


    # --------------------------------------------------------
    # Get token
    # --------------------------------------------------------

    access_token = get_github_token(
        github_id
    )


    # --------------------------------------------------------
    # Headers
    # --------------------------------------------------------

    headers = get_github_headers(
        access_token
    )


    # --------------------------------------------------------
    # URL
    # --------------------------------------------------------

    url = (
        "https://api.github.com/repos/"
        f"{owner}/{repo_name}/pulls/"
        f"{pr_number}"
    )


    # --------------------------------------------------------
    # Request
    # --------------------------------------------------------

    response = requests.get(

        url,

        headers=headers,

        timeout=15,
    )


    # --------------------------------------------------------
    # Handle errors
    # --------------------------------------------------------

    if response.status_code != 200:

        handle_github_error(
            response,
            "pull request",
        )


    # --------------------------------------------------------
    # Return PR
    # --------------------------------------------------------

    return response.json()


# ============================================================
# GET PULL REQUEST FILES
# ============================================================

def get_pull_request_files(
    github_id,
    owner,
    repo_name,
    pr_number,
):
    """
    Fetch files changed in a GitHub Pull Request.

    The `patch` field contains the actual code changes
    used by the AI reviewer.
    """

    # --------------------------------------------------------
    # Validate parameters
    # --------------------------------------------------------

    if not owner or not repo_name:

        raise GitHubAPIError(
            "Repository information is required.",
            400,
        )


    if not pr_number:

        raise GitHubAPIError(
            "Pull Request number is required.",
            400,
        )


    # --------------------------------------------------------
    # 1. Get GitHub token
    # --------------------------------------------------------

    access_token = get_github_token(
        github_id
    )


    # --------------------------------------------------------
    # 2. GitHub API headers
    # --------------------------------------------------------

    headers = get_github_headers(
        access_token
    )


    # --------------------------------------------------------
    # 3. GitHub PR files URL
    # --------------------------------------------------------

    url = (
        "https://api.github.com/repos/"
        f"{owner}/{repo_name}/pulls/"
        f"{pr_number}/files"
    )


    # --------------------------------------------------------
    # 4. Fetch changed files
    # --------------------------------------------------------

    response = requests.get(

        url,

        headers=headers,

        params={
            "per_page": 100,
            "page": 1,
        },

        timeout=15,
    )


    # --------------------------------------------------------
    # 5. Handle errors
    # --------------------------------------------------------

    if response.status_code != 200:

        handle_github_error(
            response,
            "pull request files",
        )


    # --------------------------------------------------------
    # 6. Parse files
    # --------------------------------------------------------

    files = response.json()


    return files


# ============================================================
# POST PULL REQUEST COMMENT
# ============================================================

def post_pull_request_comment(
    github_id,
    owner,
    repo_name,
    pr_number,
    body,
):
    """
    Post a normal conversation comment on a GitHub Pull Request.

    The OAuth token is retrieved and decrypted on the backend.
    It is never sent to the React frontend.
    """

    # --------------------------------------------------------
    # Validate comment
    # --------------------------------------------------------

    if not body or not str(body).strip():

        raise GitHubAPIError(
            "Comment body cannot be empty.",
            400,
        )


    if not owner or not repo_name:

        raise GitHubAPIError(
            "Repository information is required.",
            400,
        )


    if not pr_number:

        raise GitHubAPIError(
            "Pull Request number is required.",
            400,
        )


    # --------------------------------------------------------
    # Get GitHub token
    # --------------------------------------------------------

    access_token = get_github_token(
        github_id
    )


    # --------------------------------------------------------
    # Headers
    # --------------------------------------------------------

    headers = get_github_headers(
        access_token
    )


    # --------------------------------------------------------
    # GitHub comment URL
    # --------------------------------------------------------

    url = (
        "https://api.github.com/repos/"
        f"{owner}/{repo_name}/issues/"
        f"{pr_number}/comments"
    )


    # --------------------------------------------------------
    # Post comment
    # --------------------------------------------------------

    response = requests.post(

        url,

        headers=headers,

        json={
            "body": str(body),
        },

        timeout=20,
    )


    # --------------------------------------------------------
    # Handle errors
    # --------------------------------------------------------

    if response.status_code != 201:

        handle_github_error(
            response,
            "pull request comment",
        )


    # --------------------------------------------------------
    # Return safe response
    # --------------------------------------------------------

    comment = response.json()


    return {

        "id":
            comment.get("id"),

        "url":
            comment.get("html_url"),

        "created_at":
            comment.get("created_at"),
    }