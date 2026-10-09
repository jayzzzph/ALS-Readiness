from datetime import datetime

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import Index, Numeric, Text, text
from sqlmodel import Field

from app.enums.at_risk import AtRiskFlagStatus, AtRiskReason

from .base import BaseEntity, TimestampMixin


class AtRiskFlag(BaseEntity, TimestampMixin, table=True):
    """One episode of a learner meeting an at-risk rule in a cohort.

    The episode is still running while resolved_at is null. A flag that is
    open or reviewed is "active"; a dismissed one stays out of the way until
    its episode ends.
    """

    __tablename__ = "at_risk_flags"

    learner_id: int = Field(foreign_key="learners.id")
    cohort_id: int = Field(foreign_key="cohorts.id")

    reason: AtRiskReason = Field(
        sa_type=SQLEnum(
            AtRiskReason,
            values_callable=lambda enum: [e.value for e in enum],
            name="at_risk_reason",
        )
    )

    # Set only for low_mps.
    strand_id: int | None = Field(default=None, foreign_key="learning_strands.id")
    # What triggered the flag: the MPS, or the number of inactive days.
    trigger_value: float | None = Field(default=None, sa_type=Numeric(8, 2, asdecimal=False))

    status: AtRiskFlagStatus = Field(
        default=AtRiskFlagStatus.OPEN,
        sa_type=SQLEnum(
            AtRiskFlagStatus,
            values_callable=lambda enum: [e.value for e in enum],
            name="at_risk_flag_status",
        ),
        sa_column_kwargs={"server_default": AtRiskFlagStatus.OPEN.value},
    )

    detected_at: datetime
    resolved_at: datetime | None = Field(default=None)

    reviewed_by: int | None = Field(default=None, foreign_key="users.id")
    reviewed_at: datetime | None = Field(default=None)
    note: str | None = Field(default=None, sa_type=Text)

    __table_args__ = (
        # At most one active flag per learner, cohort, reason, and strand. The
        # strand is null for every reason but low_mps, and nulls never collide
        # in a unique index, so it is indexed as 0 in that case.
        Index(
            "uq_at_risk_flags_active_learner_cohort_reason_strand",
            "learner_id",
            "cohort_id",
            "reason",
            text("COALESCE(strand_id, 0)"),
            unique=True,
            postgresql_where=text("status IN ('open', 'reviewed')"),
        ),
        Index("ix_at_risk_flags_cohort_id_status", "cohort_id", "status"),
    )
