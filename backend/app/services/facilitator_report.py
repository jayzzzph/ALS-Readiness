import csv
import io
import re
from collections.abc import Iterable
from dataclasses import dataclass
from datetime import datetime

from app.core.constants import (
    AT_RISK_INACTIVITY_DAYS,
    AT_RISK_MPS_THRESHOLD,
    MANILA_UTC_OFFSET,
)
from app.core.exceptions import CohortNotFoundError
from app.enums.at_risk import AT_RISK_REASON_LABELS, AtRiskReason
from app.enums.cohort import CohortMemberStatus, CohortStatus
from app.enums.strand_test import StrandTestType
from app.models.cohort import Cohort, CohortLearner
from app.models.content import Content
from app.models.learning_strand import LearningStrand
from app.models.user import User
from app.repositories.cohort import CohortRepository
from app.repositories.cohort_learner import CohortLearnerRepository
from app.repositories.content import ContentRepository
from app.repositories.curriculum import CurriculumRepository
from app.repositories.learner import LearnerRepository
from app.repositories.lri_test_attempt import LRITestAttemptRepository
from app.repositories.strand_test_attempt import StrandTestAttemptRepository
from app.schemas.facilitator_learner import MembershipStatusFilter
from app.schemas.facilitator_report import (
    CohortSummaryResponse,
    DashboardAtRisk,
    DashboardAtRiskLearner,
    DashboardFlag,
    DashboardResponse,
    DashboardStrand,
    EvaluationCoverage,
    GainAverage,
    MpsAverage,
    PosttestAverage,
    ReportAtRiskByReason,
    ReportAtRiskTotals,
    ReportCohort,
    ReportLearner,
    ReportLearnerStrand,
    ReportStrandTotals,
    ReportThresholds,
    ReportTotals,
)
from app.services.at_risk import AtRiskService, manila_date, to_naive_utc
from app.services.facilitator_scope import FacilitatorScopeService
from app.services.learning_strand import LearningStrandService
from app.services.scoring import compute_mps, latest_attempts


@dataclass(frozen=True)
class LearnerStrandFigures:
    strand: LearningStrand
    completed_lessons: int
    total_lessons: int
    percent: float
    pretest_mps: float | None
    posttest_mps: float | None

    @property
    def gain(self) -> float | None:
        """Posttest minus pretest, only when the learner has both."""
        if self.pretest_mps is None or self.posttest_mps is None:
            return None

        return round(self.posttest_mps - self.pretest_mps, 2)

    @property
    def mastered(self) -> bool | None:
        """Whether the posttest reached the mastery threshold. None without one."""
        if self.posttest_mps is None:
            return None

        return self.posttest_mps >= AT_RISK_MPS_THRESHOLD


@dataclass(frozen=True)
class LearnerFigures:
    """What both views show for one membership."""

    membership: CohortLearner
    id_no: str | None
    first_name: str | None
    last_name: str | None
    # One per active strand, in strand order.
    strands: list[LearnerStrandFigures]
    last_active_at: datetime | None

    @property
    def learner_id(self) -> int:
        return self.membership.learner_id

    @property
    def overall_progress(self) -> float:
        """Completed lessons over counted lessons, across every active strand.
        0 when nothing counts."""
        total = sum(strand.total_lessons for strand in self.strands)
        if not total:
            return 0.0

        completed = sum(strand.completed_lessons for strand in self.strands)
        return round(completed / total * 100, 2)


def mean(values: Iterable[float | None]) -> tuple[float | None, int]:
    """The mean of the values that are present, to two decimals, with how many
    there were. The mean of none is None, not 0."""
    present = [value for value in values if value is not None]
    if not present:
        return None, 0

    return round(sum(present) / len(present), 2), len(present)


