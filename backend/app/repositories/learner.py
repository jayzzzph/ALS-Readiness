from collections.abc import Collection
from datetime import datetime

from sqlalchemy import func, select

from app.models.learner import Learner
from app.models.learner_content_progress import LearnerContentProgress
from app.models.refresh_token import RefreshToken

from .base import BaseRepository


class LearnerRepository(BaseRepository[Learner]):
    model = Learner

    async def get_by_user_id(self, user_id: int) -> Learner | None:
        statement = select(Learner).where(Learner.user_id == user_id)
        result = await self._session.execute(statement)

        return result.scalar_one_or_none()

    async def get_last_active_by_ids(self, learner_ids: Collection[int]) -> dict[int, datetime]:
        """When each learner was last active, in one query (D5).

        The later of the learner's newest login or token refresh and the last
        time they opened any content. Learners with neither are absent.
        """
        if not learner_ids:
            return {}

        last_token = (
            select(func.max(RefreshToken.created_at))
            .where(RefreshToken.user_id == Learner.user_id)
            .scalar_subquery()
        )
        last_access = (
            select(func.max(LearnerContentProgress.last_accessed_at))
            .where(LearnerContentProgress.learner_id == Learner.id)
            .scalar_subquery()
        )
        # GREATEST skips nulls, and is null only when both are.
        statement = select(Learner.id, func.greatest(last_token, last_access)).where(
            Learner.id.in_(learner_ids)
        )
        result = await self._session.execute(statement)
        return {
            learner_id: last_active
            for learner_id, last_active in result.all()
            if last_active is not None
        }
