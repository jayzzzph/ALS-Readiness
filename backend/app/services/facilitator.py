from app.models.facilitator import Facilitator
from app.repositories.facilitator import FacilitatorRepository
from app.schemas.facilitator import FacilitatorCreate


class FacilitatorService:
    def __init__(self, facilitator_repository: FacilitatorRepository):
        self._facilitator_repository = facilitator_repository

    async def create(self, facilitator_create: FacilitatorCreate) -> Facilitator:
        return await self._facilitator_repository.create(
            Facilitator(**facilitator_create.model_dump()),
        )
