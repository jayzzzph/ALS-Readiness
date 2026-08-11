from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.repositories.refresh_token import RefreshTokenRepository
from app.repositories.user import UserRepository
from app.services.auth import AuthService
from app.services.refresh_token import RefreshTokenService
from app.services.user import UserService

SessionDep = Annotated[AsyncSession, Depends(get_session)]


def get_user_repository(session: SessionDep) -> UserRepository:
    return UserRepository(session)


UserRepoDep = Annotated[
    UserRepository,
    Depends(get_user_repository),
]


def get_refresh_token_repository(session: SessionDep) -> RefreshTokenRepository:
    return RefreshTokenRepository(session)


RefreshTokenRepoDep = Annotated[
    RefreshTokenRepository,
    Depends(get_refresh_token_repository),
]


def get_user_service(user_repository: UserRepoDep) -> UserService:
    return UserService(
        user_repository=user_repository,
    )


UserServiceDep = Annotated[
    UserService,
    Depends(get_user_service),
]


def get_refresh_token_service(
    refresh_token_repository: RefreshTokenRepoDep,
    user_service: UserServiceDep,
) -> RefreshTokenService:
    return RefreshTokenService(
        refresh_token_repository=refresh_token_repository,
        user_service=user_service,
    )


RefreshTokenServiceDep = Annotated[
    RefreshTokenService,
    Depends(get_refresh_token_service),
]


def get_auth_service(
    user_repository: UserRepoDep,
    refresh_token_service: RefreshTokenServiceDep,
) -> AuthService:
    return AuthService(
        user_repository=user_repository,
        refresh_token_service=refresh_token_service,
    )


AuthServiceDep = Annotated[
    AuthService,
    Depends(get_auth_service),
]