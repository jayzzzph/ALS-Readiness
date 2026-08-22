from app.enums.user import UserRole
from app.models.user import User
from app.schemas.admin import (
    AdminFacilitatorCreate,
    AdminLearnerCreate,
    AdminUserCreateResponse,
)
from app.schemas.facilitator import FacilitatorCreate
from app.schemas.learner import LearnerCreate
from app.schemas.user import UserCreate, UserPasswordUpdate
from app.schemas.user_profile import UserProfileCreate, UserProfileResponse

from .facilitator import FacilitatorService
from .learner import LearnerService
from .user import UserService
from .user_profile import UserProfileService


class AdminService:
    def __init__(
        self,
        user_service: UserService,
        profile_service: UserProfileService,
        learner_service: LearnerService,
        facilitator_service: FacilitatorService,
    ):
        self._user_service = user_service
        self._profile_service = profile_service
        self._learner_service = learner_service
        self._facilitator_service = facilitator_service

    async def create_learner(self, learner_create: AdminLearnerCreate) -> AdminUserCreateResponse:
        # Create user and get a system generated password
        user, password = await self._user_service.create(
            UserCreate(role=UserRole.LEARNER)
        )

        # Create learner entity
        _ = await self._learner_service.create(LearnerCreate(user_id=user.id))

        profile = await self._profile_service.create(
            user_id=user.id,
            profile_create=UserProfileCreate(
                **learner_create.model_dump()
            )
        )

        # Create profile entity
        return AdminUserCreateResponse(
            user_id=user.id,
            id_no=user.id_no,
            password=password,
            role=user.role,
            is_active=user.is_active,
            profile=UserProfileResponse(
                first_name=profile.first_name,
                last_name=profile.last_name,
                middle_name=profile.middle_name,
            ),
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

    async def create_facilitator(self, facilitator_create: AdminFacilitatorCreate) -> AdminUserCreateResponse:
        # Create user and get a system generated password
        user, password = await self._user_service.create(
            UserCreate(role=UserRole.FACILITATOR)
        )

        # Create facilitator entity
        _ = await self._facilitator_service.create(FacilitatorCreate(user_id=user.id))

        # Create profile entity
        profile = await self._profile_service.create(
            user_id=user.id,
            profile_create=UserProfileCreate(
                **facilitator_create.model_dump()
            )
        )

        return AdminUserCreateResponse(
            user_id=user.id,
            id_no=user.id_no,
            password=password,
            role=user.role,
            is_active=user.is_active,
            profile=UserProfileResponse(
                first_name=profile.first_name,
                last_name=profile.last_name,
                middle_name=profile.middle_name,
            ),
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

    async def update_user_password(self, user_id: int, user_update: UserPasswordUpdate) -> User:
        stored = await self._user_service.get_active_by_id(user_id)

        user = await self._user_service.update_password(stored, user_update)
        return user

    async def deactivate_user(self, user_id: int) -> User:
        stored = await self._user_service.get_active_by_id(user_id)

        user = await self._user_service.deactivate(stored)
        return user

    async def activate_user(self, user_id: int) -> User:
        stored = await self._user_service.get_active_by_id(user_id)

        user = await self._user_service.deactivate(stored)
        return user
