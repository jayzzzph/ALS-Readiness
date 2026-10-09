from sqlalchemy import select

from app.enums.eeg_session import EEGSessionType
from app.models.eeg_session import EEGSession

from .base import BaseRepository


class EEGSessionRepository(BaseRepository[EEGSession]):
    model = EEGSession

    async def list_by_learner_id(self, learner_id: int) -> list[EEGSession]:
        statement = select(EEGSession).where(EEGSession.learner_id == learner_id)
        result = await self._session.execute(statement)

        return result.scalars().all()

    async def get_by_learner_id_and_type(self, learner_id: int, type: EEGSessionType,) -> EEGSessionType | None:
        statement = select(EEGSession).where(
            EEGSession.learner_id == learner_id,
            EEGSession.type == type,
        )
        result = await self._session.execute(statement)

        return result.scalar_one_or_none()