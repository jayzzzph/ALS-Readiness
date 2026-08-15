from app.models.learner import Learner
from app.repositories.learner import LearnerRepository
from app.schemas.learner import LearnerCreate


class LearnerService:
    def __init__(self, learner_repository: LearnerRepository):
        self._learner_repository = learner_repository

    async def create(self, learner_create: LearnerCreate) -> Learner:
        return await self._learner_repository.create(
            Learner(**learner_create.model_dump()),
        )
