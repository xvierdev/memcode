import re
from datetime import UTC, datetime
from typing import Any
from uuid import NAMESPACE_URL, uuid4, uuid5

from bson import ObjectId
from pymongo.collection import Collection
from src.schemas.code import CodeCreate, CodeUpdate


def _utc_now() -> datetime:
    now = datetime.now(UTC)
    return now.replace(microsecond=(now.microsecond // 1000) * 1000)


class CodeRepository:
    def __init__(
        self,
        collection: Collection[dict[str, Any]],
        user_id: ObjectId,
    ) -> None:
        self.collection = collection
        self.user_id = user_id

    def _code_query(self, code_id: str) -> dict[str, Any]:
        return {"_id": code_id, "user_id": self.user_id}

    def _save_comments(self, code_id: str, comments: list[dict[str, Any]]) -> bool:
        result = self.collection.update_one(
            self._code_query(code_id),
            {"$set": {"comments": comments}},
        )
        return result.matched_count == 1

    def _list_codes(self, query: dict[str, Any]) -> list[dict[str, Any]]:
        documents = self.collection.find(query).sort("created_at", -1)
        return [self._to_response(document) for document in documents]

    def create(self, data: CodeCreate) -> dict[str, Any]:
        code_id = str(uuid4())
        now = _utc_now()
        document = {
            **data.model_dump(),
            "comments": [],
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
        document = self.collection.find_one(self._code_query(code_id))
        return self._to_response(document) if document is not None else None

    def get_all(self) -> list[dict[str, Any]]:
        return self._list_codes({"user_id": self.user_id})

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

        return self._list_codes(query)

    def update(self, code_id: str, data: CodeUpdate) -> dict[str, Any] | None:
        result = self.collection.update_one(
            self._code_query(code_id),
            {
                "$set": {
                    **data.model_dump(),
                    "updated_at": _utc_now(),
                }
            },
        )
        return self.get(code_id) if result.matched_count == 1 else None

    def add_comment(self, code_id: str, text: str) -> dict[str, Any] | None:
        document = self.collection.find_one(self._code_query(code_id))
        if document is None:
            return None

        now = _utc_now()
        comment = {
            "id": str(uuid4()),
            "text": text,
            "created_at": now,
            "updated_at": now,
        }
        comments = [comment, *self._normalize_comments(document)]
        return comment if self._save_comments(code_id, comments) else None

    def update_comment(
        self,
        code_id: str,
        comment_id: str,
        text: str,
    ) -> dict[str, Any] | None:
        document = self.collection.find_one(self._code_query(code_id))
        if document is None:
            return None

        comments = self._normalize_comments(document)
        updated_comment = None
        for index, comment in enumerate(comments):
            if comment["id"] == comment_id:
                updated_comment = {
                    **comment,
                    "text": text,
                    "updated_at": _utc_now(),
                }
                comments[index] = updated_comment
                break

        if updated_comment is None:
            return None

        return updated_comment if self._save_comments(code_id, comments) else None

    def delete_comment(self, code_id: str, comment_id: str) -> bool:
        document = self.collection.find_one(self._code_query(code_id))
        if document is None:
            return False

        comments = self._normalize_comments(document)
        updated_comments = [
            comment for comment in comments if comment["id"] != comment_id
        ]
        if len(updated_comments) == len(comments):
            return False

        return self._save_comments(code_id, updated_comments)

    def delete(self, code_id: str) -> bool:
        result = self.collection.delete_one(
            self._code_query(code_id),
        )
        return result.deleted_count == 1

    @classmethod
    def _to_response(cls, document: dict[str, Any]) -> dict[str, Any]:
        response = {
            key: value
            for key, value in document.items()
            if key not in {"_id", "user_id"}
        }
        response["id"] = document["_id"]
        response["comments"] = cls._normalize_comments(document)
        return response

    @staticmethod
    def _normalize_comments(document: dict[str, Any]) -> list[dict[str, Any]]:
        fallback_timestamp = document.get("updated_at", document["created_at"])
        if fallback_timestamp.tzinfo is None:
            fallback_timestamp = fallback_timestamp.replace(tzinfo=UTC)

        comments = []
        for index, comment in enumerate(document.get("comments", [])):
            if isinstance(comment, str):
                comment = {
                    "id": str(
                        uuid5(
                            NAMESPACE_URL,
                            f"{document['_id']}:{index}:{comment}",
                        )
                    ),
                    "text": comment,
                    "created_at": fallback_timestamp,
                    "updated_at": fallback_timestamp,
                }
            else:
                comment = dict(comment)

            for field in ("created_at", "updated_at"):
                timestamp = comment[field]
                if timestamp.tzinfo is None:
                    timestamp = timestamp.replace(tzinfo=UTC)
                comment[field] = timestamp.astimezone(UTC)

            comments.append(comment)
        return comments
