# app/schemas/curriculum.py
from datetime import datetime

from pydantic import BaseModel

from app.enums.content import ContentType, StimulusLevel


class ContentNode(BaseModel):
    content_id: int
    title: str
    content_type: ContentType
    stimulus_level: StimulusLevel | None
    file_url: str


class ContentNodeWithProgress(ContentNode):
    completed_at: datetime | None
    last_accessed_at: datetime | None


class LessonNode(BaseModel):
    lesson_id: int
    title: str
    contents: list[ContentNode]


class LessonNodeWithProgress(BaseModel):
    lesson_id: int
    title: str
    contents: list[ContentNodeWithProgress]


class ModuleNode(BaseModel):
    module_id: int
    title: str
    lessons: list[LessonNode]


class ModuleNodeWithProgress(BaseModel):
    module_id: int
    title: str
    lessons: list[LessonNodeWithProgress]


class CurriculumResponse(BaseModel):
    strand_id: int
    strand_code: str
    strand_name: str
    strand_description: str | None
    modules: list[ModuleNode]


class CurriculumWithProgressResponse(BaseModel):
    strand_id: int
    strand_code: str
    strand_name: str
    strand_description: str | None
    modules: list[ModuleNodeWithProgress]


class StrandProgressResponse(BaseModel):
    strand_id: int
    code: str
    name: str
    completed_lessons: int
    total_lessons: int