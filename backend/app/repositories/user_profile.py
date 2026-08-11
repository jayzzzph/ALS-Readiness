from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_profile import UserProfile
from app.schemas.user_profile import UserProfileUpdate


class UserProfileRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def create(self, user_profile: UserProfile) -> UserProfile:
        self._session.add(user_profile)

        await self._session.commit()
        await self._session.refresh(user_profile)

        return user_profile

    async def update(
        self,
        user_profile: UserProfile,
        data: UserProfileUpdate,
    ) -> UserProfile:
        user_profile.sqlmodel_update(
            data.model_dump(exclude_unset=True)
        )
        
        await self._session.commit()
        await self._session.refresh(user_profile)
        return user_profile

    async def get_by_user_id(self, user_id: int) -> UserProfile | None:
        return await self._session.get(UserProfile, user_id)
