from sqlalchemy.ext.asyncio import AsyncSession

from app.models.learner import Learner


class LearnerRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def create(self, learner: Learner) -> Learner:
        self._session.add(learner)

        await self._session.flush()
        await self._session.refresh(learner)

        return learner
