from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.enums.at_risk import AtRiskFlagStatus, AtRiskReason
from app.enums.cohort import CohortMemberStatus, CohortStatus

# Privacy (NFR-M05-02): nothing here carries a learner's birthdate, address,
# contact number, email, age, sex, or civil status. A learner is identified by
# name and id number only.

ReportFormat = Literal["json", "csv"]


class ReportCohort(BaseModel):
    id: int
    name: str
    code: str | None
    school_year: str
    status: CohortStatus


class MpsAverage(BaseModel):
    # Over the learners who took the test. Null when nobody did.
    average_mps: float | None
    count: int


class PosttestAverage(MpsAverage):
    # Learners whose posttest MPS is at or above the mastery threshold.
    mastery_count: int


# ================ Dashboard ================

class EvaluationCoverage(BaseModel):
    """Over the content learners in the cohort can reach: assigned to it,
    active, and under an active lesson, module, and strand."""

    evaluated: int
    total: int


class DashboardStrand(BaseModel):
    strand_id: int
    strand_code: str
    strand_name: str
    # Lessons that count toward progress in this cohort.
    total_lessons: int
    # Over every member. Null when the cohort has none.
    average_percent: float | None
    # Members at 100 percent.
    completed_count: int
    pretest: MpsAverage
    posttest: PosttestAverage


class DashboardFlag(BaseModel):
    id: int
    reason: AtRiskReason
    strand_code: str | None
    trigger_value: float | None
    status: AtRiskFlagStatus
    detected_at: datetime


class DashboardAtRiskLearner(BaseModel):
    learner_id: int
    id_no: str | None
    first_name: str | None
    last_name: str | None
    overall_progress: float
    last_active_at: datetime | None
    # The learner's active (open or reviewed) flags.
    flags: list[DashboardFlag]


class DashboardAtRisk(BaseModel):
    learner_count: int
    flag_count: int
    # Most flags first, then longest since last active.
    learners: list[DashboardAtRiskLearner]


class DashboardResponse(BaseModel):
    cohort: ReportCohort
    # Learners with an active membership. Every figure below is over them.
    learner_count: int
    # Always null until M03 provides readiness (D1).
    readiness_distribution: None = None
    # Mean of the members' overall progress. Null when the cohort has none.
    average_progress: float | None
    evaluation_coverage: EvaluationCoverage
    # One entry per active strand, in strand order.
    progress_by_strand: list[DashboardStrand]
    at_risk: DashboardAtRisk
    generated_at: datetime


# ================ Cohort summary report ================

class ReportThresholds(BaseModel):
    mps_mastery: float
    inactivity_days: int


class ReportLearnerStrand(BaseModel):
    strand_code: str
    progress_percent: float
    completed_lessons: int
    total_lessons: int
    pretest_mps: float | None
    posttest_mps: float | None
    # Posttest minus pretest. Null unless the learner has both.
    gain: float | None
    # Null when there is no posttest.
    mastered: bool | None


class ReportLearner(BaseModel):
    learner_id: int
    id_no: str | None
    first_name: str | None
    last_name: str | None
    membership_status: CohortMemberStatus
    overall_progress: float
    last_active_at: datetime | None
    lri_score: float | None
    # The reasons with an active (open or reviewed) flag in this cohort.
    at_risk_reasons: list[AtRiskReason]
    # One entry per active strand, in strand order.
    strands: list[ReportLearnerStrand]


class GainAverage(BaseModel):
    # Over the learners who have both tests. Null when nobody does.
    average: float | None
    count: int


class ReportStrandTotals(BaseModel):
    strand_code: str
    average_progress: float | None
    pretest: MpsAverage
    posttest: MpsAverage
    gain: GainAverage
    mastery_count: int


class ReportAtRiskByReason(BaseModel):
    # Learners, not flags: a learner flagged in two strands counts once.
    low_mps: int
    inactive: int
    low_readiness: int


class ReportAtRiskTotals(BaseModel):
    learner_count: int
    by_reason: ReportAtRiskByReason


class ReportTotals(BaseModel):
    """Over the learners listed, so they follow the membership_status filter."""

    learner_count: int
    average_progress: float | None
    at_risk: ReportAtRiskTotals
    strands: list[ReportStrandTotals]


class CohortSummaryResponse(BaseModel):
    cohort: ReportCohort
    generated_at: datetime
    thresholds: ReportThresholds
    # One entry per membership, by last name then first name.
    learners: list[ReportLearner]
    totals: ReportTotals
