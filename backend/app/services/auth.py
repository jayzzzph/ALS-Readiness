from uuid import UUID

from fastapi import Request, Response

from app.core.constants import REFRESH_TOKEN_EXPIRE_DAYS
from app.core.exceptions.auth import InvalidCredentialsError, InvalidRefreshTokenError
from app.core.jwt import issue_access_token
from app.core.security import verify_password
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.refresh_token import RefreshTokenService


class AuthService:
    def __init__(
        self,
        user_repository: UserRepository,
        refresh_token_service: RefreshTokenService,
    ):
        self._user_repository = user_repository
        self._refresh_token_service = refresh_token_service

    # ============ Public Methods ============

    async def signup(self):
        pass

    async def login(self, credentials: LoginRequest) -> tuple[str, str]:
        user = await self._authenticate(credentials)

        access_token = issue_access_token(user.id)
        refresh_token = await self._refresh_token_service.issue(user.id)

        return access_token, refresh_token

    async def refresh(
        self,
        refresh_token: str,
    ) -> TokenResponse:       
        user, new_refresh_token = await self._refresh_token_service.rotate(refresh_token)
        new_access_token = issue_access_token(user.id)
        
        return new_access_token, new_refresh_token

    async def logout(self, refresh_token: str) -> None:
        if refresh_token:
            try:
                _, payload = await self._refresh_token_service.validate(refresh_token)
                await self._refresh_token_service.revoke(UUID(payload["jti"]))
            except InvalidRefreshTokenError:
                pass

    # ============ Private Methods ============

    async def _authenticate(self, credentials: LoginRequest) -> User:
        user = await self._user_repository.get_by_email(credentials.email)

        if user is None or not user.is_active:
            raise InvalidCredentialsError()

        if not verify_password(credentials.password, user.password_hash):
            raise InvalidCredentialsError()

        return user
