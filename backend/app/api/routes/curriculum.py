from app.schemas.curriculum import (
    CurriculumResponse,
    CurriculumWithProgressResponse,
)
from fastapi import APIRouter, Depends

from ..deps import (
    CurrentLearnerDep,
    CurriculumServiceDep,
    get_current_facilitator,
)

router = APIRouter(tags=["Curriculum"])


@router.get(
    "/curriculum/{strand_id}",
    dependencies=[Depends(get_current_facilitator)],
)
async def get_curriculum(
    strand_id: int,
    cohort_id: int | None = None,
    service: CurriculumServiceDep = ...,
) -> CurriculumResponse:
    return await service.get_tree(strand_id, cohort_id)


@router.get("/me/curriculum/{strand_id}")
async def get_my_curriculum(
    strand_id: int,
    current_user: CurrentLearnerDep,
    service: CurriculumServiceDep,
) -> CurriculumWithProgressResponse:
    return await service.get_tree_with_progress(strand_id, current_user.id)
