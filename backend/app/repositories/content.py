from dataclasses import dataclass

from sqlalchemy import ColumnElement, Row, Select, func, select

from app.enums.content import ContentStatus, ContentType
from app.models.content import Content
from app.models.content_evaluation import ContentEvaluation
from app.models.facilitator import Facilitator
from app.models.learning_strand import LearningStrand
from app.models.lesson import Lesson
from app.models.module import Module
from app.models.user_profile import UserProfile

from .base import BaseRepository


@dataclass(frozen=True)
class ContentLibraryFilters:
    status: ContentStatus = ContentStatus.ACTIVE
    strand_id: int | None = None
    module_id: int | None = None
    lesson_id: int | None = None
    type: ContentType | None = None
    evaluated: bool | None = None
    search: str | None = None


class ContentRepository(BaseRepository[Content]):
    model = Content

    async def exists_by_file_key(self, file_key: str) -> bool:
        """Whether any content row, whatever its status, already uses the key."""
        statement = select(Content.id).where(Content.file_key == file_key).limit(1)
        result = await self._session.execute(statement)
        return result.first() is not None

    @staticmethod
    def _library_rows() -> Select:
        """One row per content with everything a library item shows: the content,
        its lesson title, module title, strand code, the uploader's user id and
        name, and its evaluation (None when it has none)."""
        return (
            select(
                Content,
                Lesson.title,
                Module.title,
                LearningStrand.code,
                Facilitator.user_id,
                UserProfile.first_name,
                UserProfile.last_name,
                ContentEvaluation,
            )
            .join(Lesson, Lesson.id == Content.lesson_id)
            .join(Module, Module.id == Lesson.module_id)
            .join(LearningStrand, LearningStrand.id == Module.strand_id)
            .outerjoin(Facilitator, Facilitator.id == Content.uploaded_by)
            .outerjoin(UserProfile, UserProfile.user_id == Facilitator.user_id)
            .outerjoin(ContentEvaluation, ContentEvaluation.content_id == Content.id)
        )

    @staticmethod
    def _library_conditions(
        scope: ColumnElement[bool],
        filters: ContentLibraryFilters,
    ) -> list[ColumnElement[bool]]:
        conditions = [scope, Content.status == filters.status]

        if filters.strand_id is not None:
            conditions.append(Module.strand_id == filters.strand_id)
        if filters.module_id is not None:
            conditions.append(Lesson.module_id == filters.module_id)
        if filters.lesson_id is not None:
            conditions.append(Content.lesson_id == filters.lesson_id)
        if filters.type is not None:
            conditions.append(Content.type == filters.type)
        if filters.evaluated is True:
            conditions.append(ContentEvaluation.id.is_not(None))
        if filters.evaluated is False:
            conditions.append(ContentEvaluation.id.is_(None))
        if filters.search:
            # The text is matched literally: % and _ are not wildcards.
            escaped = (
                filters.search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            )
            conditions.append(Content.title.ilike(f"%{escaped}%", escape="\\"))

        return conditions

    async def get_library_page(
        self,
        scope: ColumnElement[bool],
        filters: ContentLibraryFilters,
        offset: int,
        limit: int,
    ) -> list[Row]:
        """A page of library rows within `scope`, newest upload first."""
        statement = (
            self._library_rows()
            .where(*self._library_conditions(scope, filters))
            .order_by(Content.uploaded_at.desc().nulls_last(), Content.id.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self._session.execute(statement)
        return list(result.all())

    async def count_library(
        self,
        scope: ColumnElement[bool],
        filters: ContentLibraryFilters,
    ) -> int:
        statement = (
            select(func.count(Content.id))
            .join(Lesson, Lesson.id == Content.lesson_id)
            .join(Module, Module.id == Lesson.module_id)
            .outerjoin(ContentEvaluation, ContentEvaluation.content_id == Content.id)
            .where(*self._library_conditions(scope, filters))
        )
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def get_library_counts(self, scope: ColumnElement[bool]) -> tuple[int, int]:
        """(total, evaluated) over the active content within `scope`."""
        statement = (
            select(func.count(Content.id), func.count(ContentEvaluation.id))
            .outerjoin(ContentEvaluation, ContentEvaluation.content_id == Content.id)
            .where(scope, Content.status == ContentStatus.ACTIVE)
        )
        result = await self._session.execute(statement)
        total, evaluated = result.one()
        return total, evaluated

    async def get_library_row(self, content_id: int) -> Row | None:
        """The library row for one content, any status and any uploader."""
        statement = self._library_rows().where(Content.id == content_id)
        result = await self._session.execute(statement)
        return result.one_or_none()
