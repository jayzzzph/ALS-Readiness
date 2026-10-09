from app.enums.strand_test import StrandTestType
from app.schemas.strand_test_viewer import (
    StrandTestViewerDetailResponse,
    StrandTestViewerListResponse,
)
from fastapi import APIRouter, Depends

from ..deps import StrandTestViewerServiceDep, get_current_facilitator_or_admin

# Apart from the /facilitator router, which admits facilitators only: these
# routes are for facilitators and admins alike (D7). Read-only: a test's
# content is shown, correct answers included, and nothing here changes it.
router = APIRouter(
    prefix="/facilitator/strand-tests",
    tags=["Facilitator"],
    dependencies=[Depends(get_current_facilitator_or_admin)],
)


@router.get("", response_model=StrandTestViewerListResponse)
async def get_strand_tests(
    service: StrandTestViewerServiceDep,
    strand_id: int | None = None,
    type: StrandTestType | None = None,
):
    return await service.get_list(strand_id, type)


@router.get("/{test_id}", response_model=StrandTestViewerDetailResponse)
async def get_strand_test(
    test_id: int,
    service: StrandTestViewerServiceDep,
):
    return await service.get_detail(test_id)
