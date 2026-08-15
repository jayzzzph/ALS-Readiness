from app.schemas.admin import (
    AdminFacilitatorCreate,
    AdminLearnerCreate,
    AdminUserCreateResponse,
)
from fastapi import APIRouter, status

from ..deps import AdminServiceDep

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post(
    "/learner",
    status_code=status.HTTP_201_CREATED,
    response_model=AdminUserCreateResponse,
)
async def create_learner(
    learner_create: AdminLearnerCreate,
    admin_service: AdminServiceDep,
):
    return await admin_service.create_learner(learner_create)


@router.post(
    "/facilitator",
    status_code=status.HTTP_201_CREATED,
    response_model=AdminUserCreateResponse,
)
async def create_facilitator(
    facilitator_create: AdminFacilitatorCreate,
    admin_service: AdminServiceDep,
):
    return await admin_service.create_facilitator(facilitator_create)
