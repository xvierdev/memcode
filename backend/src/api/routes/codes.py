from uuid import UUID

from fastapi import APIRouter, HTTPException, Response, status
from src.api.deps import CodesCollection, CurrentUser
from src.repositories.code_repository import CodeRepository
from src.schemas.code import CodeCreate, CodeResponse, CodeUpdate

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


@router.delete("/{code_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_code(
    code_id: UUID,
    current_user: CurrentUser,
    codes: CodesCollection,
) -> Response:
    deleted = CodeRepository(codes, current_user["_id"]).delete(str(code_id))
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Code snippet not found.",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