class FacilitatorReportService:
    """The cohort dashboard and the cohort summary report.

    Both only total what other services already work out: progress from
    LearningStrandService, MPS from compute_mps, last active from
    LearnerRepository, and flags from AtRiskService. Nothing is recalculated
    here.
    """

    def __init__(
        self,
        cohort_repo: CohortRepository,
        cohort_learner_repo: CohortLearnerRepository,
        learner_repo: LearnerRepository,
        strand_attempt_repo: StrandTestAttemptRepository,
        lri_attempt_repo: LRITestAttemptRepository,
        content_repo: ContentRepository,
        curriculum_repo: CurriculumRepository,
        strand_service: LearningStrandService,
        at_risk_service: AtRiskService,
        facilitator_scope_service: FacilitatorScopeService,
    ):
        self._cohort_repo = cohort_repo
        self._cohort_learner_repo = cohort_learner_repo
        self._learner_repo = learner_repo
        self._strand_attempt_repo = strand_attempt_repo
        self._lri_attempt_repo = lri_attempt_repo
        self._content_repo = content_repo
        self._curriculum_repo = curriculum_repo
        self._strand_service = strand_service
        self._at_risk_service = at_risk_service
        self._facilitator_scope_service = facilitator_scope_service

    async def get_dashboard(self, user: User, cohort_id: int, now: datetime) -> DashboardResponse:
        cohort = await self._get_cohort(user, cohort_id, now)
        strands = await self._strand_service.get_active_strands()
        members = await self._get_learners(cohort_id, CohortMemberStatus.ACTIVE, strands)

        # {strand_id: {lesson_id: [content_id, ...]}}: what counts in this cohort.
        curriculum_maps = await self._curriculum_repo.get_cohort_curriculum_maps([cohort_id])
        lessons_by_strand = curriculum_maps.get(cohort_id, {})

        reachable_content_ids = [
            content_id
            for strand in strands
            for content_ids in lessons_by_strand.get(strand.id, {}).values()
            for content_id in content_ids
        ]
        total, evaluated = 0, 0
        if reachable_content_ids:
            total, evaluated = await self._content_repo.get_library_counts(
                Content.id.in_(reachable_content_ids)
            )

        progress_by_strand = []
        for index, strand in enumerate(strands):
            figures = [member.strands[index] for member in members]
            average_percent, _ = mean(item.percent for item in figures)
            pretest_average, pretest_count = mean(item.pretest_mps for item in figures)
            posttest_average, posttest_count = mean(item.posttest_mps for item in figures)
            progress_by_strand.append(
                DashboardStrand(
                    strand_id=strand.id,
                    strand_code=strand.code,
                    strand_name=strand.name,
                    total_lessons=len(lessons_by_strand.get(strand.id, {})),
                    average_percent=average_percent,
                    completed_count=sum(1 for item in figures if item.percent == 100),
                    pretest=MpsAverage(average_mps=pretest_average, count=pretest_count),
                    posttest=PosttestAverage(
                        average_mps=posttest_average,
                        count=posttest_count,
                        mastery_count=sum(1 for item in figures if item.mastered),
                    ),
                )
            )

        average_progress, _ = mean(member.overall_progress for member in members)

        return DashboardResponse(
            cohort=self._to_cohort(cohort),
            learner_count=len(members),
            average_progress=average_progress,
            evaluation_coverage=EvaluationCoverage(evaluated=evaluated, total=total),
            progress_by_strand=progress_by_strand,
            at_risk=await self._get_dashboard_at_risk(cohort_id, members),
            generated_at=to_naive_utc(now),
        )

    async def get_cohort_summary(
        self,
        user: User,
        cohort_id: int,
        membership_status: MembershipStatusFilter,
        now: datetime,
    ) -> CohortSummaryResponse:
        cohort = await self._get_cohort(user, cohort_id, now)
        strands = await self._strand_service.get_active_strands()
        status = None if membership_status == "all" else CohortMemberStatus(membership_status)
        learners = await self._get_learners(cohort_id, status, strands)

        learner_ids = {learner.learner_id for learner in learners}
        lri_attempts = await self._lri_attempt_repo.get_latest_by_learner_ids(learner_ids)
        at_risk_reasons = await self._at_risk_service.get_active_reasons(
            {(learner_id, cohort_id) for learner_id in learner_ids}
        )

        def reasons_of(learner: LearnerFigures) -> list[AtRiskReason]:
            return at_risk_reasons.get((learner.learner_id, cohort_id), [])

        strand_totals = []
        for index, strand in enumerate(strands):
            figures = [learner.strands[index] for learner in learners]
            average_progress, _ = mean(item.percent for item in figures)
            pretest_average, pretest_count = mean(item.pretest_mps for item in figures)
            posttest_average, posttest_count = mean(item.posttest_mps for item in figures)
            gain_average, gain_count = mean(item.gain for item in figures)
            strand_totals.append(
                ReportStrandTotals(
                    strand_code=strand.code,
                    average_progress=average_progress,
                    pretest=MpsAverage(average_mps=pretest_average, count=pretest_count),
                    posttest=MpsAverage(average_mps=posttest_average, count=posttest_count),
                    gain=GainAverage(average=gain_average, count=gain_count),
                    mastery_count=sum(1 for item in figures if item.mastered),
                )
            )

        average_progress, _ = mean(learner.overall_progress for learner in learners)

        return CohortSummaryResponse(
            cohort=self._to_cohort(cohort),
            generated_at=to_naive_utc(now),
            thresholds=ReportThresholds(
                mps_mastery=AT_RISK_MPS_THRESHOLD,
                inactivity_days=AT_RISK_INACTIVITY_DAYS,
            ),
            learners=[
                ReportLearner(
                    learner_id=learner.learner_id,
                    id_no=learner.id_no,
                    first_name=learner.first_name,
                    last_name=learner.last_name,
                    membership_status=learner.membership.status,
                    overall_progress=learner.overall_progress,
                    last_active_at=learner.last_active_at,
                    lri_score=(
                        lri_attempts[learner.learner_id].lri_score
                        if learner.learner_id in lri_attempts
                        else None
                    ),
                    at_risk_reasons=reasons_of(learner),
                    strands=[
                        ReportLearnerStrand(
                            strand_code=item.strand.code,
                            progress_percent=item.percent,
                            completed_lessons=item.completed_lessons,
                            total_lessons=item.total_lessons,
                            pretest_mps=item.pretest_mps,
                            posttest_mps=item.posttest_mps,
                            gain=item.gain,
                            mastered=item.mastered,
                        )
                        for item in learner.strands
                    ],
                )
                for learner in learners
            ],
            totals=ReportTotals(
                learner_count=len(learners),
                average_progress=average_progress,
                at_risk=ReportAtRiskTotals(
                    learner_count=sum(1 for learner in learners if reasons_of(learner)),
                    by_reason=ReportAtRiskByReason(
                        **{
                            reason.value: sum(
                                1 for learner in learners if reason in reasons_of(learner)
                            )
                            for reason in AtRiskReason
                        }
                    ),
                ),
                strands=strand_totals,
            ),
        )

    async def _get_cohort(self, user: User, cohort_id: int, now: datetime) -> Cohort:
        """The cohort, once the caller's access is checked, with its flags
        brought up to date if it is active. The flags of any other cohort are
        left as they are."""
        # Checked before the cohort is looked up, so a denied caller gets the
        # same 403 whether or not the cohort exists.
        await self._facilitator_scope_service.assert_cohort_access(user, cohort_id)

        cohort = await self._cohort_repo.get_by_id(cohort_id)
        if cohort is None:
            raise CohortNotFoundError()

        if cohort.status == CohortStatus.ACTIVE:
            await self._at_risk_service.refresh([cohort_id], now)

        return cohort

    async def _get_learners(
        self,
        cohort_id: int,
        status: CohortMemberStatus | None,
        strands: list[LearningStrand],
    ) -> list[LearnerFigures]:
        """The cohort's memberships with their progress, test results, and last
        active time, by last name then first name. Each is looked up once for
        the whole cohort."""
        rows = await self._cohort_learner_repo.get_memberships_by_cohort_id(cohort_id, status)

        learner_ids = {membership.learner_id for membership, *_ in rows}
        progress = await self._strand_service.get_progress_batch(
            {(learner_id, cohort_id) for learner_id in learner_ids}
        )
        attempts = latest_attempts(await self._strand_attempt_repo.get_by_learner_ids(learner_ids))
        last_active = await self._learner_repo.get_last_active_by_ids(learner_ids)

        def mps(learner_id: int, strand_id: int, test_type: StrandTestType) -> float | None:
            attempt = attempts.get((learner_id, strand_id, test_type))
            if attempt is None:
                return None

            return compute_mps(attempt.total_score, attempt.item_count)

        # get_progress_batch lists the active strands in the same order as `strands`.
        return [
            LearnerFigures(
                membership=membership,
                id_no=id_no,
                first_name=first_name,
                last_name=last_name,
                strands=[
                    LearnerStrandFigures(
                        strand=strand,
                        completed_lessons=item.completed_lessons,
                        total_lessons=item.total_lessons,
                        percent=item.percent,
                        pretest_mps=mps(membership.learner_id, strand.id, StrandTestType.PRETEST),
                        posttest_mps=mps(membership.learner_id, strand.id, StrandTestType.POSTTEST),
                    )
                    for strand, item in zip(
                        strands, progress[(membership.learner_id, cohort_id)], strict=True
                    )
                ],
                last_active_at=last_active.get(membership.learner_id),
            )
            for membership, _, _, id_no, first_name, last_name in rows
        ]

    async def _get_dashboard_at_risk(
        self,
        cohort_id: int,
        members: list[LearnerFigures],
    ) -> DashboardAtRisk:
        flags_by_learner: dict[int, list[DashboardFlag]] = {}
        for flag in await self._at_risk_service.get_active_flags(cohort_id):
            flags_by_learner.setdefault(flag.learner.learner_id, []).append(
                DashboardFlag(
                    id=flag.id,
                    reason=flag.reason,
                    strand_code=flag.strand_code,
                    trigger_value=flag.trigger_value,
                    status=flag.status,
                    detected_at=flag.detected_at,
                )
            )

        learners = [
            DashboardAtRiskLearner(
                learner_id=member.learner_id,
                id_no=member.id_no,
                first_name=member.first_name,
                last_name=member.last_name,
                overall_progress=member.overall_progress,
                last_active_at=member.last_active_at,
                flags=flags_by_learner[member.learner_id],
            )
            for member in members
            if member.learner_id in flags_by_learner
        ]
        # Most flags first, then longest since last active; a learner who was
        # never active counts as longest. `members` is already in name order,
        # which the stable sort keeps for ties.
        learners.sort(key=lambda learner: (-len(learner.flags), learner.last_active_at or datetime.min))

        return DashboardAtRisk(
            learner_count=len(learners),
            flag_count=sum(len(learner.flags) for learner in learners),
            learners=learners,
        )

    @staticmethod
    def _to_cohort(cohort: Cohort) -> ReportCohort:
        return ReportCohort(
            id=cohort.id,
            name=cohort.name,
            code=cohort.code,
            school_year=cohort.school_year,
            status=cohort.status,
        )


