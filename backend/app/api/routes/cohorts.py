from app.enums.cohort import CohortStatus
from app.schemas.cohort import (
    CohortCreate,
    CohortListResponse,
    CohortResponse,
    CohortStatusUpdate,
    CohortWithMembersResponse,
    SchoolYear,
)
from app.schemas.cohort_facilitator import (
    CohortFacilitatorCreate,
    CohortFacilitatorResponse,
)
from app.schemas.cohort_learner import CohortLearnerCreate, CohortLearnerResponse
from fastapi import APIRouter, Depends, status

from ..deps import (
    CohortServiceDep,
    CurrentUserDep,
    RequireAdminDep,
    require_admin,
)

admin_router = APIRouter(
    prefix="/cohorts", 
    tags=["Cohorts"],
    dependencies=[Depends(require_admin)],
)


# ================ Admin-only ================ 

@admin_router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=CohortResponse,
)
async def create_cohort(
    cohort_create: CohortCreate,
    current_user: RequireAdminDep,
    cohort_service: CohortServiceDep,
):
    res = await cohort_service.create(current_user.id, cohort_create)
    return CohortResponse.model_validate(res)


@admin_router.get(
    "",
    response_model=CohortListResponse,
)
async def get_cohorts(
    status: CohortStatus | None = None,
    school_year: SchoolYear | None = None,
    cohort_service: CohortServiceDep = ...,
):
    cohorts = await cohort_service.get_list(status, school_year)
    return CohortListResponse(
        cohorts=[CohortResponse.model_validate(cohort) for cohort in cohorts]
    )


@admin_router.patch(
    "/{cohort_id}/status",
    response_model=CohortResponse,
)
async def update_cohort_status(
    cohort_id: int,
    cohort_update: CohortStatusUpdate,
    cohort_service: CohortServiceDep,
):
    cohort = await cohort_service.update_status(cohort_id, cohort_update.status)
    return CohortResponse.model_validate(cohort)


@admin_router.post(
    "/{cohort_id}/learners",
    status_code=status.HTTP_201_CREATED,
    response_model=CohortLearnerResponse,
)
async def assign_learner_to_cohort(
    cohort_id: int,
    cohort_learner_create: CohortLearnerCreate,
    current_user: RequireAdminDep,
    cohort_service: CohortServiceDep,
):
    cohort_learner = await cohort_service.assign_learner(
        admin_id=current_user.id,
        cohort_id=cohort_id,
        learner_id=cohort_learner_create.learner_id
    )
    return CohortLearnerResponse.model_validate(cohort_learner)


@admin_router.post(
    "/{cohort_id}/facilitators",
    status_code=status.HTTP_201_CREATED,
    response_model=CohortFacilitatorResponse,
)
async def assign_facilitator_to_cohort(
    cohort_id: int,
    cohort_facilitator_create: CohortFacilitatorCreate,
    current_user: RequireAdminDep,
    cohort_service: CohortServiceDep,
):
    result = await cohort_service.assign_facilitator(
        admin_id=current_user.id,
        cohort_id=cohort_id,
        facilitator_id=cohort_facilitator_create.facilitator_id,
    )

    return CohortFacilitatorResponse.model_validate(result)


# Admin-only: this roster carries full member profiles. Facilitators use
# GET /facilitator/cohorts/{cohort_id}, which returns names and ID numbers only.
@admin_router.get("/{cohort_id}/members", response_model=CohortWithMembersResponse)
async def get_cohort_with_members(
    cohort_id: int,
    current_user: RequireAdminDep,
    cohort_service: CohortServiceDep,
):
    return await cohort_service.get_cohort_with_members(current_user, cohort_id)


me_router = APIRouter(
    prefix="/me/cohorts",
    tags=["Cohorts"]
)

# ================ Current User ================ 

@me_router.get("", response_model=CohortListResponse)
async def get_my_cohorts(current_user: CurrentUserDep, cohort_service: CohortServiceDep):
    cohorts = await cohort_service.get_cohorts_for_user(current_user)
    return CohortListResponse(
        cohorts=[
            CohortResponse.model_validate(cohort)
            for cohort in cohorts
        ]
    )


router = APIRouter()

router.include_router(admin_router)
router.include_router(me_router)
