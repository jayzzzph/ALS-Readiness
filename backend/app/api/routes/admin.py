from app.enums.user import UserRole
from app.schemas.admin import (
    AdminAdminCreate,
    AdminFacilitatorCreate,
    AdminLearnerCreate,
    AdminUserCreateResponse,
    AdminUserListResponse,
)
from app.schemas.user import UserPasswordUpdate, UserResponse
from fastapi import APIRouter, Body, Depends, Query, status

from ..deps import (
    AdminServiceDep,
    RequireAdminDep,
    RequireSuperAdminDep,
    require_admin,
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(require_admin)],
)


@router.get(
    "/users",
    response_model=AdminUserListResponse,
)
async def list_users(
    admin_service: AdminServiceDep,
    role: UserRole | None = None,
    is_active: bool | None = None,
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    return await admin_service.list_users(
        role=role,
        is_active=is_active,
        search=search,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/learners",
    status_code=status.HTTP_201_CREATED,
    response_model=AdminUserCreateResponse,
)
async def create_learner(
    learner_create: AdminLearnerCreate,
    admin_service: AdminServiceDep,
):
    return await admin_service.create_learner(learner_create)


@router.post(
    "/facilitators",
    status_code=status.HTTP_201_CREATED,
    response_model=AdminUserCreateResponse,
)
async def create_facilitator(
    facilitator_create: AdminFacilitatorCreate,
    admin_service: AdminServiceDep,
):
    return await admin_service.create_facilitator(facilitator_create)


@router.post(
    "/admins",
    status_code=status.HTTP_201_CREATED,
    response_model=AdminUserCreateResponse,
)
async def create_admin(
    admin_create: AdminAdminCreate,
    admin_service: AdminServiceDep,
):
    return await admin_service.create_admin(admin_create)


@router.patch(
    "/users/{user_id}/password",
    response_model=UserResponse,
)
async def update_user_password(
    user_id: int,
    admin_service: AdminServiceDep,
    admin: RequireAdminDep,
    user_update: UserPasswordUpdate | None = Body(default=None),
):
    user = await admin_service.update_user_password(user_id, user_update, admin)
    return UserResponse.model_validate(user)


@router.patch(
    "/users/{user_id}/deactivate",
    response_model=UserResponse,
)
async def deactivate_user(
    user_id: int,
    admin_service: AdminServiceDep,
    admin: RequireAdminDep,
):
    user = await admin_service.deactivate_user(user_id, admin)
    return UserResponse.model_validate(user)


@router.patch(
    "/users/{user_id}/activate",
    response_model=UserResponse,
)
async def activate_user(
    user_id: int,
    admin_service: AdminServiceDep,
    admin: RequireAdminDep,
):
    user = await admin_service.activate_user(user_id, admin)
    return UserResponse.model_validate(user)


@router.patch(
    "/users/{user_id}/approve",
    response_model=UserResponse,
)
async def approve_admin(
    user_id: int,
    admin_service: AdminServiceDep,
    super_admin: RequireSuperAdminDep,
):
    user = await admin_service.approve_admin(user_id, super_admin)
    return UserResponse.model_validate(user)

