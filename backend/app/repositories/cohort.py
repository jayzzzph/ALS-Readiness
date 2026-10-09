from sqlalchemy import select

from app.enums.cohort import CohortMemberStatus, CohortStatus
from app.models.cohort import Cohort, CohortFacilitator, CohortLearner
from app.models.facilitator import Facilitator
from app.models.learner import Learner
from app.models.user import User

from .base import BaseRepository


class CohortRepository(BaseRepository[Cohort]):
    model = Cohort

    async def get_list(
        self,
        status: CohortStatus | None = None,
        school_year: str | None = None,
    ) -> list[Cohort]:
        statement = select(Cohort)
        if status is not None:
            statement = statement.where(Cohort.status == status)
        if school_year is not None:
            statement = statement.where(Cohort.school_year == school_year)

        result = await self._session.execute(statement)
        return list(result.scalars().all())

    async def get_cohort_by_learner_user_id(self, user_id: int) -> Cohort | None:
        """The cohort of the learner's active membership. A learner has at most
        one (the one_active_cohort_per_learner index)."""
        statement = (
            select(Cohort)
            .join(CohortLearner, Cohort.id == CohortLearner.cohort_id)
            .join(Learner, Learner.id == CohortLearner.learner_id)
            .join(User, User.id == Learner.user_id)
            .where(
                User.id == user_id,
                CohortLearner.status == CohortMemberStatus.ACTIVE,
            )
        )

        result = await self._session.execute(statement)
        return result.scalar_one_or_none()

    async def get_cohort_by_facilitator_id(self, user_id: int) -> list[Cohort]:
        """The cohorts the facilitator is actively assigned to."""
        statement = (
            select(Cohort)
            .join(CohortFacilitator, Cohort.id == CohortFacilitator.cohort_id)
            .join(Facilitator, Facilitator.id == CohortFacilitator.facilitator_id)
            .join(User, User.id == Facilitator.user_id)
            .where(
                User.id == user_id,
                CohortFacilitator.status == CohortMemberStatus.ACTIVE,
            )
        )

        result = await self._session.execute(statement)
        return list(result.scalars().all())
