from datetime import UTC, datetime, timedelta

import jwt
import mongomock
import pytest
from bson import ObjectId
from fastapi import FastAPI
from fastapi.testclient import TestClient
from src.api.deps import get_codes_collection, get_users_collection
from src.api.routes import auth, codes
from src.core.config import settings

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


@pytest.mark.parametrize(
    ("method", "path", "kwargs"),
    [
        ("post", "/codes", {"json": code_payload()}),
        ("get", "/codes", {}),
        ("get", "/codes/search?title=python", {}),
        ("get", "/codes/00000000-0000-0000-0000-000000000001", {}),
        (
            "put",
            "/codes/00000000-0000-0000-0000-000000000001",
            {"json": code_payload()},
        ),
        ("delete", "/codes/00000000-0000-0000-0000-000000000001", {}),
        (
            "patch",
            "/auth/password",
            {
                "json": {
                    "current_password": PASSWORD,
                    "new_password": NEW_PASSWORD,
                }
            },
        ),
    ],
)
def test_all_protected_routes_require_authentication(
    api_client,
    method,
    path,
    kwargs,
):
    client, _, _ = api_client

    response = getattr(client, method)(path, **kwargs)

    assert response.status_code == 401


@pytest.mark.parametrize(
    "token_kind",
    ["malformed", "expired", "invalid_signature", "missing_user"],
)
def test_protected_routes_reject_invalid_tokens(api_client, token_kind):
    client, _, _ = api_client
    subject = str(ObjectId())
    payload = {
        "sub": subject,
        "exp": datetime.now(UTC) + timedelta(minutes=5),
    }

    if token_kind == "malformed":
        token = "not-a-jwt"
    elif token_kind == "expired":
        payload["exp"] = datetime.now(UTC) - timedelta(minutes=1)
        token = jwt.encode(
            payload,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM,
        )
    elif token_kind == "invalid_signature":
        token = jwt.encode(
            payload,
            "invalid-test-secret-that-is-long-enough-for-hs256",
            algorithm=settings.ALGORITHM,
        )
    else:
        token = jwt.encode(
            payload,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM,
        )

    response = client.get(
        "/codes",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401


def test_registration_and_login_reject_invalid_credentials(api_client):
    client, _, _ = api_client
    token = register_and_login(client)
    assert token

    for credentials in (
        {"email": "developer@example.com", "password": "wrong-password"},
        {"email": "unknown@example.com", "password": PASSWORD},
    ):
        invalid_login = client.post("/auth/login", json=credentials)
        assert invalid_login.status_code == 401


def test_registration_normalizes_email_and_does_not_expose_password_hash(api_client):
    client, users, _ = api_client
    response = client.post(
        "/auth/register",
        json={"email": "Developer@Example.com", "password": PASSWORD},
    )

    assert response.status_code == 201
    assert response.json()["email"] == "developer@example.com"
    assert "password" not in response.json()
    assert "password_hash" not in response.json()
    user = users.find_one({"email": "developer@example.com"})
    assert user is not None
    assert user["password_hash"] != PASSWORD
    login = client.post(
        "/auth/login",
        json={"email": "DEVELOPER@EXAMPLE.COM", "password": PASSWORD},
    )
    assert login.status_code == 200


def test_registration_rejects_duplicate_email_case_insensitively(api_client):
    client, _, _ = api_client
    register_and_login(client, email="developer@example.com")

    response = client.post(
        "/auth/register",
        json={"email": "DEVELOPER@example.com", "password": PASSWORD},
    )

    assert response.status_code == 409


@pytest.mark.parametrize(
    ("email", "password"),
    [
        ("not-an-email", PASSWORD),
        ("valid@example.com", "short"),
        ("valid@example.com", "x" * 129),
    ],
)
def test_registration_rejects_invalid_email_and_passwords(
    api_client,
    email,
    password,
):
    client, _, _ = api_client

    response = client.post(
        "/auth/register",
        json={"email": email, "password": password},
    )

    assert response.status_code == 422


def test_login_returns_a_signed_token_with_configured_expiration(api_client):
    client, users, _ = api_client
    register_and_login(client)
    user = users.find_one({"email": "developer@example.com"})
    assert user is not None

    response = client.post(
        "/auth/login",
        json={"email": "developer@example.com", "password": PASSWORD},
    )

    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    token_payload = jwt.decode(
        response.json()["access_token"],
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],
    )
    assert token_payload["sub"] == str(user["_id"])
    assert (
        settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60 - 1
        <= token_payload["exp"] - token_payload["iat"]
        <= settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


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


def test_password_change_requires_authentication_and_valid_new_password(api_client):
    client, _, _ = api_client
    unauthenticated = client.patch(
        "/auth/password",
        json={"current_password": PASSWORD, "new_password": NEW_PASSWORD},
    )
    assert unauthenticated.status_code == 401

    token = register_and_login(client)
    invalid_password = client.patch(
        "/auth/password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": PASSWORD, "new_password": "short"},
    )
    assert invalid_password.status_code == 422


