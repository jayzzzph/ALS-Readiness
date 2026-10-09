from datetime import datetime, timezone

from app.core.config import settings
from app.schemas.eeg_session import (
    EEGSessionCreate,
    EEGSessionListResponse,
    EEGSessionResponse,
    EEGSessionUploadURLResponse,
    StimulusReadURLResponse,
)
from app.storage import build_key, get_read_url, get_upload_url
from fastapi import APIRouter, Depends, status

from ..deps import CurrentUserDep, EEGSessionServiceDep, get_current_user

router = APIRouter(tags=["EEG Sessions"])


@router.get(
    "/eeg-sessions/stimulus",
    response_model=StimulusReadURLResponse,
    dependencies=[Depends(get_current_user)],
)
async def get_stimulus_url():
    """Returns the signed read url for accessing the stimulus content used in eeg during exposure."""

    return StimulusReadURLResponse(
        read_url=get_read_url(settings.eeg_stimulus_file_key),
    )


@router.get("/eeg-sessions/upload-url")
async def get_eeg_session_upload_url(current_user: CurrentUserDep):
    """Returns a signed upload url for uploading csv file containing EEG channels."""

    now = datetime.now(timezone.utc)
    compact_now = now.strftime("%Y%m%d%H%M%S")

    file_name = current_user.id_no + "_" + compact_now
    file_key = build_key("eeg-sessions", file_name + ".csv")

    return EEGSessionUploadURLResponse(
        upload_url=get_upload_url(file_key, "text/csv"),
        file_key=file_key,
    )


@router.post(
    "/eeg-sessions",
    status_code=status.HTTP_201_CREATED,
    response_model=EEGSessionResponse,
)
async def create_my_eeg_session(
    data: EEGSessionCreate,
    current_user: CurrentUserDep,
    service: EEGSessionServiceDep,
):
    """Stores the eeg sessions in the database."""
    eeg_session = await service.create_eeg_session(current_user.id, data)
    return EEGSessionResponse.model_validate(eeg_session)


@router.get("/eeg-sessions", response_model=EEGSessionListResponse)
async def list_my_eeg_sessions(
    current_user: CurrentUserDep,
    service: EEGSessionServiceDep,
):
    """Returns a list of eeg sessions for the current learner."""
    eeg_sessions = await service.list_eeg_sessions_for_user(current_user.id)
    return EEGSessionListResponse(
        eeg_sessions=[
            EEGSessionResponse.model_validate(es) 
            for es in eeg_sessions
        ],
    )
