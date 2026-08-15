from app.models.user_profile import UserProfile
from app.repositories.user_profile import UserProfileRepository
from app.schemas.user_profile import UserProfileCreate


class UserProfileService:
    def __init__(self, profile_repository: UserProfileRepository):
        self._profile_repository = profile_repository

    # ============ Public Methods ============

    async def create(self, user_id: int, profile_create: UserProfileCreate) -> UserProfile:
        return await self._profile_repository.create(
            UserProfile(
                user_id=user_id,
                **profile_create.model_dump(),
            )
        )
        
    async def get_by_user_id(self):
        pass

    async def update(self):
        pass
