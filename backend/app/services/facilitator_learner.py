from datetime import datetime

from sqlalchemy import Row

from app.core.exceptions import CohortAccessDeniedError
from app.enums.cohort import CohortMemberStatus
from app.enums.strand_test import StrandTestType
from app.models.cohort import Cohort, CohortLearner
from app.models.strand_test_attempt import StrandTestAttempt
from app.models.user import User
from app.repositories.cohort_learner import CohortLearnerRepository
from app.repositories.learner import LearnerRepository
from app.repositories.lri_test_attempt import LRITestAttemptRepository
from app.repositories.participant_intake import ParticipantIntakeRepository
from app.repositories.search import normalize_search
from app.repositories.strand_test_attempt import StrandTestAttemptRepository
from app.schemas.facilitator_learner import (
    FacilitatorLearnerDetailResponse,
    FacilitatorLearnerListResponse,
    FacilitatorLearnerRow,
    LearnerIdentity,
    LearnerIntakeSummary,
    LearnerLriResult,
    LearnerMembership,
    LearnerProgress,
    LearnerStrandDetail,
    LearnerStrandProgress,
    MembershipStatusFilter,
    StrandTestResult,
)
from app.services.at_risk import AtRiskService
from app.services.facilitator_scope import FacilitatorScopeService
from app.services.learning_strand import LearningStrandService
from app.services.scoring import compute_mps, latest_attempts