@pytest.mark.parametrize(
    "missing_field",
    ["title", "description", "language", "code"],
)
def test_code_creation_requires_all_required_fields(api_client, missing_field):
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


def test_authenticated_user_can_create_list_get_update_and_delete_codes(api_client):
    client, _, _ = api_client
    token = register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}

    first = client.post("/codes", headers=headers, json=code_payload())
    second_payload = {**code_payload(), "title": "JavaScript example"}
    second = client.post("/codes", headers=headers, json=second_payload)

    assert first.status_code == 201
    assert first.json()["comments"] == []
    assert second.status_code == 201
    first_code = first.json()
    second_code = second.json()

    listed = client.get("/codes", headers=headers)
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [
        second_code["id"],
        first_code["id"],
    ]

    retrieved = client.get(f"/codes/{first_code['id']}", headers=headers)
    assert retrieved.status_code == 200
    assert retrieved.json()["title"] == first_code["title"]

    update_payload = {
        **code_payload(),
        "title": "Updated Python example",
        "comments": ["Updated note"],
    }
    updated = client.put(
        f"/codes/{first_code['id']}",
        headers=headers,
        json=update_payload,
    )
    assert updated.status_code == 200
    assert updated.json()["id"] == first_code["id"]
    assert updated.json()["title"] == update_payload["title"]
    assert updated.json()["comments"] == update_payload["comments"]
    assert datetime.fromisoformat(
        updated.json()["updated_at"]
    ) >= datetime.fromisoformat(first_code["updated_at"])

    deleted = client.delete(f"/codes/{second_code['id']}", headers=headers)
    assert deleted.status_code == 204
    assert deleted.content == b""
    assert client.get(f"/codes/{second_code['id']}", headers=headers).status_code == 404

    remaining = client.get("/codes", headers=headers)
    assert [item["id"] for item in remaining.json()] == [first_code["id"]]


def test_code_access_is_limited_to_the_owner(api_client):
    client, _, codes_collection = api_client
    owner_token = register_and_login(client)
    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    created = client.post("/codes", headers=owner_headers, json=code_payload())
    assert created.status_code == 201
    code_id = created.json()["id"]

    other_token = register_and_login(
        client,
        email="other-developer@example.com",
    )
    other_headers = {"Authorization": f"Bearer {other_token}"}

    assert client.get("/codes", headers=other_headers).json() == []
    search = client.get(
        "/codes/search",
        headers=other_headers,
        params={"title": "Python"},
    )
    assert search.status_code == 200
    assert search.json() == []
    assert client.get(f"/codes/{code_id}", headers=other_headers).status_code == 404
    assert (
        client.put(
            f"/codes/{code_id}",
            headers=other_headers,
            json={**code_payload(), "title": "Unauthorized edit"},
        ).status_code
        == 404
    )
    assert client.delete(f"/codes/{code_id}", headers=other_headers).status_code == 404

    stored = codes_collection.find_one({"_id": code_id})
    assert stored is not None
    assert stored["title"] == code_payload()["title"]
    assert client.get(f"/codes/{code_id}", headers=owner_headers).status_code == 200


