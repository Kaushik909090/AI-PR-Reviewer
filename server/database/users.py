from datetime import datetime, timezone

from cryptography.fernet import Fernet
from django.conf import settings

from .mongodb import db


users_collection = db["users"]


def encrypt_token(access_token):
    """
    Encrypt the GitHub access token before
    storing it in MongoDB.
    """

    key = settings.GITHUB_TOKEN_ENCRYPTION_KEY.encode()

    cipher = Fernet(key)

    encrypted_token = cipher.encrypt(
        access_token.encode()
    )

    return encrypted_token.decode()


def create_or_update_user(github_user, access_token):
    """
    Create a new GitHub user or update an
    existing user.
    """

    encrypted_token = encrypt_token(access_token)

    now = datetime.now(timezone.utc)

    user_data = {
        "github_id": github_user["id"],
        "username": github_user.get("login"),
        "name": github_user.get("name"),
        "avatar_url": github_user.get("avatar_url"),
        "encrypted_access_token": encrypted_token,
        "updated_at": now,
    }

    users_collection.update_one(
        {
            "github_id": github_user["id"]
        },
        {
            "$set": user_data,
            "$setOnInsert": {
                "created_at": now
            }
        },
        upsert=True,
    )

    return user_data