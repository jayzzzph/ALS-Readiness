from datetime import datetime
from typing import Annotated, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.enums.content import ContentType, ContentVisibility
from app.enums.curriculum import StructureStatus

Title = Annotated[str, Field(min_length=1, max_length=255)]


# ================ Strands ================

class StrandItem(BaseModel):
    id: int
    code: str
    name: str

    model_config = ConfigDict(from_attributes=True)


class StrandListResponse(BaseModel):
    items: list[StrandItem]
    total: int


# ================ Facilitator curriculum tree ================

class FacilitatorContentNode(BaseModel):
    content_id: int
    title: str
    content_type: ContentType
    visibility: ContentVisibility
    # Whether an evaluation row exists. Nothing is computed here.
    has_evaluation: bool
    # Whether the caller uploaded it. False for content shared by someone else.
    is_own: bool
    # A presigned link to the file, as main's curriculum tree returns it. Null
    # when file storage is not configured or cannot be reached.
    file_url: str | None = None


class FacilitatorLessonNode(BaseModel):
    lesson_id: int
    title: str
    description: str | None
    order_index: int
    # The lesson's own status. Always "active" unless include_archived was
    # asked for; an active lesson can still sit under an archived module.
    status: StructureStatus
    # With a cohort_id: the contents assigned to that cohort, including other
    # facilitators' private ones. Without one: every content the caller can see.
    contents: list[FacilitatorContentNode]
    # With a cohort_id: the contents the caller may assign that are not yet
    # assigned to that cohort. Without one: always empty.
    available_contents: list[FacilitatorContentNode]


class FacilitatorModuleNode(BaseModel):
    module_id: int
    title: str
    description: str | None
    order_index: int
    # Always "active" unless include_archived was asked for.
    status: StructureStatus
    lessons: list[FacilitatorLessonNode]


class FacilitatorCurriculumResponse(BaseModel):
    strand_id: int
    strand_code: str
    strand_name: str
    strand_description: str | None
    cohort_id: int | None
    modules: list[FacilitatorModuleNode]


# ================ Structure authoring ================

class StructureCreate(BaseModel):
    title: Title
    description: str | None = None

    model_config = ConfigDict(str_strip_whitespace=True)


class StructureUpdate(BaseModel):
    """Partial update. Only the fields sent are changed."""

    title: Title | None = None
    description: str | None = None
    status: StructureStatus | None = None

    model_config = ConfigDict(str_strip_whitespace=True)

    @model_validator(mode="after")
    def check_fields(self) -> Self:
        if "title" in self.model_fields_set and self.title is None:
            raise ValueError("title cannot be null.")
        if "status" in self.model_fields_set and self.status is None:
            raise ValueError("status cannot be null.")
        # Archive only: nothing is ever deleted through the API.
        if self.status == StructureStatus.DELETED:
            raise ValueError("status must be 'active' or 'archived'.")

        return self


class ModuleCreate(StructureCreate):
    pass


class ModuleUpdate(StructureUpdate):
    pass


class LessonCreate(StructureCreate):
    pass


class LessonUpdate(StructureUpdate):
    pass


class ReorderRequest(BaseModel):
    # Every active child of the parent, each exactly once, in the new order.
    ids: list[int]


class ModuleResponse(BaseModel):
    id: int
    strand_id: int
    title: str
    description: str | None
    order_index: int
    status: StructureStatus
    created_by: int | None
    created_at: datetime | None
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class ModuleListResponse(BaseModel):
    items: list[ModuleResponse]
    total: int


class LessonResponse(BaseModel):
    id: int
    module_id: int
    title: str
    description: str | None
    order_index: int
    status: StructureStatus
    created_by: int | None
    created_at: datetime | None
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class LessonListResponse(BaseModel):
    items: list[LessonResponse]
    total: int
