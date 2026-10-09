from typing import Annotated

from app.enums.at_risk import AtRiskReason
from app.enums.content import ContentStatus, ContentType
from app.schemas.at_risk import (
    AtRiskFlagItem,
    AtRiskFlagListResponse,
    AtRiskFlagUpdate,
    AtRiskStatusFilter,
)
from app.schemas.cohort import SchoolYear
from app.schemas.cohort_content import CohortContentCreate, CohortContentResponse
from app.schemas.facilitator_cohort import (
    FacilitatorCohortDetailResponse,
    FacilitatorCohortListResponse,
    FacilitatorSchoolYearsResponse,
)
from app.schemas.facilitator_content import (
    ContentLibraryDetailResponse,
    ContentLibraryItem,
    ContentLibraryListResponse,
    ContentLibraryStatus,
    ContentUpdate,
)
from app.schemas.facilitator_curriculum import (
    LessonCreate,
    LessonListResponse,
    LessonResponse,
    LessonUpdate,
    ModuleCreate,
    ModuleListResponse,
    ModuleResponse,
    ModuleUpdate,
    ReorderRequest,
    StrandItem,
    StrandListResponse,
)
from app.schemas.facilitator_learner import (
    FacilitatorLearnerDetailResponse,
    FacilitatorLearnerListResponse,
    MembershipStatusFilter,
)
from app.schemas.facilitator_report import (
    CohortSummaryResponse,
    DashboardResponse,
    ReportFormat,
)
from app.services.facilitator_report import cohort_summary_csv, cohort_summary_filename
from fastapi import APIRouter, Depends, Query, Response, status

from ..deps import (
    AtRiskServiceDep,
    CohortContentServiceDep,
    ContentLibraryServiceDep,
    CurrentFacilitatorDep,
    FacilitatorCohortServiceDep,
    FacilitatorLearnerServiceDep,
    FacilitatorReportServiceDep,
    LessonServiceDep,
    ModuleServiceDep,
    NowDep,
    StrandServiceDep,
    get_current_facilitator,
)

router = APIRouter(
    prefix="/facilitator",
    tags=["Facilitator"],
    dependencies=[Depends(get_current_facilitator)],
)


# ================ Cohorts ================

@router.get("/school-years", response_model=FacilitatorSchoolYearsResponse)
async def get_my_school_years(
    current_user: CurrentFacilitatorDep,
    service: FacilitatorCohortServiceDep,
):
    return await service.get_school_years(current_user)


@router.get("/cohorts", response_model=FacilitatorCohortListResponse)
async def get_my_cohorts(
    current_user: CurrentFacilitatorDep,
    service: FacilitatorCohortServiceDep,
    school_year: SchoolYear | None = None,
):
    return await service.get_cohorts(current_user, school_year)


@router.get("/cohorts/{cohort_id}", response_model=FacilitatorCohortDetailResponse)
async def get_my_cohort(
    cohort_id: int,
    current_user: CurrentFacilitatorDep,
    service: FacilitatorCohortServiceDep,
):
    return await service.get_cohort_detail(current_user, cohort_id)


# ================ Learners ================

@router.get("/learners", response_model=FacilitatorLearnerListResponse)
async def get_my_learners(
    current_user: CurrentFacilitatorDep,
    service: FacilitatorLearnerServiceDep,
    now: NowDep,
    cohort_id: int | None = None,
    school_year: SchoolYear | None = None,
    membership_status: MembershipStatusFilter = "active",
    search: str | None = None,
    at_risk: bool = False,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
):
    return await service.get_list(
        current_user,
        cohort_id=cohort_id,
        school_year=school_year,
        membership_status=membership_status,
        search=search,
        at_risk=at_risk,
        page=page,
        page_size=page_size,
        now=now,
    )


@router.get("/learners/{learner_id}", response_model=FacilitatorLearnerDetailResponse)
async def get_my_learner(
    learner_id: int,
    current_user: CurrentFacilitatorDep,
    service: FacilitatorLearnerServiceDep,
    now: NowDep,
    cohort_id: int | None = None,
):
    return await service.get_detail(current_user, learner_id, cohort_id, now)


# ================ At-risk flags ================
# Flags are brought up to date when they are read; there is no scheduler (D5).

@router.get("/at-risk", response_model=AtRiskFlagListResponse)
async def get_at_risk_flags(
    current_user: CurrentFacilitatorDep,
    service: AtRiskServiceDep,
    now: NowDep,
    cohort_id: int | None = None,
    school_year: SchoolYear | None = None,
    status: AtRiskStatusFilter = "active",
    reason: AtRiskReason | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
):
    return await service.get_list(
        current_user,
        now,
        cohort_id=cohort_id,
        school_year=school_year,
        status=status,
        reason=reason,
        page=page,
        page_size=page_size,
    )


@router.patch("/at-risk/{flag_id}", response_model=AtRiskFlagItem)
async def update_at_risk_flag(
    flag_id: int,
    data: AtRiskFlagUpdate,
    current_user: CurrentFacilitatorDep,
    service: AtRiskServiceDep,
    now: NowDep,
):
    return await service.update(current_user, flag_id, data, now)


# ================ Dashboard and reports ================

@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    cohort_id: int,
    current_user: CurrentFacilitatorDep,
    service: FacilitatorReportServiceDep,
    now: NowDep,
):
    return await service.get_dashboard(current_user, cohort_id, now)


