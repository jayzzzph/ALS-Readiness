from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.enums.eeg_session import EEGSessionType


class StimulusReadURLResponse(BaseModel):
    read_url: str


class EEGSessionUploadURLResponse(BaseModel):
    upload_url: str
    file_key: str


class EEGSessionBase(BaseModel):
    file_key: str = Field(max_length=255)
    type: EEGSessionType
    recorded_at: datetime


class EEGSessionCreate(EEGSessionBase):
    pass


class EEGSessionResponse(EEGSessionBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class EEGSessionListResponse(BaseModel):
    eeg_sessions: list[EEGSessionResponse]
