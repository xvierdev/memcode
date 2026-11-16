from datetime import datetime

from pydantic import BaseModel, Field


class CodeCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    description: str = Field(max_length=2000)
    language: str = Field(min_length=1, max_length=80)
    code: str = Field(min_length=1)
    comments: list[str] = Field(default_factory=list)


class CodeUpdate(CodeCreate):
    pass


class CodeResponse(CodeCreate):
    id: str
    created_at: datetime
    updated_at: datetime