@router.get(
    "/reports/cohort-summary",
    response_model=CohortSummaryResponse,
    responses={
        200: {
            "description": (
                "The cohort summary. JSON by default. With `format=csv`, a UTF-8 CSV "
                "file (with a byte order mark) sent as an attachment: one row per "
                "learner in the same order as the JSON `learners`, and no totals."
            ),
            "content": {
                "text/csv": {
                    "schema": {"type": "string"},
                    "example": (
                        "ID Number,Last Name,First Name,Membership Status,Overall Progress (%),"
                        "LS1-EN Progress (%),LS1-EN Pretest MPS,LS1-EN Posttest MPS,LS1-EN Gain,"
                        "LS1-EN Mastered,LRI Score,Last Active (PHT),At-Risk Reasons\r\n"
                        "2026-00001,Abad,Ana,active,50.0,50.0,40.0,80.0,40.0,Yes,3.25,"
                        "2026-10-05 09:30,\r\n"
                    ),
                }
            },
            "headers": {
                "Content-Disposition": {
                    "description": (
                        "Sent with `format=csv`: `attachment`, with a filename built from "
                        "the cohort code (or id) and the date in Manila."
                    ),
                    "schema": {"type": "string"},
                }
            },
        }
    },
)
async def get_cohort_summary(
    cohort_id: int,
    current_user: CurrentFacilitatorDep,
    service: FacilitatorReportServiceDep,
    now: NowDep,
    membership_status: MembershipStatusFilter = "active",
    format: ReportFormat = "json",
):
    summary = await service.get_cohort_summary(current_user, cohort_id, membership_status, now)

    if format == "csv":
        filename = cohort_summary_filename(summary)
        return Response(
            content=cohort_summary_csv(summary),
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    return summary


# ================ Content assignment ================

@router.post(
    "/cohorts/{cohort_id}/contents",
    status_code=status.HTTP_201_CREATED,
    response_model=CohortContentResponse,
)
async def assign_content(
    cohort_id: int,
    data: CohortContentCreate,
    current_user: CurrentFacilitatorDep,
    service: CohortContentServiceDep,
):
    return await service.assign(current_user, cohort_id, data.content_id)


@router.delete(
    "/cohorts/{cohort_id}/contents/{content_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def unassign_content(
    cohort_id: int,
    content_id: int,
    current_user: CurrentFacilitatorDep,
    service: CohortContentServiceDep,
):
    await service.unassign(current_user, cohort_id, content_id)


# ================ Content library ================

@router.get("/contents", response_model=ContentLibraryListResponse)
async def get_library_contents(
    current_user: CurrentFacilitatorDep,
    service: ContentLibraryServiceDep,
    strand_id: int | None = None,
    module_id: int | None = None,
    lesson_id: int | None = None,
    type: ContentType | None = None,
    evaluated: bool | None = None,
    mine: bool = False,
    status: ContentLibraryStatus = "active",
    search: str | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
):
    return await service.get_list(
        current_user,
        status=ContentStatus(status),
        mine=mine,
        strand_id=strand_id,
        module_id=module_id,
        lesson_id=lesson_id,
        type=type,
        evaluated=evaluated,
        search=search,
        page=page,
        page_size=page_size,
    )


@router.get("/contents/{content_id}", response_model=ContentLibraryDetailResponse)
async def get_library_content(
    content_id: int,
    current_user: CurrentFacilitatorDep,
    service: ContentLibraryServiceDep,
):
    return await service.get_detail(current_user, content_id)


@router.patch("/contents/{content_id}", response_model=ContentLibraryItem)
async def update_library_content(
    content_id: int,
    data: ContentUpdate,
    current_user: CurrentFacilitatorDep,
    service: ContentLibraryServiceDep,
):
    return await service.update(current_user, content_id, data)


# ================ Strands and structure ================
# Structure is global per strand, not per cohort (D4), so no cohort check applies.

@router.get("/strands", response_model=StrandListResponse)
async def get_strands(service: StrandServiceDep):
    strands = await service.get_active_strands()
    items = [StrandItem.model_validate(strand) for strand in strands]
    return StrandListResponse(items=items, total=len(items))


@router.post(
    "/strands/{strand_id}/modules",
    status_code=status.HTTP_201_CREATED,
    response_model=ModuleResponse,
)
async def create_module(
    strand_id: int,
    data: ModuleCreate,
    current_user: CurrentFacilitatorDep,
    service: ModuleServiceDep,
):
    return await service.create(current_user, strand_id, data)


@router.put("/strands/{strand_id}/modules/order", response_model=ModuleListResponse)
async def reorder_modules(
    strand_id: int,
    data: ReorderRequest,
    service: ModuleServiceDep,
):
    modules = await service.reorder(strand_id, data.ids)
    items = [ModuleResponse.model_validate(module) for module in modules]
    return ModuleListResponse(items=items, total=len(items))


@router.patch("/modules/{module_id}", response_model=ModuleResponse)
async def update_module(
    module_id: int,
    data: ModuleUpdate,
    service: ModuleServiceDep,
):
    return await service.update(module_id, data)


@router.post(
    "/modules/{module_id}/lessons",
    status_code=status.HTTP_201_CREATED,
    response_model=LessonResponse,
)
async def create_lesson(
    module_id: int,
    data: LessonCreate,
    current_user: CurrentFacilitatorDep,
    service: LessonServiceDep,
):
    return await service.create(current_user, module_id, data)


@router.put("/modules/{module_id}/lessons/order", response_model=LessonListResponse)
async def reorder_lessons(
    module_id: int,
    data: ReorderRequest,
    service: LessonServiceDep,
):
    lessons = await service.reorder(module_id, data.ids)
    items = [LessonResponse.model_validate(lesson) for lesson in lessons]
    return LessonListResponse(items=items, total=len(items))


@router.patch("/lessons/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: int,
    data: LessonUpdate,
    service: LessonServiceDep,
):
    return await service.update(lesson_id, data)
