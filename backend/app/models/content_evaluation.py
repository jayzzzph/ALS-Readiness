from sqlalchemy import Enum as SQLEnum
from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship

from app.enums.content import StimulusLevel

from .base import BaseEntity


class ContentEvaluation(BaseEntity, table=True):
    __tablename__ = "content_evaluations"

    content_id: int = Field(foreign_key="contents.id")

    stimulus_level: StimulusLevel = Field(
        sa_type=SQLEnum(
            StimulusLevel,
            values_callable=lambda enum: [e.value for e in enum],
            name="stimulus_level",
        )
    )

    cognitive_sustainability_rating: float = Field(ge=0, le=1)

    content: "Content" = Relationship(back_populates="evaluation")

    # A content has at most one evaluation.
    __table_args__ = (
        UniqueConstraint("content_id", name="uq_content_evaluations_content_id"),
    )

