from app.models.eeg_session import EEGSession
from app.repositories.eeg_session import EEGSessionRepository
from app.repositories.learner import LearnerRepository
from app.schemas.eeg_session import EEGSessionCreate
from app.core.exceptions import LearnerNotFoundError


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
        learner = await self._learner_repo.get_by_user_id(user_id)

        if learner is None:
            raise LearnerNotFoundError()

        eeg_session = EEGSession(
            learner_id=learner.id,
            file_key=session_create.file_key,
            type=session_create.type,
            recorded_at=session_create.recorded_at,
        )

        return self._session_repo.create(eeg_session)
