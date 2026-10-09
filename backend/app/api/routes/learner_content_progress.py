from app.schemas.learner_content_progress import (
    ContentProgressCreate,
    ContentProgressResponse,
    ContentProgressUpdate,
)
from fastapi import APIRouter, status

from ..deps import ContentProgressServiceDep, CurrentUserDep

router = APIRouter(
    prefix="/me/contents",
    tags=["Content Progress"],
)


@router.post(
    "/{content_id}/progress",
    status_code=status.HTTP_201_CREATED,
    response_model=ContentProgressResponse,
)
async def create_content_progress(
    content_id: int,
    data: ContentProgressCreate,
    current_user: CurrentUserDep,
    service: ContentProgressServiceDep,
):
    content_progress = await service.create_progress(
        user_id=current_user.id,
        content_id=content_id,
        progress_create=data,
    )
    return ContentProgressResponse.model_validate(content_progress)


@router.patch(
    "/{content_id}/progress",
    response_model=ContentProgressResponse,
)
async def update_content_progress(
    content_id: int,
    data: ContentProgressUpdate,
    current_user: CurrentUserDep,
    service: ContentProgressServiceDep,
):
    content_progress = await service.update_progress(
        user_id=current_user.id,
        content_id=content_id,
        progress_update=data,
    )

    return ContentProgressResponse.model_validate(content_progress)
