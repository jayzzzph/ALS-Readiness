from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import InvalidAccessTokenError, UnauthorizedError
from app.core.jwt import decode_access_token
from app.db.session import get_session
from app.enums.user import UserRole
from app.models.user import User
from app.repositories.facilitator import FacilitatorRepository
from app.repositories.learner import LearnerRepository
from app.repositories.refresh_token import RefreshTokenRepository
from app.repositories.user import UserRepository
from app.repositories.user_profile import UserProfileRepository
from app.services.admin import AdminService
from app.services.auth import AuthService
from app.services.facilitator import FacilitatorService
from app.services.learner import LearnerService
from app.services.refresh_token import RefreshTokenService
from app.services.user import UserService
from app.services.user_profile import UserProfileService

SessionDep = Annotated[AsyncSession, Depends(get_session)]


# ================ Repositories ================


def get_user_repository(session: SessionDep) -> UserRepository:
    return UserRepository(session)


UserRepositoryDep = Annotated[UserRepository, Depends(get_user_repository)]


def get_refresh_token_repository(session: SessionDep) -> RefreshTokenRepository:
    return RefreshTokenRepository(session)


RefreshTokenRepositoryDep = Annotated[
    RefreshTokenRepository, Depends(get_refresh_token_repository)
]


def get_profile_repository(session: SessionDep) -> UserProfileRepository:
    return UserProfileRepository(session)


ProfileRepositoryDep = Annotated[UserProfileRepository, Depends(get_profile_repository)]


def get_learner_repository(session: SessionDep) -> LearnerRepository:
    return LearnerRepository(session)


LearnerRepositoryDep = Annotated[LearnerRepository, Depends(get_learner_repository)]


def get_facilitator_repository(session: SessionDep) -> FacilitatorRepository:
    return FacilitatorRepository(session)


FacilitatorRepositoryDep = Annotated[
    FacilitatorRepository, Depends(get_facilitator_repository)
]

# ================== Services ==================


def get_user_service(user_repository: UserRepositoryDep) -> UserService:
    return UserService(
        user_repository=user_repository,
    )


UserServiceDep = Annotated[UserService, Depends(get_user_service)]


def get_refresh_token_service(
    refresh_token_repository: RefreshTokenRepositoryDep,
    user_service: UserServiceDep,
) -> RefreshTokenService:
    return RefreshTokenService(
        refresh_token_repository=refresh_token_repository,
        user_service=user_service,
    )


RefreshTokenServiceDep = Annotated[
    RefreshTokenService, Depends(get_refresh_token_service)
]


def get_auth_service(
    user_service: UserServiceDep,
    refresh_token_service: RefreshTokenServiceDep,
) -> AuthService:
    return AuthService(
        user_service=user_service,
        refresh_token_service=refresh_token_service,
    )


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]


def get_profile_service(profile_repository: ProfileRepositoryDep) -> UserProfileService:
    return UserProfileService(profile_repository)


ProfileServiceDep = Annotated[UserProfileService, Depends(get_profile_service)]


def get_learner_service(learner_repository: LearnerRepositoryDep) -> LearnerService:
    return LearnerService(learner_repository)


LearnerServiceDep = Annotated[LearnerService, Depends(get_learner_service)]


def get_facilitator_service(
    facilitator_repository: FacilitatorRepositoryDep,
) -> FacilitatorService:
    return FacilitatorService(facilitator_repository)


FacilitatorServiceDep = Annotated[FacilitatorService, Depends(get_learner_service)]


def get_admin_service(
    user_service: UserServiceDep,
    profile_service: ProfileServiceDep,
    learner_service: LearnerServiceDep,
    facilitator_service: FacilitatorServiceDep,
) -> AdminService:
    return AdminService(
        user_service=user_service,
        profile_service=profile_service,
        learner_service=learner_service,
        facilitator_service=facilitator_service,
    )


AdminServiceDep = Annotated[AdminService, Depends(get_admin_service)]


# ================== Authorization ==================

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    user_service: UserServiceDep,
) -> User:
    payload = decode_access_token(token)

    try:
        user_id = int(payload.get("sub"))
    except (KeyError, TypeError, ValueError):
        raise InvalidAccessTokenError()
    
    return await user_service.get_active_by_id(user_id)


CurrentUserDep = Annotated[User, Depends(get_current_user)]


async def require_admin(current_user: CurrentUserDep) -> User:
    user_role = UserRole(current_user.role)
    if user_role != UserRole.ADMIN:
        raise UnauthorizedError()

    return current_user


RequireAdminDep = Annotated[User, Depends(require_admin)]