class FacilitatorLearnerService:
    """The facilitator's read-only view of the learners in their cohorts.

    Which cohorts and learners the caller may see is decided by
    FacilitatorScopeService. Every query below is limited to those cohorts.
    """

    def __init__(
        self,
        cohort_learner_repo: CohortLearnerRepository,
        learner_repo: LearnerRepository,
        strand_attempt_repo: StrandTestAttemptRepository,
        lri_attempt_repo: LRITestAttemptRepository,
        participant_intake_repo: ParticipantIntakeRepository,
        strand_service: LearningStrandService,
        at_risk_service: AtRiskService,
        facilitator_scope_service: FacilitatorScopeService,
    ):
        self._at_risk_service = at_risk_service
        self._cohort_learner_repo = cohort_learner_repo
        self._learner_repo = learner_repo
        self._strand_attempt_repo = strand_attempt_repo
        self._lri_attempt_repo = lri_attempt_repo
        self._participant_intake_repo = participant_intake_repo
        self._strand_service = strand_service
        self._facilitator_scope_service = facilitator_scope_service

    async def get_list(
        self,
        user: User,
        *,
        cohort_id: int | None,
        school_year: str | None,
        membership_status: MembershipStatusFilter,
        search: str | None,
        at_risk: bool,
        page: int,
        page_size: int,
        now: datetime,
    ) -> FacilitatorLearnerListResponse:
        if cohort_id is not None:
            await self._facilitator_scope_service.assert_cohort_access(user, cohort_id)
            cohort_ids = [cohort_id]
        else:
            cohorts = await self._facilitator_scope_service.get_visible_cohorts(user)
            cohort_ids = [
                cohort.id
                for cohort in cohorts
                if school_year is None or cohort.school_year == school_year
            ]

        status = None if membership_status == "all" else CohortMemberStatus(membership_status)
        # Runs of spaces are collapsed so a full name matches however it is typed.
        search = normalize_search(search)

        # The at-risk filter reads the flags, so they are brought up to date
        # for every cohort in scope before the page is chosen.
        if at_risk:
            await self._at_risk_service.refresh(cohort_ids, now)

        rows = await self._cohort_learner_repo.get_membership_page(
            cohort_ids,
            status,
            search,
            offset=(page - 1) * page_size,
            limit=page_size,
            at_risk_only=at_risk,
        )
        total = await self._cohort_learner_repo.count_memberships(
            cohort_ids, status, search, at_risk_only=at_risk
        )

        # Everything below is looked up once for the whole page.
        learner_ids = {membership.learner_id for membership, *_ in rows}
        memberships = {(membership.learner_id, membership.cohort_id) for membership, *_ in rows}
        progress = await self._strand_service.get_progress_batch(memberships)
        last_active = await self._learner_repo.get_last_active_by_ids(learner_ids)

        # Without the filter only the cohorts on the page need their flags
        # brought up to date. The refresh skips the ones that are not active.
        if not at_risk:
            await self._at_risk_service.refresh({cohort.id for _, cohort, *_ in rows}, now)
        at_risk_reasons = await self._at_risk_service.get_active_reasons(memberships)

        items = [
            FacilitatorLearnerRow(
                learner_id=membership.learner_id,
                id_no=id_no,
                first_name=first_name,
                last_name=last_name,
                cohort_id=cohort.id,
                cohort_name=cohort.name,
                school_year=cohort.school_year,
                membership_status=membership.status,
                progress=[
                    LearnerStrandProgress(
                        strand_id=item.strand.id,
                        strand_code=item.strand.code,
                        completed_lessons=item.completed_lessons,
                        total_lessons=item.total_lessons,
                        percent=item.percent,
                    )
                    for item in progress[(membership.learner_id, membership.cohort_id)]
                ],
                last_active_at=last_active.get(membership.learner_id),
                at_risk_reasons=at_risk_reasons.get(
                    (membership.learner_id, membership.cohort_id), []
                ),
            )
            for membership, cohort, _, id_no, first_name, last_name in rows
        ]

        return FacilitatorLearnerListResponse(
            items=items, total=total, page=page, page_size=page_size
        )

    async def get_detail(
        self,
        user: User,
        learner_id: int,
        cohort_id: int | None,
        now: datetime,
    ) -> FacilitatorLearnerDetailResponse:
        # Checked before anything is looked up, so a learner outside the
        # caller's cohorts and a learner who does not exist get the same 403.
        await self._facilitator_scope_service.assert_learner_access(user, learner_id)

        cohort_ids = await self._facilitator_scope_service.get_visible_cohort_ids(user)
        rows = await self._cohort_learner_repo.get_memberships_by_learner_id(learner_id, cohort_ids)
        selected = self._select_membership(rows, cohort_id)

        membership, cohort, user_id, id_no, first_name, last_name = selected

        progress = await self._strand_service.get_progress(learner_id, cohort.id)
        attempts = await self._strand_attempt_repo.get_by_learner_ids([learner_id])
        lri_attempt = (await self._lri_attempt_repo.get_latest_by_learner_ids([learner_id])).get(
            learner_id
        )
        intake = (await self._participant_intake_repo.get_by_user_ids([user_id])).get(user_id)
        last_active = await self._learner_repo.get_last_active_by_ids([learner_id])

        # Brings the cohort's flags up to date first. The refresh does nothing
        # for a cohort that is not active.
        await self._at_risk_service.refresh([cohort.id], now)
        at_risk_flags = await self._at_risk_service.get_learner_flags(learner_id, cohort.id)

        results = latest_attempts(attempts)

        return FacilitatorLearnerDetailResponse(
            learner=LearnerIdentity(
                learner_id=learner_id,
                id_no=id_no,
                first_name=first_name,
                last_name=last_name,
            ),
            cohort=self._to_membership(membership, cohort),
            memberships=[
                self._to_membership(other, other_cohort)
                for other, other_cohort, *_ in rows
                if other.id != membership.id
            ],
            last_active_at=last_active.get(learner_id),
            strands=[
                LearnerStrandDetail(
                    strand_id=item.strand.id,
                    strand_code=item.strand.code,
                    strand_name=item.strand.name,
                    pretest=self._to_test_result(
                        results.get((learner_id, item.strand.id, StrandTestType.PRETEST))
                    ),
                    posttest=self._to_test_result(
                        results.get((learner_id, item.strand.id, StrandTestType.POSTTEST))
                    ),
                    progress=LearnerProgress(
                        completed_lessons=item.completed_lessons,
                        total_lessons=item.total_lessons,
                        percent=item.percent,
                    ),
                )
                for item in progress
            ],
            lri=(
                LearnerLriResult(
                    score=lri_attempt.lri_score,
                    submitted_at=lri_attempt.submitted_at,
                )
                if lri_attempt is not None
                else None
            ),
            intake=(
                LearnerIntakeSummary(
                    age=intake.age,
                    highest_educational_attainment=intake.highest_educational_attainment,
                    als_learning_strands=intake.als_learning_strands,
                    als_enrollment_months=intake.als_enrollment_months,
                    has_taken_ae_test=intake.has_taken_ae_test,
                    ae_test_attempt_count=intake.ae_test_attempt_count,
                    submitted_at=intake.submitted_at,
                )
                if intake is not None
                else None
            ),
            at_risk_flags=at_risk_flags,
        )

    @staticmethod
    def _select_membership(rows: list[Row], cohort_id: int | None) -> Row:
        """The membership the detail is shown for. `rows` are the learner's
        memberships in the caller's visible cohorts, most recent first."""
        if cohort_id is not None:
            # A cohort the caller cannot see and one the learner was never in
            # are denied alike.
            for row in rows:
                if row[0].cohort_id == cohort_id:
                    return row
            raise CohortAccessDeniedError()

        if not rows:
            raise CohortAccessDeniedError()

        for row in rows:
            if row[0].status == CohortMemberStatus.ACTIVE:
                return row
        return rows[0]

    @staticmethod
    def _to_membership(membership: CohortLearner, cohort: Cohort) -> LearnerMembership:
        return LearnerMembership(
            id=cohort.id,
            name=cohort.name,
            school_year=cohort.school_year,
            status=cohort.status,
            membership_status=membership.status,
            assigned_at=membership.assigned_at,
        )

    @staticmethod
    def _to_test_result(attempt: StrandTestAttempt | None) -> StrandTestResult | None:
        if attempt is None:
            return None

        return StrandTestResult(
            score=attempt.total_score,
            total_items=attempt.item_count,
            mps=compute_mps(attempt.total_score, attempt.item_count),
            submitted_at=attempt.taken_at,
        )
