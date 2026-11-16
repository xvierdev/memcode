from typing import Annotated, Any

import jwt
from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from pymongo.collection import Collection
from src.core.config import settings
from src.core.database import get_codes_collection, get_users_collection
from src.repositories.user_repository import UserRepository

security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(security_scheme),
    ],
    users: Annotated[
        Collection[dict[str, Any]],
        Depends(get_users_collection),
    ],
) -> dict[str, Any]:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
    except InvalidTokenError as error:
        raise unauthorized from error

    subject = payload.get("sub")
    if not isinstance(subject, str) or not ObjectId.is_valid(subject):
        raise unauthorized

    user = UserRepository(users).get_by_id(ObjectId(subject))
    if user is None:
        raise unauthorized
    return user


CurrentUser = Annotated[dict[str, Any], Depends(get_current_user)]
UsersCollection = Annotated[
    Collection[dict[str, Any]],
    Depends(get_users_collection),
]
CodesCollection = Annotated[
    Collection[dict[str, Any]],
    Depends(get_codes_collection),
]
