from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.enums.at_risk import AtRiskReason
from app.enums.cohort import CohortMemberStatus, CohortStatus

from .at_risk import AtRiskFlagSummary

# Privacy (NFR-M05-02): nothing here carries a learner's birthdate, address,
# contact number, or email. A learner is identified by name and id number only.

MembershipStatusFilter = Literal["active", "ended", "all"]


class LearnerProgress(BaseModel):
    completed_lessons: int
    total_lessons: int
    # 0 when the cohort has no lessons that count in the strand.
    percent: float


class LearnerStrandProgress(LearnerProgress):
    strand_id: int
    strand_code: str


# ================ List ================

class FacilitatorLearnerRow(BaseModel):
    """One cohort membership. A learner who was in two of the caller's cohorts
    has two rows."""

    learner_id: int
    id_no: str | None
    first_name: str | None
    last_name: str | None
    cohort_id: int
    cohort_name: str
    school_year: str
    membership_status: CohortMemberStatus
    # Always null until M03 provides readiness (D1).
    readiness: None = None
    # One entry per active strand, in strand order, counted against this cohort.
    progress: list[LearnerStrandProgress]
    last_active_at: datetime | None
    # The reasons with an active (open or reviewed) flag in this cohort.
    at_risk_reasons: list[AtRiskReason]


class FacilitatorLearnerListResponse(BaseModel):
    items: list[FacilitatorLearnerRow]
    total: int
    page: int
    page_size: int


# ================ Detail ================

class LearnerIdentity(BaseModel):
    learner_id: int
    id_no: str | None
    first_name: str | None
    last_name: str | None


class LearnerMembership(BaseModel):
    id: int
    name: str
    school_year: str
    status: CohortStatus
    membership_status: CohortMemberStatus
    assigned_at: datetime


class StrandTestResult(BaseModel):
    score: int
    total_items: int
    # Null only for an attempt with no items.
    mps: float | None
    submitted_at: datetime | None


class LearnerStrandDetail(BaseModel):
    strand_id: int
    strand_code: str
    strand_name: str
    pretest: StrandTestResult | None
    posttest: StrandTestResult | None
    progress: LearnerProgress


class LearnerLriResult(BaseModel):
    # Mean of the 1 to 4 answers, as the learner sees it. No level is derived.
    score: float
    submitted_at: datetime | None


class LearnerIntakeSummary(BaseModel):
    """The learner's age and their educational and learning background, from
    the intake form. Sex and civil status are left out: they describe the
    person, not their learning."""

    age: int
    highest_educational_attainment: str
    als_learning_strands: list[str]
    als_enrollment_months: int
    has_taken_ae_test: bool
    ae_test_attempt_count: int
    submitted_at: datetime | None


class FacilitatorLearnerDetailResponse(BaseModel):
    learner: LearnerIdentity
    # The cohort the strands' progress is counted against.
    cohort: LearnerMembership
    # The learner's other memberships in cohorts the caller can see.
    memberships: list[LearnerMembership]
    # Always null until M03 provides readiness (D1).
    readiness: None = None
    last_active_at: datetime | None
    strands: list[LearnerStrandDetail]
    lri: LearnerLriResult | None
    intake: LearnerIntakeSummary | None
    # Every flag of the learner in the cohort above, newest first.
    at_risk_flags: list[AtRiskFlagSummary]
