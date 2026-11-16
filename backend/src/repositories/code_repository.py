import re
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from bson import ObjectId
from pymongo.collection import Collection
from src.schemas.code import CodeCreate, CodeUpdate


class CodeRepository:
    def __init__(
        self,
        collection: Collection[dict[str, Any]],
        user_id: ObjectId,
    ) -> None:
        self.collection = collection
        self.user_id = user_id

    def create(self, data: CodeCreate) -> dict[str, Any]:
        code_id = str(uuid4())
        now = datetime.now(UTC)
        document = {
            **data.model_dump(),
            "_id": code_id,
            "user_id": self.user_id,
            "created_at": now,
            "updated_at": now,
        }
        self.collection.insert_one(document)
        stored_code = self.collection.find_one({"_id": code_id})
        if stored_code is None:
            raise RuntimeError("Inserted code snippet could not be retrieved.")
        return self._to_response(stored_code)

    def get(self, code_id: str) -> dict[str, Any] | None:
        document = self.collection.find_one(
            {"_id": code_id, "user_id": self.user_id},
        )
        return self._to_response(document) if document is not None else None

    def get_all(self) -> list[dict[str, Any]]:
        documents = self.collection.find({"user_id": self.user_id}).sort(
            "created_at",
            -1,
        )
        return [self._to_response(document) for document in documents]

    def search(
        self,
        *,
        title: str | None = None,
        description: str | None = None,
        language: str | None = None,
        code: str | None = None,
    ) -> list[dict[str, Any]]:
        query: dict[str, Any] = {"user_id": self.user_id}
        for field, value in (
            ("title", title),
            ("description", description),
            ("code", code),
        ):
            if value is not None:
                query[field] = {"$regex": re.escape(value), "$options": "i"}

        if language is not None:
            query["language"] = {
                "$regex": f"^{re.escape(language)}$",
                "$options": "i",
            }

        documents = self.collection.find(query).sort("created_at", -1)
        return [self._to_response(document) for document in documents]

    def update(self, code_id: str, data: CodeUpdate) -> dict[str, Any] | None:
        result = self.collection.update_one(
            {"_id": code_id, "user_id": self.user_id},
            {
                "$set": {
                    **data.model_dump(),
                    "updated_at": datetime.now(UTC),
                }
            },
        )
        return self.get(code_id) if result.matched_count == 1 else None

    def delete(self, code_id: str) -> bool:
        result = self.collection.delete_one(
            {"_id": code_id, "user_id": self.user_id},
        )
        return result.deleted_count == 1

    @staticmethod
    def _to_response(document: dict[str, Any]) -> dict[str, Any]:
        response = {
            key: value
            for key, value in document.items()
            if key not in {"_id", "user_id"}
        }
        response["id"] = document["_id"]
        return response
