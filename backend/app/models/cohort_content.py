from datetime import datetime

from sqlalchemy import UniqueConstraint, func
from sqlmodel import Field

from .base import BaseEntity


class CohortContent(BaseEntity, table=True):
    __tablename__ = "cohort_content"

    cohort_id: int = Field(foreign_key="cohorts.id")
    content_id: int = Field(foreign_key="contents.id")
    assigned_by: int = Field(foreign_key="users.id")

    assigned_at: datetime | None = Field(
        default=None, sa_column_kwargs={"server_default": func.now()}
    )

    # A content is assigned to a cohort at most once.
    __table_args__ = (
        UniqueConstraint(
            "cohort_id", "content_id", name="uq_cohort_content_cohort_content"
        ),
    )
