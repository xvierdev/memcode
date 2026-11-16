from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from pymongo.collection import Collection
from pymongo.results import InsertOneResult


class UserRepository:
    def __init__(self, collection: Collection[dict[str, Any]]) -> None:
        self.collection = collection

    def create(self, email: str, password_hash: str) -> dict[str, Any]:
        user = {
            "email": email.strip().lower(),
            "password_hash": password_hash,
            "created_at": datetime.now(UTC),
        }
        result: InsertOneResult = self.collection.insert_one(user)
        user["_id"] = result.inserted_id
        return user

    def get_by_email(self, email: str) -> dict[str, Any] | None:
        return self.collection.find_one(
            {"email": email.strip().lower()},
            {"email": 1, "password_hash": 1, "created_at": 1},
        )

    def get_by_id(self, user_id: ObjectId) -> dict[str, Any] | None:
        return self.collection.find_one(
            {"_id": user_id},
            {"email": 1, "password_hash": 1, "created_at": 1},
        )

    def update_password(self, user_id: ObjectId, password_hash: str) -> bool:
        result = self.collection.update_one(
            {"_id": user_id},
            {"$set": {"password_hash": password_hash}},
        )
        return result.matched_count == 1
