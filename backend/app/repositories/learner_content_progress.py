from sqlalchemy import select

from app.models.learner_content_progress import LearnerContentProgress

from .base import BaseRepository


class LearnerContentProgressRepository(BaseRepository[LearnerContentProgress]):
    model = LearnerContentProgress

    async def get_by_learner_id_and_content_id(
        self,
        learner_id: int,
        content_id: int,
    ) -> LearnerContentProgress | None:
        statement = select(LearnerContentProgress).where(
            LearnerContentProgress.learner_id == learner_id,
            LearnerContentProgress.content_id == content_id,
        )
        result = await self._session.execute(statement)

        return result.scalar_one_or_none()
