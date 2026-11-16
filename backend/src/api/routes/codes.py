from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Response, status
from src.api.deps import CodesCollection, CurrentUser
from src.core.security import verify_password
from src.repositories.code_repository import CodeRepository
from src.schemas.code import (
    CodeComment,
    CodeCommentCreate,
    CodeCommentUpdate,
    CodeCreate,
    CodeDeleteRequest,
    CodeResponse,
    CodeUpdate,
)

router = APIRouter(prefix="/codes", tags=["Code snippets"])


@router.post(
    "",
    response_model=CodeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_code(
    payload: CodeCreate,
    current_user: CurrentUser,
    codes: CodesCollection,
) -> CodeResponse:
    code = CodeRepository(codes, current_user["_id"]).create(payload)
    return CodeResponse(**code)


@router.get("", response_model=list[CodeResponse])
def get_all_codes(
    current_user: CurrentUser,
    codes: CodesCollection,
) -> list[CodeResponse]:
    user_codes = CodeRepository(codes, current_user["_id"]).get_all()
    return [CodeResponse(**code) for code in user_codes]


@router.get("/search", response_model=list[CodeResponse])
def search_codes(
    current_user: CurrentUser,
    codes: CodesCollection,
    title: Annotated[str | None, Query(min_length=1, max_length=160)] = None,
    description: Annotated[str | None, Query(min_length=1, max_length=2000)] = None,
    language: Annotated[str | None, Query(min_length=1, max_length=80)] = None,
    code: Annotated[str | None, Query(min_length=1)] = None,
) -> list[CodeResponse]:
    if all(value is None for value in (title, description, language, code)):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="At least one search filter must be provided.",
        )

    matches = CodeRepository(codes, current_user["_id"]).search(
        title=title,
        description=description,
        language=language,
        code=code,
    )
    return [CodeResponse(**match) for match in matches]


@router.get("/{code_id}", response_model=CodeResponse)
def get_code(
    code_id: UUID,
    current_user: CurrentUser,
    codes: CodesCollection,
) -> CodeResponse:
    code = CodeRepository(codes, current_user["_id"]).get(str(code_id))
    if code is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Code snippet not found.",
        )
    return CodeResponse(**code)


@router.put("/{code_id}", response_model=CodeResponse)
def update_code(
    code_id: UUID,
    payload: CodeUpdate,
    current_user: CurrentUser,
    codes: CodesCollection,
) -> CodeResponse:
    code = CodeRepository(codes, current_user["_id"]).update(
        str(code_id),
        payload,
    )
    if code is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Code snippet not found.",
        )
    return CodeResponse(**code)


@router.post(
    "/{code_id}/comments",
    response_model=CodeComment,
    status_code=status.HTTP_201_CREATED,
)
def add_code_comment(
    code_id: UUID,
    payload: CodeCommentCreate,
    current_user: CurrentUser,
    codes: CodesCollection,
) -> CodeComment:
    comment = CodeRepository(codes, current_user["_id"]).add_comment(
        str(code_id),
        payload.text,
    )
    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Code snippet not found.",
        )
    return CodeComment(**comment)


@router.patch(
    "/{code_id}/comments/{comment_id}",
    response_model=CodeComment,
)
def update_code_comment(
    code_id: UUID,
    comment_id: UUID,
    payload: CodeCommentUpdate,
    current_user: CurrentUser,
    codes: CodesCollection,
) -> CodeComment:
    comment = CodeRepository(codes, current_user["_id"]).update_comment(
        str(code_id),
        str(comment_id),
        payload.text,
    )
    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Code comment not found.",
        )
    return CodeComment(**comment)


@router.delete(
    "/{code_id}/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_code_comment(
    code_id: UUID,
    comment_id: UUID,
    current_user: CurrentUser,
    codes: CodesCollection,
) -> Response:
    deleted = CodeRepository(codes, current_user["_id"]).delete_comment(
        str(code_id),
        str(comment_id),
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Code comment not found.",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/{code_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_code(
    code_id: UUID,
    payload: CodeDeleteRequest,
    current_user: CurrentUser,
    codes: CodesCollection,
) -> Response:
    if not verify_password(
        payload.password.get_secret_value(),
        current_user["password_hash"],
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    deleted = CodeRepository(codes, current_user["_id"]).delete(str(code_id))
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Code snippet not found.",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
