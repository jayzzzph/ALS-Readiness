from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def create(self, user: User) -> User:
        self._session.add(user)

        await self._session.flush()
        await self._session.refresh(user)

        return user

    async def get_by_id(self, id: int) -> User | None:
        return await self._session.get(User, id)

    async def get_by_email(self, email: str) -> User | None:
        statement = select(User).where(User.email == email)
        result = await self._session.execute(statement)

        return result.scalar_one_or_none()

    async def get_by_id_no(self, id_no: str) -> User | None:
        statement = select(User).where(User.id_no == id_no)
        result = await self._session.execute(statement)

        return result.scalar_one_or_none()
    
    async def update(self, user: User, fields: dict[str, Any]) -> User:
        user.sqlmodel_update(fields)

        await self._session.flush()
        await self._session.refresh(user)

        return user
    
"""
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
"""