from datetime import datetime
from typing import Annotated, Literal, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.enums.content import (
    ContentStatus,
    ContentType,
    ContentVisibility,
    StimulusLevel,
)

Title = Annotated[str, Field(min_length=1, max_length=255)]

# The library never lists or sets "deleted".
ContentLibraryStatus = Literal["active", "archived"]


class ContentEvaluationSummary(BaseModel):
    stimulus_level: StimulusLevel
    cognitive_sustainability_rating: float


class ContentLibraryItem(BaseModel):
    id: int
    title: str
    description: str | None
    type: ContentType
    visibility: ContentVisibility
    status: ContentStatus
    lesson_id: int
    lesson_title: str
    module_title: str
    strand_code: str
    # The uploader's user id and name. Both null for content with no uploader;
    # the name is also null when the uploader has no profile.
    uploaded_by: int | None
    uploader_name: str | None
    uploaded_at: datetime | None
    # Whether the caller uploaded it.
    is_own: bool
    evaluation: ContentEvaluationSummary | None


class ContentLibraryCounts(BaseModel):
    """Over the caller's visible active content, whatever filters are applied."""

    total: int
    evaluated: int
    not_evaluated: int


class ContentLibraryListResponse(BaseModel):
    items: list[ContentLibraryItem]
    total: int
    page: int
    page_size: int
    counts: ContentLibraryCounts


class ContentLibraryDetailResponse(ContentLibraryItem):
    # Presigned and short-lived. Null when storage is not configured.
    read_url: str | None


class ContentUpdate(BaseModel):
    """Partial update. Only the fields sent are changed. The type, file key,
    and uploader cannot be changed, so sending them is rejected."""

    title: Title | None = None
    description: str | None = None
    visibility: ContentVisibility | None = None
    lesson_id: int | None = None
    status: ContentStatus | None = None

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    @model_validator(mode="after")
    def check_fields(self) -> Self:
        for field in ("title", "visibility", "lesson_id", "status"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null.")
        # Archive only: nothing is ever deleted through the API.
        if self.status == ContentStatus.DELETED:
            raise ValueError("status must be 'active' or 'archived'.")

        return self
