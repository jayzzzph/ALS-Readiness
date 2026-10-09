from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.enums.at_risk import AtRiskFlagStatus, AtRiskReason

# Privacy (NFR-M05-02): nothing here carries a learner's birthdate, address,
# contact number, or email. A learner is identified by name and id number only.

# "active" is open and reviewed together.
AtRiskStatusFilter = Literal["active", "open", "reviewed", "dismissed", "resolved", "all"]


class AtRiskLearner(BaseModel):
    learner_id: int
    id_no: str | None
    first_name: str | None
    last_name: str | None


class AtRiskCohort(BaseModel):
    id: int
    name: str


class AtRiskFlagSummary(BaseModel):
    """A flag without its learner, for views that are already about one learner."""

    id: int
    cohort: AtRiskCohort
    reason: AtRiskReason
    # Both null unless the reason is low_mps.
    strand_id: int | None
    strand_code: str | None
    # The MPS for low_mps, the number of inactive days for inactive.
    trigger_value: float | None
    status: AtRiskFlagStatus
    detected_at: datetime
    # When the condition cleared. Set on a resolved flag, and on a dismissed
    # one whose condition has since cleared.
    resolved_at: datetime | None
    reviewed_by_name: str | None
    reviewed_at: datetime | None
    note: str | None


class AtRiskFlagItem(AtRiskFlagSummary):
    learner: AtRiskLearner


class AtRiskFlagListResponse(BaseModel):
    items: list[AtRiskFlagItem]
    total: int
    page: int
    page_size: int


class AtRiskFlagUpdate(BaseModel):
    """A facilitator's review of a flag. "resolved" cannot be set here: a flag
    resolves only when its condition clears."""

    status: Literal["open", "reviewed", "dismissed"]
    # Left as it is when not sent.
    note: str | None = Field(default=None, max_length=500)

    model_config = ConfigDict(extra="forbid")
