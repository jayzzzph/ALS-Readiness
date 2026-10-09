from app.core.exceptions import CohortNotFoundError, InvalidCohortStatusError
from app.enums.cohort import CohortStatus
from app.models.cohort import Cohort, CohortFacilitator, CohortLearner
from app.repositories.cohort import CohortRepository
from app.schemas.cohort import (
    CohortCreate,
    CohortFacilitatorMemberResponse,
    CohortLearnerMemberResponse,
    CohortMemberProfile,
    CohortWithMembersResponse,
)
from app.services.cohort_facilitator import CohortFacilitatorService
from app.services.cohort_learner import CohortLearnerService
from app.services.facilitator_scope import FacilitatorScopeService
from app.models.user import User
from app.enums.user import UserRole

DIVISION_PREFIX = "CBY"


class CohortService:
    def __init__(
        self,
        cohort_repo: CohortRepository,
        cohort_learner_service: CohortLearnerService,
        cohort_facilitator_service: CohortFacilitatorService,
        facilitator_scope_service: FacilitatorScopeService,
    ) -> None:
        self._cohort_repo = cohort_repo
        self._cohort_learner_service = cohort_learner_service
        self._cohort_facilitator_service = cohort_facilitator_service
        self._facilitator_scope_service = facilitator_scope_service

    async def create(
        self,
        admin_id: int,
        cohort_create: CohortCreate,
    ) -> Cohort:
        cohort = Cohort(
            created_by=admin_id,
            name=cohort_create.name,
            school_year=cohort_create.school_year,
            start_date=cohort_create.start_date,
            end_date=cohort_create.end_date,
        )

        created_cohort = await self._cohort_repo.create(cohort)

        created_cohort.code = (
            f"{DIVISION_PREFIX}-{cohort_create.school_year}-{created_cohort.id:04d}"
        )

        return created_cohort

    async def get_list(
        self,
        status: CohortStatus | None = None,
        school_year: str | None = None,
    ) -> list[Cohort]:
        return await self._cohort_repo.get_list(status=status, school_year=school_year)

    async def update_status(self, cohort_id: int, status: CohortStatus) -> Cohort:
        cohort = await self._cohort_repo.get_by_id(cohort_id)

        if cohort is None:
            raise CohortNotFoundError()

        return await self._cohort_repo.update(cohort, {"status": status})

    async def get_by_id(self, cohort_id: int) -> Cohort:
        cohort = await self._cohort_repo.get_by_id(cohort_id)

        if cohort is None:
            raise CohortNotFoundError()

        return cohort

    async def get_active_by_id(self, cohort_id: int) -> Cohort:
        cohort = await self.get_by_id(cohort_id)

        if cohort.status in [CohortStatus.ARCHIVED, CohortStatus.COMPLETED]:
            raise InvalidCohortStatusError()

        return cohort

    async def assign_learner(
        self,
        admin_id: int,
        cohort_id: int,
        learner_id: int,
    ) -> CohortLearner:
        """Assigns a learner to the specified cohort and creates a cohort learner record"""

        # Check cohort is active
        _ = await self.get_active_by_id(cohort_id)

        # Create cohort learner
        cohort_learner = await self._cohort_learner_service.create(
            admin_id=admin_id,
            cohort_id=cohort_id,
            learner_id=learner_id,
        )

        return cohort_learner

    async def assign_facilitator(
            self,
            admin_id: int,
            cohort_id: int,
            facilitator_id: int,
        ) -> CohortFacilitator:
            """Assigns a facilitator to the specified cohort and creates a cohort learner record"""
    
            # Check cohort is active
            _ = await self.get_active_by_id(cohort_id)
    
            # Create cohort facilitator
            cohort_facilitator = await self._cohort_facilitator_service.create(
                admin_id=admin_id,
                cohort_id=cohort_id,
                facilitator_id=facilitator_id,
            )
    
            return cohort_facilitator

    async def get_cohort_with_members(self, user: User, cohort_id: int) -> CohortWithMembersResponse:
        # This roster carries full profiles, so its route is admin-only. The
        # scope check stays as a second line of defence, and runs before the
        # cohort is looked up so a denied caller cannot tell whether it exists.
        await self._facilitator_scope_service.assert_cohort_access(user, cohort_id)

        cohort = await self.get_by_id(cohort_id)

        cohort_facilitator_members = await (
            self._cohort_facilitator_service
            .get_all_by_cohort_id_with_profile(cohort_id) 
        )

        cohort_learner_members = await (
            self._cohort_learner_service
            .get_all_by_cohort_id_with_profile(cohort_id)
        )

        #  Cast values

        cohort_facilitator_members_response = [
            CohortFacilitatorMemberResponse(
                id=cohort_facilitator.id,
                cohort_id=cohort_facilitator.cohort_id,
                facilitator_id=cohort_facilitator.facilitator_id,
                status=cohort_facilitator.status,
                assigned_by=cohort_facilitator.assigned_by,
                assigned_at=cohort_facilitator.assigned_at,
                profile=CohortMemberProfile.model_validate(profile),
                id_no=id_no,
                ended_at=cohort_facilitator.ended_at,
            )
            for cohort_facilitator, profile, id_no in cohort_facilitator_members
        ]

        cohort_learner_members_response = [
            CohortLearnerMemberResponse(
                id=cohort_learner.id,
                cohort_id=cohort_learner.cohort_id,
                learner_id=cohort_learner.learner_id,
                status=cohort_learner.status,
                assigned_by=cohort_learner.assigned_by,
                assigned_at=cohort_learner.assigned_at,
                profile=CohortMemberProfile.model_validate(profile),
                id_no=id_no,
                # A membership's end is stored as completed_at.
                ended_at=cohort_learner.completed_at,
            )
            for cohort_learner, profile, id_no in cohort_learner_members
        ]

        return CohortWithMembersResponse(
            **cohort.model_dump(),
            facilitators=cohort_facilitator_members_response,
            learners=cohort_learner_members_response
        )

    async def get_cohorts_for_user(self, user: User) -> list[Cohort]:
        if user.role == UserRole.LEARNER:
            cohort = await self._cohort_repo.get_cohort_by_learner_user_id(user.id)
            return [cohort] if cohort else []
        
        elif user.role == UserRole.FACILITATOR:
            # Same rule as the facilitator endpoints: archived cohorts are hidden.
            return await self._facilitator_scope_service.get_visible_cohorts(user)

        else:
            # An admin is not a member of any cohort.
            return []
