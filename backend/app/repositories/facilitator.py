from sqlalchemy.ext.asyncio import AsyncSession


class FacilitatorRepository:
    def __init__(self, session: AsyncSession):
        self._session = session