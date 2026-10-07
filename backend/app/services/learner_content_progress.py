from app.core.exceptions import (
    ContentProgressAlreadyExistsError,
    ContentProgressNotFoundError,
)
from app.models.learner_content_progress import LearnerContentProgress
from app.repositories.learner_content_progress import LearnerContentProgressRepository
from app.schemas.learner_content_progress import (
    ContentProgressCreate,
    ContentProgressUpdate,
)
from app.services.content import ContentService
from app.services.learner import LearnerService


class LearnerContentProgressService:
    def __init__(
        self,
        progress_repo: LearnerContentProgressRepository,
        learner_service: LearnerService,
        content_service: ContentService,
    ) -> None:
        self._progress_repo = progress_repo
        self._learner_service = learner_service
        self._content_service = content_service

    async def create_progress(
        self,
        user_id: int,
        content_id: int,
        progress_create: ContentProgressCreate,
    ):
        learner = await self._learner_service.get_by_user_id(user_id)
        existing = await self._progress_repo.get_by_learner_id_and_content_id(
            learner.id,
            content_id,
        )

        if existing:
            raise ContentProgressAlreadyExistsError()

        return await self._progress_repo.create(
            LearnerContentProgress(
                learner_id=learner.id,
                content_id=content_id,
                last_accessed_at=progress_create.last_accessed_at,
            )
        )

    async def update_progress(
        self,
        user_id: int,
        content_id: int,
        progress_update: ContentProgressUpdate,
    ):
        content_progress = await self.get_progress_by_learner_and_content(
            user_id,
            content_id,
        )

        return await self._progress_repo.update(
            content_progress,
            progress_update.model_dump(
                exclude_unset=True,
                exclude_none=True,
            ),
        )

    async def get_progress_by_learner_and_content(
        self,
        user_id: int,
        content_id: int,
    ) -> LearnerContentProgress:
        learner = await self._learner_service.get_by_user_id(user_id)
        content = await self._content_service.get_active_content_by_id(content_id)

        content_progress = await self._progress_repo.get_by_learner_id_and_content_id(
            learner.id,
            content.id,
        )

        if content_progress is None:
            raise ContentProgressNotFoundError()

        return content_progress
