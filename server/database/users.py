from datetime import datetime, timezone

from cryptography.fernet import Fernet
from django.conf import settings

from .mongodb import db


users_collection = db["users"]


# ============================================================
# ENCRYPT GITHUB TOKEN
# ============================================================

def encrypt_token(access_token):
    """
    Encrypt the GitHub access token before
    storing it in MongoDB.
    """

    if not access_token:
        raise ValueError(
            "GitHub access token cannot be empty."
        )

    key = settings.GITHUB_TOKEN_ENCRYPTION_KEY.encode()

    cipher = Fernet(key)

    encrypted_token = cipher.encrypt(
        access_token.encode()
    )

    return encrypted_token.decode()


# ============================================================
# CREATE / UPDATE USER
# ============================================================

def create_or_update_user(
    github_user,
    access_token,
):
    """
    Create a new GitHub user or update an
    existing user.

    The GitHub access token is encrypted
    before being stored in MongoDB.
    """

    # --------------------------------------------------------
    # Validate GitHub user
    # --------------------------------------------------------

    if not github_user:
        raise ValueError(
            "GitHub user information is required."
        )

    github_id = github_user.get("id")

    if not github_id:
        raise ValueError(
            "GitHub user ID is required."
        )


    # --------------------------------------------------------
    # Encrypt token
    # --------------------------------------------------------

    encrypted_token = encrypt_token(
        access_token
    )


    # --------------------------------------------------------
    # Timestamp
    # --------------------------------------------------------

    now = datetime.now(
        timezone.utc
    )


    # --------------------------------------------------------
    # User data
    # --------------------------------------------------------

    user_data = {

        "github_id":
            github_id,

        "username":
            github_user.get("login"),

        "name":
            github_user.get("name"),

        "avatar_url":
            github_user.get("avatar_url"),

        "encrypted_access_token":
            encrypted_token,

        "updated_at":
            now,
    }


    # --------------------------------------------------------
    # Create / update MongoDB document
    # --------------------------------------------------------

    users_collection.update_one(

        {
            "github_id":
                github_id
        },

        {
            "$set":
                user_data,

            "$setOnInsert":
                {
                    "created_at":
                        now
                },
        },

        upsert=True,
    )


    # --------------------------------------------------------
    # IMPORTANT:
    # Do not return the encrypted token.
    #
    # Return only safe user information.
    # --------------------------------------------------------

    return {

        "github_id":
            github_id,

        "username":
            github_user.get("login"),

        "name":
            github_user.get("name"),

        "avatar_url":
            github_user.get("avatar_url"),

    }