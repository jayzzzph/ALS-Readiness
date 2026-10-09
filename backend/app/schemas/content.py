from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

from app.enums.content import (
    ContentStatus,
    ContentType,
    ContentVisibility,
    StimulusLevel,
)

# The same rule ContentUpdate applies to a title: trimmed, then 1 to 255
# characters. Trimming is set on the field so the other fields are left as sent.
Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]


class UploadUrlRequest(BaseModel):
    filename: str


class UploadUrlResponse(BaseModel):
    upload_url: str
    file_key: str


class ContentCreate(BaseModel):
    lesson_id: int
    file_key: str
    title: Title
    description: str | None = None
    visibility: ContentVisibility = ContentVisibility.PRIVATE


class ContentResponse(BaseModel):
    id: int
    file_key: str
    title: str
    description: str | None
    type: ContentType
    status: ContentStatus
    visibility: ContentVisibility

    model_config = ConfigDict(from_attributes=True)


class ContentEvaluationCreate(BaseModel):
    stimulus_level: StimulusLevel
    cognitive_sustainability_rating: float


class ContentEvaluationResultResponse(BaseModel):
    stimulus_level: StimulusLevel
    cognitive_sustainability_rating: float


class ContentEvaluationResponse(BaseModel):
    id: int
    content_id: int
    stimulus_level: StimulusLevel
    cognitive_sustainability_rating: float

    model_config = ConfigDict(from_attributes=True)
