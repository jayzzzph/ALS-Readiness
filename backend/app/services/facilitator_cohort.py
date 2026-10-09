from app.core.exceptions import CohortNotFoundError
from app.enums.cohort import CohortStatus
from app.models.cohort import Cohort
from app.models.user import User
from app.repositories.cohort import CohortRepository
from app.repositories.cohort_learner import CohortLearnerRepository
from app.schemas.facilitator_cohort import (
    FacilitatorCohortDetailResponse,
    FacilitatorCohortItem,
    FacilitatorCohortListResponse,
    FacilitatorRosterRow,
    FacilitatorSchoolYearsResponse,
)
from app.services.facilitator_scope import FacilitatorScopeService

# Listing order: the cohorts a facilitator is working with now come first.
COHORT_STATUS_ORDER = {
    CohortStatus.ACTIVE: 0,
    CohortStatus.UPCOMING: 1,
    CohortStatus.COMPLETED: 2,
}


class FacilitatorCohortService:
    """The facilitator's read-only view of their own cohorts."""

    def __init__(
        self,
        cohort_repo: CohortRepository,
        cohort_learner_repo: CohortLearnerRepository,
        facilitator_scope_service: FacilitatorScopeService,
    ):
        self._cohort_repo = cohort_repo
        self._cohort_learner_repo = cohort_learner_repo
        self._facilitator_scope_service = facilitator_scope_service

    async def get_school_years(self, user: User) -> FacilitatorSchoolYearsResponse:
        cohorts = await self._facilitator_scope_service.get_visible_cohorts(user)

        # YYYY-YYYY sorts chronologically as text.
        school_years = sorted({cohort.school_year for cohort in cohorts}, reverse=True)
        active_school_years = sorted(
            {cohort.school_year for cohort in cohorts if cohort.status == CohortStatus.ACTIVE},
            reverse=True,
        )

        # "Current" is where the facilitator is working now: the newest year
        # with an active cohort, else the newest year they have at all. It is
        # not derived from today's date.
        if active_school_years:
            current = active_school_years[0]
        elif school_years:
            current = school_years[0]
        else:
            current = None

        return FacilitatorSchoolYearsResponse(school_years=school_years, current=current)

    async def get_cohorts(
        self,
        user: User,
        school_year: str | None = None,
    ) -> FacilitatorCohortListResponse:
        cohorts = await self._facilitator_scope_service.get_visible_cohorts(user)
        if school_year is not None:
            cohorts = [cohort for cohort in cohorts if cohort.school_year == school_year]

        learner_counts = await self._cohort_learner_repo.count_active_by_cohort_ids(
            [cohort.id for cohort in cohorts]
        )

        cohorts.sort(
            key=lambda cohort: (COHORT_STATUS_ORDER[cohort.status], cohort.name.casefold())
        )
        items = [
            self._to_item(cohort, learner_counts.get(cohort.id, 0))
            for cohort in cohorts
        ]

        return FacilitatorCohortListResponse(items=items, total=len(items))

    async def get_cohort_detail(
        self,
        user: User,
        cohort_id: int,
    ) -> FacilitatorCohortDetailResponse:
        # Checked before the cohort is looked up, so a denied caller gets the
        # same 403 whether or not the cohort exists.
        await self._facilitator_scope_service.assert_cohort_access(user, cohort_id)

        cohort = await self._cohort_repo.get_by_id(cohort_id)
        if cohort is None:
            raise CohortNotFoundError()

        learner_counts = await self._cohort_learner_repo.count_active_by_cohort_ids([cohort_id])
        roster_rows = await self._cohort_learner_repo.get_roster_by_cohort_id(cohort_id)

        roster = [
            FacilitatorRosterRow(
                learner_id=membership.learner_id,
                id_no=id_no,
                first_name=first_name,
                last_name=last_name,
                status=membership.status,
                assigned_at=membership.assigned_at,
            )
            for membership, id_no, first_name, last_name in roster_rows
        ]

        item = self._to_item(cohort, learner_counts.get(cohort_id, 0))
        return FacilitatorCohortDetailResponse(**item.model_dump(), roster=roster)

    @staticmethod
    def _to_item(cohort: Cohort, learner_count: int) -> FacilitatorCohortItem:
        return FacilitatorCohortItem(
            id=cohort.id,
            name=cohort.name,
            code=cohort.code,
            school_year=cohort.school_year,
            status=cohort.status,
            start_date=cohort.start_date,
            end_date=cohort.end_date,
            learner_count=learner_count,
        )
