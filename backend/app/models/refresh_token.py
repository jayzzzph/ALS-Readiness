from datetime import datetime
from uuid import UUID

from sqlalchemy import func
from sqlmodel import Field, SQLModel


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_tokens"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)

    token_hash: str = Field(max_length=255)
    jti: UUID = Field(unique=True, index=True)
    is_revoked: bool = Field(default=False)

    expires_at: datetime
    revoked_at: datetime | None = Field(default=None)

    created_at: datetime = Field(
        default=None,
        sa_column_kwargs={"server_default": func.now()},
    )
    