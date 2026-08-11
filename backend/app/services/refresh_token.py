from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID, uuid4

from app.core.constants import REFRESH_TOKEN_EXPIRE_DAYS
from app.core.exceptions.auth import InvalidRefreshTokenError
from app.core.exceptions.user import InactiveUserError, UserNotFoundError
from app.core.jwt import create_refresh_token, decode_refresh_token
from app.core.security import hash_refresh_token, verify_refresh_token
from app.enums.token import TokenType
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.repositories.refresh_token import RefreshTokenRepository
from app.services.user import UserService


class RefreshTokenService:
    def __init__(
        self,
        refresh_token_repository: RefreshTokenRepository,
        user_service: UserService,
    ):
        self._refresh_token_repository = refresh_token_repository
        self._user_service = user_service

    async def issue(self, user_id: int) -> str:
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

        jti = uuid4()

        payload = {
            "sub": str(user_id),
            "jti": str(jti),
            "iat": now,
            "exp": expires_at,
            "type": TokenType.REFRESH.value,
        }

        token = create_refresh_token(payload)
        hashed = hash_refresh_token(token)

        await self._refresh_token_repository.create(
            RefreshToken(
                user_id=user_id, token_hash=hashed, jti=jti, expires_at=expires_at
            )
        )

        return token

    async def validate(self, token: str) -> tuple[User, dict[str, Any]]:
        # Decode token
        payload = decode_refresh_token(token)

        token_type = TokenType(payload["type"])
        if token_type != TokenType.REFRESH:
            raise InvalidRefreshTokenError()

        # Retrieve from db
        jti = UUID(payload["jti"])
        stored = await self._refresh_token_repository.get_by_jti(jti)

        if stored is None:
            raise InvalidRefreshTokenError()

        # Verify if token matches db
        if not verify_refresh_token(token, stored.token_hash):
            raise InvalidRefreshTokenError()

        # Verify if user exists
        user_id = int(payload["sub"])
        try:
            user = await self._user_service.get_active_by_id(user_id)
        except (UserNotFoundError, InactiveUserError):
            raise InvalidRefreshTokenError()

        return user, payload

    async def rotate(self, token: str) -> tuple[User, str]:
        user, payload = await self.validate(token)

        jti = UUID(payload["jti"])
        await self.revoke(jti)

        new_token = await self.issue(user.id)
        return user, new_token

    async def revoke(self, jti: UUID):
        revoked_at = datetime.now(timezone.utc)
        await self._refresh_token_repository.revoke(jti, revoked_at)