def test_code_endpoints_return_expected_errors_for_missing_or_invalid_ids(api_client):
    client, _, _ = api_client
    token = register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}
    missing_id = "00000000-0000-0000-0000-000000000002"

    assert client.get(f"/codes/{missing_id}", headers=headers).status_code == 404
    assert (
        client.put(
            f"/codes/{missing_id}",
            headers=headers,
            json=code_payload(),
        ).status_code
        == 404
    )
    assert client.delete(f"/codes/{missing_id}", headers=headers).status_code == 404
    assert client.get("/codes/not-a-uuid", headers=headers).status_code == 422


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("title", "x" * 161),
        ("description", "x" * 2001),
        ("language", "x" * 81),
    ],
)
def test_code_creation_enforces_maximum_field_lengths(api_client, field, value):
    client, _, _ = api_client
    token = register_and_login(client)

    response = client.post(
        "/codes",
        headers={"Authorization": f"Bearer {token}"},
        json={**code_payload(), field: value},
    )

    assert response.status_code == 422


@pytest.mark.parametrize(
    ("field", "value"),
    [("title", ""), ("language", ""), ("code", "")],
)
def test_code_update_requires_valid_required_fields(api_client, field, value):
    client, _, _ = api_client
    token = register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}
    created = client.post("/codes", headers=headers, json=code_payload())
    payload = {**code_payload(), field: value}

    response = client.put(
        f"/codes/{created.json()['id']}",
        headers=headers,
        json=payload,
    )

    assert response.status_code == 422


@pytest.mark.parametrize(
    "missing_field",
    ["title", "description", "language", "code"],
)
def test_code_update_requires_all_required_fields(api_client, missing_field):
    client, _, _ = api_client
    token = register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}
    created = client.post("/codes", headers=headers, json=code_payload())
    payload = code_payload()
    payload.pop(missing_field)

    response = client.put(
        f"/codes/{created.json()['id']}",
        headers=headers,
        json=payload,
    )

    assert response.status_code == 422


def test_code_search_requires_authentication_and_at_least_one_filter(api_client):
    client, _, _ = api_client

    unauthorized = client.get("/codes/search", params={"title": "python"})
    assert unauthorized.status_code == 401

    search_operation = client.get("/openapi.json").json()["paths"]["/codes/search"][
        "get"
    ]
    assert {parameter["name"] for parameter in search_operation["parameters"]} == {
        "title",
        "description",
        "language",
        "code",
    }

    token = register_and_login(client)
    response = client.get(
        "/codes/search",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "At least one search filter must be provided."

    no_matches = client.get(
        "/codes/search",
        headers={"Authorization": f"Bearer {token}"},
        params={"title": "not found"},
    )

    assert no_matches.status_code == 200
    assert no_matches.json() == []


def test_code_search_matches_substrings_and_combines_filters(api_client):
    client, _, _ = api_client
    token = register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}
    matching_code = {
        "title": "Async Python Guide",
        "description": "A walkthrough for async requests.",
        "language": "Python",
        "code": "async def fetch_data():\n    await client.get('/data')",
    }
    other_code = {
        "title": "Python Database Notes",
        "description": "A database reference.",
        "language": "javascript",
        "code": "print('database')",
    }

    for payload in (matching_code, other_code):
        response = client.post("/codes", headers=headers, json=payload)
        assert response.status_code == 201

    for field, value in (
        ("title", "pYtHoN gUi"),
        ("description", "WALKTHROUGH"),
        ("language", "PYTHON"),
        ("code", "AWAIT CLIENT"),
    ):
        response = client.get(
            "/codes/search",
            headers=headers,
            params={field: value},
        )
        assert response.status_code == 200
        assert [item["title"] for item in response.json()] == [matching_code["title"]]

    combined = client.get(
        "/codes/search",
        headers=headers,
        params={"title": "python", "description": "database"},
    )

    assert combined.status_code == 200
    assert [item["title"] for item in combined.json()] == [other_code["title"]]

    partial_language = client.get(
        "/codes/search",
        headers=headers,
        params={"language": "py"},
    )
    assert partial_language.status_code == 200
    assert partial_language.json() == []

    regex_characters_are_literal = client.get(
        "/codes/search",
        headers=headers,
        params={"title": ".*"},
    )
    assert regex_characters_are_literal.status_code == 200
    assert regex_characters_are_literal.json() == []


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("title", ""),
        ("title", "x" * 161),
        ("description", "x" * 2001),
        ("language", "x" * 81),
        ("code", ""),
    ],
)
def test_code_search_rejects_empty_or_oversized_filters(api_client, field, value):
    client, _, _ = api_client
    token = register_and_login(client)

    response = client.get(
        "/codes/search",
        headers={"Authorization": f"Bearer {token}"},
        params={field: value},
    )

    assert response.status_code == 422
