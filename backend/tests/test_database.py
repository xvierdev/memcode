from unittest.mock import MagicMock, Mock

import pytest
from src.core import database


def test_connect_to_mongodb_uses_configured_credentials(monkeypatch):
    mongo_client = MagicMock()
    mongo_client_factory = Mock(return_value=mongo_client)
    monkeypatch.setattr(database, "MongoClient", mongo_client_factory)
    monkeypatch.setattr(database.settings, "MONGODB_URI", "mongodb://mongodb:27017")
    monkeypatch.setattr(database.settings, "MONGODB_USERNAME", "memcode")
    monkeypatch.setattr(database.settings, "MONGODB_PASSWORD", "secret")
    monkeypatch.setattr(database.settings, "MONGODB_AUTH_SOURCE", "admin")
    monkeypatch.setattr(database.settings, "MONGODB_TIMEOUT_MS", 1234)

    database.connect_to_mongodb()

    mongo_client_factory.assert_called_once_with(
        "mongodb://mongodb:27017",
        serverSelectionTimeoutMS=1234,
        connectTimeoutMS=1234,
        tz_aware=True,
        username="memcode",
        password="secret",
        authSource="admin",
    )


def test_validate_requires_mongodb_username_and_password_together(monkeypatch):
    monkeypatch.setattr(database.settings, "SECRET_KEY", "s" * 32)
    monkeypatch.setattr(database.settings, "MONGODB_USERNAME", "memcode")
    monkeypatch.setattr(database.settings, "MONGODB_PASSWORD", "")

    with pytest.raises(RuntimeError, match="must be configured together"):
        database.settings.validate()
