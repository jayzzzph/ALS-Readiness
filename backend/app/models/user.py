from datetime import datetime

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import func
from sqlmodel import Field, SQLModel

from app.enums.user import UserRole


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)

    email: str = Field(
        max_length=254,
        unique=True,
        index=True,
    )

    password_hash: str = Field(max_length=255)

    role: UserRole = Field(
        default=UserRole.LEARNER,
        sa_type=SQLEnum(
            UserRole,
            values_callable=lambda enum: [e.value for e in enum],
            name="user_role",
        ),
    )

    is_active: bool = Field(default=True)

    created_at: datetime = Field(
        default=None, sa_column_kwargs={"server_default": func.now()}
    )

    updated_at: datetime = Field(
        default=None,
        sa_column_kwargs={
            "server_default": func.now(),
            "onupdate": func.now(),
        },
    )