# ================ CSV ================

# A spreadsheet runs a cell that starts with one of these as a formula.
FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


def csv_text(value: str | None) -> str:
    """A text cell, with a leading quote when a spreadsheet would otherwise
    run it as a formula. Numbers do not go through here."""
    if value is None:
        return ""

    return f"'{value}" if value.startswith(FORMULA_PREFIXES) else value


def csv_number(value: float | None) -> float | str:
    return "" if value is None else value


def cohort_summary_csv(summary: CohortSummaryResponse) -> bytes:
    """The report's learners as a CSV table: one row per learner in the same
    order, no totals. UTF-8 with a byte order mark, so Excel reads accented
    names correctly."""
    strand_codes = [strand.strand_code for strand in summary.totals.strands]

    header = ["ID Number", "Last Name", "First Name", "Membership Status", "Overall Progress (%)"]
    for code in strand_codes:
        header += [
            f"{code} Progress (%)",
            f"{code} Pretest MPS",
            f"{code} Posttest MPS",
            f"{code} Gain",
            f"{code} Mastered",
        ]
    header += ["LRI Score", "Last Active (PHT)", "At-Risk Reasons"]

    output = io.StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow([csv_text(cell) for cell in header])

    for learner in summary.learners:
        row = [
            csv_text(learner.id_no),
            csv_text(learner.last_name),
            csv_text(learner.first_name),
            csv_text(learner.membership_status.value),
            learner.overall_progress,
        ]
        for strand in learner.strands:
            row += [
                strand.progress_percent,
                csv_number(strand.pretest_mps),
                csv_number(strand.posttest_mps),
                csv_number(strand.gain),
                "" if strand.mastered is None else ("Yes" if strand.mastered else "No"),
            ]
        row += [
            csv_number(learner.lri_score),
            (
                (learner.last_active_at + MANILA_UTC_OFFSET).strftime("%Y-%m-%d %H:%M")
                if learner.last_active_at is not None
                else ""
            ),
            csv_text("; ".join(AT_RISK_REASON_LABELS[reason] for reason in learner.at_risk_reasons)),
        ]
        writer.writerow(row)

    return ("﻿" + output.getvalue()).encode("utf-8")


def cohort_summary_filename(summary: CohortSummaryResponse) -> str:
    """cohort-summary_<cohort code, or id>_<Manila date>.csv, keeping only
    letters, digits, dot, underscore, and hyphen."""
    label = re.sub(r"[^A-Za-z0-9._-]+", "-", summary.cohort.code or "").strip("-.")
    label = label or str(summary.cohort.id)

    return f"cohort-summary_{label}_{manila_date(summary.generated_at).isoformat()}.csv"
