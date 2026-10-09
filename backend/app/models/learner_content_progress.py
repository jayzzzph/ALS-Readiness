from datetime import datetime

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship

from app.enums.content import ContentProgressStatus

from .base import BaseEntity


class LearnerContentProgress(BaseEntity, table=True):
    __tablename__ = "learner_content_progress"
    __table_args__ = (UniqueConstraint("learner_id", "content_id"),)

    learner_id: int = Field(foreign_key="learners.id")
    content_id: int = Field(foreign_key="contents.id")

    last_accessed_at: datetime | None
    completed_at: datetime | None

    content: "Content" = Relationship(back_populates="progress_records")
