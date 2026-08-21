import requests

from cryptography.fernet import Fernet
from django.conf import settings

from database.mongodb import db


# ============================================================
# GET GITHUB ACCESS TOKEN
# ============================================================

def get_github_token(github_id):
    """
    Find the authenticated GitHub user in MongoDB
    and decrypt their GitHub access token.
    """

    user = db["users"].find_one(
        {
            "github_id": github_id
        }
    )

    if not user:
        raise ValueError(
            "GitHub user not found in MongoDB."
        )

    encrypted_token = user.get(
        "encrypted_access_token"
    )

    if not encrypted_token:
        raise ValueError(
            "Encrypted GitHub access token not found."
        )

    encryption_key = (
        settings.GITHUB_TOKEN_ENCRYPTION_KEY
    )

    if not encryption_key:
        raise ValueError(
            "GITHUB_TOKEN_ENCRYPTION_KEY is not configured."
        )

    try:
        cipher = Fernet(
            encryption_key.encode()
        )

        access_token = cipher.decrypt(
            encrypted_token.encode()
        ).decode()

    except Exception as e:
        raise ValueError(
            "Could not decrypt GitHub access token."
        ) from e

    return access_token


# ============================================================
# GITHUB API HEADERS
# ============================================================

def get_github_headers(access_token):
    """
    Create common headers for GitHub API requests.
    """

    return {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


# ============================================================
# GET USER REPOSITORIES
# ============================================================

def get_user_repositories(github_id):
    """
    Fetch repositories accessible to the authenticated
    GitHub user.
    """

    print("======================================")
    print("GETTING GITHUB REPOSITORIES")
    print("GitHub ID:", github_id)

    # --------------------------------------------------------
    # 1. Get GitHub token
    # --------------------------------------------------------

    access_token = get_github_token(
        github_id
    )

    print(
        "GitHub token decrypted successfully"
    )

    # --------------------------------------------------------
    # 2. Create headers
    # --------------------------------------------------------

    headers = get_github_headers(
        access_token
    )

    # ========================================================
    # 3. CHECK AUTHENTICATED GITHUB ACCOUNT
    # ========================================================

    user_response = requests.get(
        "https://api.github.com/user",
        headers=headers,
        timeout=15,
    )

    print(
        "GitHub /user status:",
        user_response.status_code
    )

    if user_response.status_code != 200:
        raise ValueError(
            f"GitHub user API error: "
            f"{user_response.status_code} "
            f"{user_response.text}"
        )

    github_account = user_response.json()

    print(
        "GitHub authenticated account:",
        github_account.get("login")
    )

    print(
        "GitHub account ID:",
        github_account.get("id")
    )

    print(
        "Public repositories:",
        github_account.get("public_repos")
    )

    print(
        "Private repositories:",
        github_account.get("total_private_repos")
    )

    print(
        "Granted OAuth scopes:",
        user_response.headers.get(
            "X-OAuth-Scopes"
        )
    )

    # ========================================================
    # 4. GET REPOSITORIES
    # ========================================================

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

        print(
            "GitHub /user/repos status:",
            response.status_code
        )

        if response.status_code != 200:
            raise ValueError(
                f"GitHub repository API error: "
                f"{response.status_code} "
                f"{response.text}"
            )

        data = response.json()

        if not data:
            break

        repositories.extend(data)

        if len(data) < 100:
            break

        page += 1

    print(
        "Repositories returned:",
        len(repositories)
    )

    for repo in repositories:

        print(
            "Repository:",
            repo.get("full_name")
        )

    print(
        "======================================"
    )

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
    """

    print("======================================")
    print("GETTING GITHUB PULL REQUESTS")

    print(
        "GitHub ID:",
        github_id
    )

    print(
        "Repository:",
        f"{owner}/{repo_name}"
    )

    # --------------------------------------------------------
    # 1. Get GitHub token
    # --------------------------------------------------------

    access_token = get_github_token(
        github_id
    )

    print(
        "GitHub token decrypted successfully"
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
        f"https://api.github.com/repos/"
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

    print(
        "GitHub /pulls status:",
        response.status_code
    )

    # --------------------------------------------------------
    # 5. Handle API errors
    # --------------------------------------------------------

    if response.status_code != 200:
        raise ValueError(
            f"GitHub pull request API error: "
            f"{response.status_code} "
            f"{response.text}"
        )

    # --------------------------------------------------------
    # 6. Parse pull requests
    # --------------------------------------------------------

    pull_requests = response.json()

    print(
        "Pull requests returned:",
        len(pull_requests)
    )

    # --------------------------------------------------------
    # 7. Print PR information
    # --------------------------------------------------------

    for pr in pull_requests:

        print(
            "PR:",
            f"#{pr.get('number')}",
            "-",
            pr.get("title")
        )

        print(
            "State:",
            pr.get("state")
        )

        print(
            "Author:",
            pr.get(
                "user",
                {}
            ).get("login")
        )

        print(
            "Head branch:",
            pr.get(
                "head",
                {}
            ).get("ref")
        )

        print(
            "Base branch:",
            pr.get(
                "base",
                {}
            ).get("ref")
        )

    print(
        "======================================"
    )

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

    This is used by the AI reviewer to obtain the current
    HEAD commit SHA before checking the MongoDB review cache.
    """
    print("======================================")
    print("GETTING SINGLE PULL REQUEST")

    print(
        "GitHub ID:",
        github_id,
    )

    print(
        "Repository:",
        f"{owner}/{repo_name}",
    )

    print(
        "PR number:",
        pr_number,
    )

    access_token = get_github_token(
        github_id
    )

    print(
        "GitHub token decrypted successfully"
    )

    headers = get_github_headers(
        access_token
    )

    url = (
        f"https://api.github.com/repos/"
        f"{owner}/{repo_name}/pulls/"
        f"{pr_number}"
    )

    response = requests.get(
        url,
        headers=headers,
        timeout=15,
    )

    print(
        "GitHub single PR status:",
        response.status_code,
    )

    if response.status_code != 200:
        raise ValueError(
            f"GitHub single PR API error: "
            f"{response.status_code} "
            f"{response.text}"
        )

    pull_request = response.json()

    print(
        "PR:",
        f"#{pull_request.get('number')}",
    )

    print(
        "Title:",
        pull_request.get("title"),
    )

    print(
        "Head branch:",
        pull_request.get(
            "head",
            {},
        ).get("ref"),
    )

    print(
        "HEAD SHA:",
        pull_request.get(
            "head",
            {},
        ).get("sha"),
    )

    print(
        "Base branch:",
        pull_request.get(
            "base",
            {},
        ).get("ref"),
    )

    print(
        "======================================"
    )

    return pull_request


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

    The important field for our AI reviewer is `patch`.
    It contains the actual code changes.
    """

    print("======================================")
    print("GETTING PULL REQUEST FILES")

    print(
        "GitHub ID:",
        github_id
    )

    print(
        "Repository:",
        f"{owner}/{repo_name}"
    )

    print(
        "PR number:",
        pr_number
    )

    # --------------------------------------------------------
    # 1. Get GitHub token
    # --------------------------------------------------------

    access_token = get_github_token(
        github_id
    )

    print(
        "GitHub token decrypted successfully"
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
        f"https://api.github.com/repos/"
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

    print(
        "GitHub /pulls/files status:",
        response.status_code
    )

    # --------------------------------------------------------
    # 5. Handle API errors
    # --------------------------------------------------------

    if response.status_code != 200:

        raise ValueError(
            f"GitHub PR files API error: "
            f"{response.status_code} "
            f"{response.text}"
        )

    # --------------------------------------------------------
    # 6. Parse files
    # --------------------------------------------------------

    files = response.json()

    print(
        "Files changed:",
        len(files)
    )

    # --------------------------------------------------------
    # 7. Print file information
    # --------------------------------------------------------

    for file in files:

        print(
            "File:",
            file.get("filename")
        )

        print(
            "Status:",
            file.get("status")
        )

        print(
            "Additions:",
            file.get("additions")
        )

        print(
            "Deletions:",
            file.get("deletions")
        )

        print(
            "Changes:",
            file.get("changes")
        )

    print(
        "======================================"
    )

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
    if not body or not str(body).strip():
        raise ValueError(
            "Comment body cannot be empty."
        )

    access_token = get_github_token(
        github_id
    )

    headers = get_github_headers(
        access_token
    )

    url = (
        f"https://api.github.com/repos/"
        f"{owner}/{repo_name}/issues/"
        f"{pr_number}/comments"
    )

    response = requests.post(
        url,
        headers=headers,
        json={
            "body": str(body),
        },
        timeout=20,
    )

    print(
        "GitHub PR comment status:",
        response.status_code,
    )

    if response.status_code != 201:
        raise ValueError(
            f"GitHub PR comment API error: "
            f"{response.status_code} "
            f"{response.text}"
        )

    comment = response.json()

    return {
        "id": comment.get("id"),
        "url": comment.get("html_url"),
        "created_at": comment.get("created_at"),
    }