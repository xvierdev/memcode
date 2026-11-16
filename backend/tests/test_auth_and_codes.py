import mongomock
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from src.api.deps import get_codes_collection, get_users_collection
from src.api.routes import auth, codes

PASSWORD = "Original-Password-1"
NEW_PASSWORD = "New-Valid-Password-2"


@pytest.fixture
def api_client():
    mongo = mongomock.MongoClient()
    database = mongo["memcode_test"]
    users = database["users"]
    codes_collection = database["codes"]
    users.create_index("email", unique=True)

    app = FastAPI()
    app.include_router(auth.router)
    app.include_router(codes.router)
    app.dependency_overrides[get_users_collection] = lambda: users
    app.dependency_overrides[get_codes_collection] = lambda: codes_collection

    with TestClient(app) as client:
        yield client, users, codes_collection

    mongo.close()


def register_and_login(
    client: TestClient,
    email: str = "developer@example.com",
    password: str = PASSWORD,
) -> str:
    registration = client.post(
        "/auth/register",
        json={"email": email, "password": password},
    )
    assert registration.status_code == 201

    login = client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200
    return login.json()["access_token"]


def code_payload() -> dict[str, object]:
    return {
        "title": "Python example",
        "description": "A valid code sample.",
        "language": "python",
        "code": "print('hello')",
    }


def test_registration_and_login_reject_invalid_credentials(api_client):
    client, _, _ = api_client
    token = register_and_login(client)
    assert token

    invalid_login = client.post(
        "/auth/login",
        json={"email": "developer@example.com", "password": "wrong-password"},
    )
    assert invalid_login.status_code == 401


def test_password_change_requires_the_correct_current_password(api_client):
    client, _, _ = api_client
    token = register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}

    invalid_change = client.patch(
        "/auth/password",
        headers=headers,
        json={
            "current_password": "wrong-password",
            "new_password": NEW_PASSWORD,
        },
    )
    assert invalid_change.status_code == 400
    assert (
        client.post(
            "/auth/login",
            json={"email": "developer@example.com", "password": PASSWORD},
        ).status_code
        == 200
    )

    valid_change = client.patch(
        "/auth/password",
        headers=headers,
        json={"current_password": PASSWORD, "new_password": NEW_PASSWORD},
    )
    assert valid_change.status_code == 204
    assert (
        client.post(
            "/auth/login",
            json={"email": "developer@example.com", "password": PASSWORD},
        ).status_code
        == 401
    )
    assert (
        client.post(
            "/auth/login",
            json={"email": "developer@example.com", "password": NEW_PASSWORD},
        ).status_code
        == 200
    )


def test_code_creation_requires_authentication(api_client):
    client, _, _ = api_client
    response = client.post("/codes", json=code_payload())
    assert response.status_code == 401


@pytest.mark.parametrize("missing_field", ["title", "language", "code"])
def test_code_requires_title_language_and_content(api_client, missing_field):
    client, _, _ = api_client
    token = register_and_login(client)
    payload = code_payload()
    payload.pop(missing_field)

    response = client.post(
        "/codes",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )

    assert response.status_code == 422


@pytest.mark.parametrize(
    ("field", "value"),
    [("title", ""), ("language", ""), ("code", "")],
)
def test_required_code_fields_cannot_be_empty(api_client, field, value):
    client, _, _ = api_client
    token = register_and_login(client)
    payload = {**code_payload(), field: value}

    response = client.post(
        "/codes",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )

    assert response.status_code == 422


def test_code_is_stored_in_its_own_document_with_comments(api_client):
    client, users, codes_collection = api_client
    token = register_and_login(client)
    payload = {**code_payload(), "comments": ["First note", "Second note"]}

    response = client.post(
        "/codes",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )

    assert response.status_code == 201
    user = users.find_one({"email": "developer@example.com"})
    assert user is not None
    assert "library" not in user
    code = codes_collection.find_one({"_id": response.json()["id"]})
    assert code is not None
    assert code["user_id"] == user["_id"]
    assert code["comments"] == payload["comments"]
