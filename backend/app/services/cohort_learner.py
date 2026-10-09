from datetime import datetime, timezone
from typing import Any

from sqlalchemy.exc import IntegrityError

from app.core.exceptions import (
    CohortLearnerAlreadyExistsError,
    CohortLearnerNotFoundError,
    LearnerAlreadyInActiveCohortError,
    LearnerNotInCohortError,
)
from app.enums.cohort import CohortMemberStatus
from app.models.cohort import CohortLearner
from app.models.user_profile import UserProfile
from app.repositories.cohort_learner import CohortLearnerRepository
from app.services.learner import LearnerService


class CohortLearnerService:
    def __init__(
        self,
        cohort_learner_repo: CohortLearnerRepository,
        learner_service: LearnerService,
    ):
        self._cohort_learner_repo = cohort_learner_repo
        self._learner_service = learner_service

    async def create(
        self,
        admin_id: int,
        cohort_id: int,
        learner_id: int,
    ) -> CohortLearner:
        _ = await self._learner_service.get_by_id(learner_id)

        existing = await self._cohort_learner_repo.get_by_cohort_id_and_learner_id(
            cohort_id, learner_id
        )

        if existing:
            raise CohortLearnerAlreadyExistsError()

        # One active cohort per learner. The partial unique index is the
        # backstop; this check is what makes the failure a clean 409.
        active = await self._cohort_learner_repo.get_active_by_learner_id(learner_id)
        if active is not None:
            raise LearnerAlreadyInActiveCohortError()

        cohort_learner = CohortLearner(
            assigned_by=admin_id,
            learner_id=learner_id,
            cohort_id=cohort_id,
        )

        try:
            created_cohort_learner = await self._cohort_learner_repo.create(cohort_learner)
        except IntegrityError:
            # A concurrent assignment got past the check above; the
            # one_active_cohort_per_learner index rejected this one.
            raise LearnerAlreadyInActiveCohortError() from None

        return created_cohort_learner

    async def get_all_by_cohort_id_with_profile(
        self,
        cohort_id: int,
    ) -> list[tuple[CohortLearner, UserProfile, str | None]]:
        return await (
            self._cohort_learner_repo
            .get_all_by_cohort_id_with_profile(cohort_id)
        )

    async def update_status(self, cohort_learner_id: int, status: CohortMemberStatus) -> CohortLearner:
        cohort_learner = await self._cohort_learner_repo.get_by_id(cohort_learner_id)

        if cohort_learner is None:
            raise CohortLearnerNotFoundError()

        reactivating = (
            status == CohortMemberStatus.ACTIVE
            and cohort_learner.status != CohortMemberStatus.ACTIVE
        )
        if reactivating:
            # Same rule as assigning: one active cohort per learner.
            active = await self._cohort_learner_repo.get_active_by_learner_id(
                cohort_learner.learner_id
            )
            if active is not None:
                raise LearnerAlreadyInActiveCohortError()

        fields: dict[str, Any] = {"status": status}
        if status == CohortMemberStatus.ENDED:
            # Keep the original time if the membership had already ended.
            if cohort_learner.status != CohortMemberStatus.ENDED:
                fields["completed_at"] = datetime.now(timezone.utc)
        else:
            fields["completed_at"] = None

        try:
            return await self._cohort_learner_repo.update(cohort_learner, fields)
        except IntegrityError:
            # A concurrent change got past the check above; the
            # one_active_cohort_per_learner index rejected this one.
            raise LearnerAlreadyInActiveCohortError() from None

    async def get_active_by_learner_id(self, learner_id: int) -> CohortLearner:
        cohort_learner = await self._cohort_learner_repo.get_active_by_learner_id(learner_id)

        if cohort_learner is None:
            raise LearnerNotInCohortError()

        return cohort_learner
