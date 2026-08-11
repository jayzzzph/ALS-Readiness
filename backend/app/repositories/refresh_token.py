from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def create(self, refresh_token: RefreshToken) -> RefreshToken:
        self._session.add(refresh_token)

        await self._session.flush()
        await self._session.refresh(refresh_token)

        return refresh_token

    async def get_by_jti(self, jti: UUID) -> RefreshToken | None:
        statement = select(RefreshToken).where(RefreshToken.jti == jti)

        result = await self._session.execute(statement)
        return result.scalar_one_or_none()

    async def revoke(self, jti: UUID, revoked_at: datetime) -> None:

        refresh_token = await self.get_by_jti(jti)

        refresh_token.is_revoked = True
        refresh_token.revoked_at = revoked_at 

        await self._session.flush()
