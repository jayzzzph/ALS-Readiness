from datetime import datetime

from sqlalchemy import Enum as SQLEnum
from sqlmodel import Field, Relationship

from app.enums.curriculum import StructureStatus

from .base import BaseEntity, TimestampMixin
from .learning_strand import LearningStrand


class Module(BaseEntity, TimestampMixin, table=True):
    __tablename__ = "modules"

    strand_id: int = Field(foreign_key="learning_strands.id")

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

    strand: "LearningStrand" = Relationship(back_populates="modules")
    lessons: list["Lesson"] = Relationship(
        back_populates="module",
        sa_relationship_kwargs={"order_by": "Lesson.order_index"},
    )
