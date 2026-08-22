from uuid import UUID

from app.core.constants import DUMMY_PASSWORD_HASH
from app.core.exceptions import (
    InactiveUserError,
    InvalidCredentialsError,
    InvalidRefreshTokenError,
    UserNotFoundError,
)
from app.core.jwt import issue_access_token
from app.core.security import verify_password
from app.models.user import User
from app.schemas.auth import AuthTokens, LoginRequest
from app.services.refresh_token import RefreshTokenService
from app.services.user import UserService


class AuthService:
    def __init__(
        self,
        user_service: UserService,
        refresh_token_service: RefreshTokenService,
    ):
        self._user_service = user_service
        self._refresh_token_service = refresh_token_service

    # ============ Public Methods ============

    async def login(self, credentials: LoginRequest) -> AuthTokens:
        user = await self._authenticate(credentials)

        access_token = issue_access_token(user.id)
        refresh_token = await self._refresh_token_service.issue(user.id)

        return AuthTokens(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    async def refresh(
        self,
        refresh_token: str,
    ) -> AuthTokens:       
        user, new_refresh_token = await self._refresh_token_service.rotate(refresh_token)
        new_access_token = issue_access_token(user.id)
        
        return AuthTokens(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
        )

    async def logout(self, refresh_token: str) -> None:
        if not refresh_token:
            return
        
        try:
            _, payload = await self._refresh_token_service.validate(refresh_token)
            await self._refresh_token_service.revoke(UUID(payload["jti"]))
        except InvalidRefreshTokenError:
            pass

    # ============ Private Methods ============

    async def _authenticate(self, credentials: LoginRequest) -> User:
        try:
            user = await self._user_service.get_active_by_id_no(credentials.id_no)
            password_hash = user.password_hash
        except (InactiveUserError, UserNotFoundError):
            password_hash = DUMMY_PASSWORD_HASH

        if not verify_password(credentials.password, password_hash):
            raise InvalidCredentialsError()

        return user
