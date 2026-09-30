from app.core.constants import DEFAULT_RESET_PASSWORD
from app.core.exceptions import (
    InactiveUserError,
    NotAnAdminError,
    PasswordNotAllowedError,
    PasswordRequiredError,
    SelfApprovalError,
    SelfPasswordResetNotAllowedError,
    UnauthorizedError,
    UserAlreadyActiveError,
)
from app.enums.user import UserRole
from app.models.user import User
from app.schemas.admin import (
    AdminAdminCreate,
    AdminFacilitatorCreate,
    AdminLearnerCreate,
    AdminUserCreateResponse,
    AdminUserListItem,
    AdminUserListResponse,
)
from app.schemas.facilitator import FacilitatorCreate
from app.schemas.learner import LearnerCreate
from app.schemas.user import UserCreate, UserPasswordUpdate
from app.schemas.user_profile import UserProfileCreate, UserProfileResponse

from .facilitator import FacilitatorService
from .learner import LearnerService
from .refresh_token import RefreshTokenService
from .user import UserService
from .user_profile import UserProfileService


class AdminService:
    def __init__(
        self,
        user_service: UserService,
        profile_service: UserProfileService,
        learner_service: LearnerService,
        facilitator_service: FacilitatorService,
        refresh_token_service: RefreshTokenService,
    ):
        self._user_service = user_service
        self._profile_service = profile_service
        self._learner_service = learner_service
        self._facilitator_service = facilitator_service
        self._refresh_token_service = refresh_token_service

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
                user_id=profile.user_id,
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
                user_id=profile.user_id,
                first_name=profile.first_name,
                last_name=profile.last_name,
                middle_name=profile.middle_name,
            ),
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

    async def create_admin(self, admin_create: AdminAdminCreate) -> AdminUserCreateResponse:
        # Create user and get a system generated password. New admins stay
        # inactive until a super admin approves them.
        user, password = await self._user_service.create(
            UserCreate(role=UserRole.ADMIN, is_active=False)
        )

        # No marker table for admins - just a users row + a user_profiles row
        profile = await self._profile_service.create(
            user_id=user.id,
            profile_create=UserProfileCreate(
                **admin_create.model_dump()
            )
        )

        return AdminUserCreateResponse(
            user_id=user.id,
            id_no=user.id_no,
            password=password,
            role=user.role,
            is_active=user.is_active,
            profile=UserProfileResponse(
                user_id=profile.user_id,
                first_name=profile.first_name,
                last_name=profile.last_name,
                middle_name=profile.middle_name,
            ),
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

    async def list_users(
        self,
        role: UserRole | None,
        is_active: bool | None,
        page: int,
        page_size: int,
    ) -> AdminUserListResponse:
        rows, total = await self._user_service.list_with_profiles(
            page=page,
            page_size=page_size,
            role=role,
            is_active=is_active,
        )

        items = [
            AdminUserListItem(
                id=user.id,
                id_no=user.id_no,
                role=user.role,
                is_active=user.is_active,
                first_name=profile.first_name if profile else None,
                last_name=profile.last_name if profile else None,
                created_at=user.created_at,
            )
            for user, profile in rows
        ]

        return AdminUserListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
        )

    async def update_user_password(
        self,
        user_id: int,
        user_update: UserPasswordUpdate | None,
        resetter: User,
    ) -> User:
        # Even a super admin resets their own password via /users/me/password.
        if user_id == resetter.id:
            raise SelfPasswordResetNotAllowedError()

        stored = await self._user_service.get_by_id(user_id)

        if stored.role == UserRole.ADMIN and not resetter.is_super_admin:
            raise UnauthorizedError(
                "Only a super admin can reset another admin's password."
            )

        if not stored.is_active:
            raise InactiveUserError()

        if stored.role == UserRole.ADMIN:
            if user_update is None:
                raise PasswordRequiredError()

            user = await self._user_service.update_password(stored, user_update)
        else:
            # Learners and facilitators always get the fixed password and must
            # replace it at next login, so no caller-supplied value is accepted.
            if user_update is not None:
                raise PasswordNotAllowedError()

            user = await self._user_service.update_password(
                stored,
                UserPasswordUpdate(password=DEFAULT_RESET_PASSWORD),
                must_change_password=True,
            )

        await self._refresh_token_service.revoke_all_for_user(user_id)

        return user

    async def deactivate_user(self, user_id: int, deactivator: User) -> User:
        stored = await self._user_service.get_active_by_id(user_id)

        # Deactivating an admin is as sensitive as activating one.
        if stored.role == UserRole.ADMIN and not deactivator.is_super_admin:
            raise UnauthorizedError(
                "Only a super admin can deactivate another admin."
            )

        user = await self._user_service.deactivate(stored)
        return user

    async def activate_user(self, user_id: int, activator: User) -> User:
        stored = await self._user_service.get_by_id(user_id)

        # Activating an admin is the approval step, so only a super admin may.
        if stored.role == UserRole.ADMIN and not activator.is_super_admin:
            raise UnauthorizedError()

        user = await self._user_service.activate(stored)
        return user

    async def approve_admin(self, user_id: int, approver: User) -> User:
        if user_id == approver.id:
            raise SelfApprovalError()

        stored = await self._user_service.get_by_id(user_id)

        if stored.role != UserRole.ADMIN:
            raise NotAnAdminError()

        if stored.is_active:
            raise UserAlreadyActiveError()

        return await self._user_service.activate(stored)
