from datetime import datetime

from sqlalchemy import Enum as SQLEnum
from sqlmodel import Field, Relationship

from app.enums.curriculum import StructureStatus

from .base import BaseEntity, TimestampMixin


class Lesson(BaseEntity, TimestampMixin, table=True):
    __tablename__ = "lessons"

    module_id: int = Field(foreign_key="modules.id")

    title: str = Field(max_length=255)
    description: str | None
    order_index: int

    status: StructureStatus = Field(
        default=StructureStatus.ACTIVE,
        sa_type=SQLEnum(
            StructureStatus,
            values_callable=lambda enum: [e.value for e in enum],
            name="structure_status"
        ),
    )

    deleted_at: datetime | None

    # Null for rows created before authoring existed (e.g. seeded structure).
    created_by: int | None = Field(default=None, foreign_key="users.id")

    module: "Module" = Relationship(back_populates="lessons")
    contents: list["Content"] = Relationship(back_populates="lesson")
