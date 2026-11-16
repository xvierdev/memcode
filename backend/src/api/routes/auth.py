from fastapi import APIRouter, HTTPException, Response, status
from pymongo.errors import DuplicateKeyError
from src.api.deps import CurrentUser, UsersCollection
from src.core.security import create_access_token, hash_password, verify_password
from src.repositories.user_repository import UserRepository
from src.schemas.auth import (
    PasswordChange,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def build_user_response(user: dict) -> UserResponse:
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        created_at=user["created_at"],
    )


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: UserCreate, users: UsersCollection) -> UserResponse:
    repository = UserRepository(users)
    try:
        user = repository.create(
            email=str(payload.email),
            password_hash=hash_password(payload.password),
        )
    except DuplicateKeyError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        ) from error
    return build_user_response(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, users: UsersCollection) -> TokenResponse:
    user = UserRepository(users).get_by_email(str(payload.email))
    if user is None or not verify_password(
        payload.password,
        user["password_hash"],
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenResponse(
        access_token=create_access_token(str(user["_id"])),
    )


@router.patch("/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: PasswordChange,
    current_user: CurrentUser,
    users: UsersCollection,
) -> Response:
    if not verify_password(payload.current_password, current_user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    updated = UserRepository(users).update_password(
        current_user["_id"],
        hash_password(payload.new_password),
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
