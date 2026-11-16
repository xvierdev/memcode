from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, SecretStr, field_validator


class CodeFields(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    description: str = Field(max_length=2000)
    language: str = Field(min_length=1, max_length=80)
    code: str = Field(min_length=1)


class CodeCreate(CodeFields):
    model_config = ConfigDict(extra="forbid")


class CodeCommentText(BaseModel):
    text: str = Field(min_length=1)

    @field_validator("text")
    @classmethod
    def strip_text(cls, value: str) -> str:
        text = value.strip()
        if not text:
            raise ValueError("Comment text cannot be empty.")
        return text


class CodeComment(CodeCommentText):
    id: str
    created_at: datetime
    updated_at: datetime


class CodeCommentCreate(CodeCommentText):
    pass


class CodeCommentUpdate(CodeCommentText):
    pass


class CodeUpdate(CodeFields):
    comments: list[CodeComment] = Field(default_factory=list)


class CodeDeleteRequest(BaseModel):
    password: SecretStr = Field(min_length=1)


class CodeResponse(CodeUpdate):
    id: str
    created_at: datetime
    updated_at: datetime
