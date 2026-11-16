from typing import Any

from fastapi import Request
from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError
from src.core.config import settings

MongoCollection = Collection[dict[str, Any]]
MongoConnection = tuple[
    MongoClient[dict[str, Any]],
    MongoCollection,
    MongoCollection,
]


def connect_to_mongodb() -> MongoConnection:
    client: MongoClient[dict[str, Any]] = MongoClient(
        settings.MONGODB_URI,
        serverSelectionTimeoutMS=settings.MONGODB_TIMEOUT_MS,
        connectTimeoutMS=settings.MONGODB_TIMEOUT_MS,
        tz_aware=True,
    )
    try:
        client.admin.command("ping")
        users = client[settings.MONGODB_DATABASE]["users"]
        users.create_index("email", unique=True)
        codes = client[settings.MONGODB_DATABASE]["codes"]
        codes.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
        return client, users, codes
    except PyMongoError:
        client.close()
        raise


def close_mongodb(client: MongoClient[dict[str, Any]]) -> None:
    client.close()


def get_users_collection(request: Request) -> MongoCollection:
    return request.app.state.users_collection


def get_codes_collection(request: Request) -> MongoCollection:
    return request.app.state.codes_collection
