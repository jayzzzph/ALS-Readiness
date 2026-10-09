from datetime import datetime, timezone
from typing import Any

from app.core.exceptions import (
    CohortFacilitatorAlreadyExistsError,
    CohortFacilitatorNotFoundError,
)
from app.enums.cohort import CohortMemberStatus
from app.models.cohort import CohortFacilitator
from app.models.facilitator import Facilitator
from app.models.user_profile import UserProfile
from app.repositories.cohort_facilitator import CohortFacilitatorRepository
from app.services.facilitator import FacilitatorService


class CohortFacilitatorService:
    def __init__(
        self,
        cohort_facilitator_repo: CohortFacilitatorRepository,
        facilitator_service: FacilitatorService,
    ):
        self._cohort_facilitator_repo = cohort_facilitator_repo
        self._facilitator_service = facilitator_service

    async def create(
        self,
        admin_id: int,
        cohort_id: int,
        facilitator_id: int,
    ) -> CohortFacilitator:
        _ = await self._facilitator_service.get_by_id(facilitator_id)
        
        existing = (
            await self._cohort_facilitator_repo.get_by_cohort_id_and_facilitator_id(
                cohort_id, facilitator_id
            )
        )

        if existing:
            raise CohortFacilitatorAlreadyExistsError()

        cohort_facilitator = CohortFacilitator(
            assigned_by=admin_id,
            facilitator_id=facilitator_id,
            cohort_id=cohort_id,
        )

        created_cohort_facilitator = await self._cohort_facilitator_repo.create(
            cohort_facilitator
        )

        return created_cohort_facilitator

    async def get_all_by_cohort_id_with_profile(
        self, 
        cohort_id: int
    ) -> list[tuple[CohortFacilitator, UserProfile, str | None]]:
        return await (
            self._cohort_facilitator_repo.
            get_all_by_cohort_id_with_profile(
                cohort_id
            )
        )

    async def update_status(self, cohort_facilitator_id: int, status: CohortMemberStatus) -> CohortFacilitator:
        cohort_facilitator = await self._cohort_facilitator_repo.get_by_id(cohort_facilitator_id)

        if cohort_facilitator is None:
            raise CohortFacilitatorNotFoundError()

        fields: dict[str, Any] = {"status": status}
        if status == CohortMemberStatus.ENDED:
            # Keep the original time if the assignment had already ended.
            if cohort_facilitator.status != CohortMemberStatus.ENDED:
                fields["ended_at"] = datetime.now(timezone.utc)
        else:
            fields["ended_at"] = None

        return await self._cohort_facilitator_repo.update(cohort_facilitator, fields)
