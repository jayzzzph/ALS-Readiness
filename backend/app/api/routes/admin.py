from app.schemas.admin import (
    AdminFacilitatorCreate,
    AdminLearnerCreate,
    AdminUserCreateResponse,
)
from app.schemas.user import UserPasswordUpdate, UserResponse
from fastapi import APIRouter, Depends, Request, status

from ..deps import AdminServiceDep, require_admin

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(require_admin)],
)


@router.post(
    "/learners",
    status_code=status.HTTP_201_CREATED,
    response_model=AdminUserCreateResponse,
)
async def create_learner(
    request: Request,
    learner_create: AdminLearnerCreate,
    admin_service: AdminServiceDep,
):
    print(request.headers.get("Authorization"))

    return await admin_service.create_learner(learner_create)


@router.post(
    "/facilitators",
    status_code=status.HTTP_201_CREATED,
    response_model=AdminUserCreateResponse,
)
async def create_facilitator(
    request: Request,
    facilitator_create: AdminFacilitatorCreate,
    admin_service: AdminServiceDep,
):
    print(request.headers.get("Authorization"))
    return await admin_service.create_facilitator(facilitator_create)


@router.patch(
    "/users/{user_id}/password",
    response_model=UserResponse,
)
async def update_user_password(
    user_id: int,
    user_update: UserPasswordUpdate,
    admin_service: AdminServiceDep,
):
    user = await admin_service.update_user_password(user_id, user_update)
    return UserResponse.model_validate(user)


@router.patch(
    "/users/{user_id}/deactivate",
    response_model=UserResponse,
)
async def deactivate_user(
    user_id: int,
    admin_service: AdminServiceDep,
):
    user = await admin_service.deactivate_user(user_id)
    return UserResponse.model_validate(user)


@router.patch(
    "/users/{user_id}/activate",
    response_model=UserResponse,
)
async def activate_user(
    user_id: int,
    admin_service: AdminServiceDep,
):
    user = await admin_service.activate_user(user_id)
    return UserResponse.model_validate(user)

