from app.core.exceptions import (
    EEGSessionTypeAlreadyExists,
    LearnerNotFoundError,
    StorageServiceFileNotFoundError,
)
from app.models.eeg_session import EEGSession
from app.repositories.eeg_session import EEGSessionRepository
from app.repositories.learner import LearnerRepository
from app.schemas.eeg_session import EEGSessionCreate
from app.storage import file_exists


class EEGSessionService:
    def __init__(
        self,
        session_repo: EEGSessionRepository,
        learner_repo: LearnerRepository,
    ) -> None:
        self._session_repo = session_repo
        self._learner_repo = learner_repo

    async def create_eeg_session(
        self,
        user_id: int,
        session_create: EEGSessionCreate,
    ) -> EEGSession:
        if not file_exists(session_create.file_key):
            raise StorageServiceFileNotFoundError()
        
        learner = await self._learner_repo.get_by_user_id(user_id)

        if learner is None:
            raise LearnerNotFoundError()

        existing = await self._session_repo.get_by_learner_id_and_type(
            learner.id, 
            session_create.type,
        )

        if existing:
            raise EEGSessionTypeAlreadyExists()

        eeg_session = EEGSession(
            learner_id=learner.id,
            file_key=session_create.file_key,
            type=session_create.type,
            recorded_at=session_create.recorded_at,
        )

        return await self._session_repo.create(eeg_session)

    async def list_eeg_sessions_for_user(self, user_id: int) -> list[EEGSession]:
        learner = await self._learner_repo.get_by_user_id(user_id)

        if learner is None:
            raise LearnerNotFoundError()

        return await self._session_repo.list_by_learner_id(learner.id)
