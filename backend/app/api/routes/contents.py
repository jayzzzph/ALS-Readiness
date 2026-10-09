from typing import Annotated

from app.schemas.content import (
    ContentCreate,
    ContentEvaluationCreate,
    ContentEvaluationResponse,
    ContentEvaluationResultResponse,
    ContentResponse,
    UploadUrlRequest,
    UploadUrlResponse,
)
from fastapi import APIRouter, Depends, File, UploadFile, status

from ..deps import ContentServiceDep, CurrentFacilitatorDep, get_current_facilitator

router = APIRouter(
    prefix="/contents",
    tags=["Contents"],
    dependencies=[Depends(get_current_facilitator)],
)


@router.post("/upload-url", response_model=UploadUrlResponse | None)
async def create_upload_url(data: UploadUrlRequest, service: ContentServiceDep):
    file_key, upload_url = service.create_upload_url(data.filename)

    return UploadUrlResponse(
        file_key=file_key,
        upload_url=upload_url,
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ContentResponse,
)
async def create_content(
    data: ContentCreate,
    service: ContentServiceDep,
    current_user: CurrentFacilitatorDep,
):
    content = await service.create_content(current_user.id, data)
    return ContentResponse.model_validate(content)


@router.post(
    "/{content_id}/evaluate",
    status_code=status.HTTP_201_CREATED,
    response_model=ContentEvaluationResultResponse,
)
async def evaluate_content(
    content_id: int,
    file: Annotated[UploadFile, File()],
    service: ContentServiceDep,
    current_user: CurrentFacilitatorDep,
):
    stimulus_level, cognitive_sustainability_rating = await service.evaluate_content(
        current_user, content_id, file
    )

    return ContentEvaluationResultResponse(
        stimulus_level=stimulus_level,
        cognitive_sustainability_rating=cognitive_sustainability_rating,
    )


@router.post(
    "/{content_id}/evaluation",
    status_code=status.HTTP_201_CREATED,
    response_model=ContentEvaluationResponse,
)
async def save_content_evaluation(
    content_id: int,
    data: ContentEvaluationCreate,
    service: ContentServiceDep,
    current_user: CurrentFacilitatorDep,
):
    content_eval = await service.create_content_evaluation(
        current_user, content_id, **data.model_dump()
    )
    return ContentEvaluationResponse.model_validate(content_eval)
