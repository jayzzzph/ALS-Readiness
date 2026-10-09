from datetime import datetime

import sqlalchemy as sa
from sqlmodel import Field

from app.enums.eeg_session import EEGSessionType

from .base import BaseEntity


class EEGSession(BaseEntity, table=True):
    __tablename__ = "eeg_sessions"
    __table_args__ = (
        sa.UniqueConstraint(
            "learner_id",
            "type",
        ),
    )

    learner_id: int = Field(foreign_key="learners.id", nullable=False)

    file_key: str = Field(max_length=255, nullable=False)
    type: EEGSessionType = Field(
        sa_type=sa.Enum(
            EEGSessionType,
            values_callable=lambda enum: [e.value for e in enum],
            name="eeg_session_type"
        ),
        nullable=False,
    )
    recorded_at: datetime = Field(sa_type=sa.DateTime(timezone=True), nullable=False)
