from typing import Any

from fastapi import Request
from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.collection import Collection
from src.core.config import settings


def connect_to_mongodb() -> tuple[
    MongoClient[dict[str, Any]],
    Collection[dict[str, Any]],
    Collection[dict[str, Any]],
]:
    client: MongoClient[dict[str, Any]] = MongoClient(
        settings.MONGODB_URI,
        serverSelectionTimeoutMS=settings.MONGODB_TIMEOUT_MS,
        connectTimeoutMS=settings.MONGODB_TIMEOUT_MS,
        tz_aware=True,
    )
    initialized = False
    try:
        client.admin.command("ping")
        users = client[settings.MONGODB_DATABASE]["users"]
        users.create_index("email", unique=True)
        codes = client[settings.MONGODB_DATABASE]["codes"]
        codes.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
        initialized = True
        return client, users, codes
    finally:
        if not initialized:
            client.close()


def close_mongodb(client: MongoClient[dict[str, Any]]) -> None:
    client.close()


def get_users_collection(request: Request) -> Collection[dict[str, Any]]:
    return request.app.state.users_collection


def get_codes_collection(request: Request) -> Collection[dict[str, Any]]:
    return request.app.state.codes_collection
