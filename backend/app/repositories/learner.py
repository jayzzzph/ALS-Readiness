from sqlalchemy.ext.asyncio import AsyncSession


class LearnerRepository:
    def __init__(self, session: AsyncSession):
        self._session = session
