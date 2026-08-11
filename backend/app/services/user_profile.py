from app.repositories.user_profile import UserProfileRepository
from app.schemas.user_profile import UserProfileCreate


class UserProfileService:
    def __init__(self, profile_repository: UserProfileRepository):
        self._profile_repository = profile_repository

    # ============ Public Methods ============

    async def create(self, user_id: int, data: UserProfileCreate):
        existing = self._profile_repository.get_by_user_id(user_id)

        if existing is not None:
            pass


    async def get_by_user_id(self):
        pass

    async def update(self):
        pass

    # ============ Public Methods ============

    async def _get_or_raise(self, user_id: int):
        pass
