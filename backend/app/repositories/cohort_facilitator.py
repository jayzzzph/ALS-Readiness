from sqlalchemy import select

from app.models.cohort import CohortFacilitator
from app.models.facilitator import Facilitator
from app.models.user import User
from app.models.user_profile import UserProfile

from .base import BaseRepository


class CohortFacilitatorRepository(BaseRepository[CohortFacilitator]):
    model = CohortFacilitator

    async def get_by_cohort_id_and_facilitator_id(
        self,
        cohort_id: int,
        facilitator_id: int,
    ) -> CohortFacilitator | None:
        statement = select(CohortFacilitator).where(
            CohortFacilitator.cohort_id == cohort_id,
            CohortFacilitator.facilitator_id == facilitator_id,
        )
        result = await self._session.execute(statement)

        return result.scalar_one_or_none()

    async def get_all_by_cohort_id_with_profile(
        self, 
        cohort_id: int
    ) -> list[tuple[CohortFacilitator, UserProfile, str | None]]:
        """Rows are (assignment, profile, id_no), all from the one query."""
        statement = (
            select(CohortFacilitator, UserProfile, User.id_no)
            .join(Facilitator, Facilitator.id == CohortFacilitator.facilitator_id)
            .join(User, User.id == Facilitator.user_id)
            .join(UserProfile, UserProfile.user_id == User.id)
            .where(CohortFacilitator.cohort_id == cohort_id)
        )
        result = await self._session.execute(statement)
        return result.all()
