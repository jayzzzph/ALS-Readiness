from sqlalchemy.ext.asyncio import AsyncSession

from app.models.facilitator import Facilitator


class FacilitatorRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def create(self, facilitator: Facilitator) -> Facilitator:
        self._session.add(facilitator)

        await self._session.flush()
        await self._session.refresh(facilitator)

        return facilitator
