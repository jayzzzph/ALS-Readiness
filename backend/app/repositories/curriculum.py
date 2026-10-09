from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.enums.content import ContentProgressStatus
from app.models.cohort_content import CohortContent
from app.models.content import Content
from app.models.learner_content_progress import LearnerContentProgress
from app.models.learning_strand import LearningStrand
from app.models.lesson import Lesson
from app.models.module import Module


class CurriculumRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_strand_tree(self, strand_id: int) -> LearningStrand | None:
        stmt = (
            select(LearningStrand)
            .where(LearningStrand.id == strand_id)
            .options(
                selectinload(LearningStrand.modules)
                .selectinload(Module.lessons)
                .selectinload(Lesson.contents)
                .selectinload(Content.evaluation)
            )
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_progress_map(
        self, learner_id: int, content_ids: list[int]
    ) -> dict[int, LearnerContentProgress]:
        if not content_ids:
            return {}
        stmt = select(LearnerContentProgress).where(
            LearnerContentProgress.learner_id == learner_id,
            LearnerContentProgress.content_id.in_(content_ids),
        )
        result = await self._session.execute(stmt)
        return {row.content_id: row for row in result.scalars()}

    async def get_cohort_curriculum_map(
        self, cohort_id: int
    ) -> dict[int, dict[int, list[int]]]:
        """Returns {strand_id: {lesson_id: [content_id, ...]}}, only content assigned to this cohort."""
        stmt = (
            select(LearningStrand.id, Lesson.id, Content.id)
            .select_from(Content)
            .join(CohortContent, CohortContent.content_id == Content.id)
            .join(Lesson, Lesson.id == Content.lesson_id)
            .join(Module, Module.id == Lesson.module_id)
            .join(LearningStrand, LearningStrand.id == Module.strand_id)
            .where(CohortContent.cohort_id == cohort_id)
        )
        result = await self._session.execute(stmt)

        mapping: dict[int, dict[int, list[int]]] = {}
        for strand_id, lesson_id, content_id in result.all():
            mapping.setdefault(strand_id, {}).setdefault(lesson_id, []).append(
                content_id
            )
        return mapping

    async def get_completed_content_ids(
        self,
        learner_id: int,
        content_ids: list[int],
    ) -> set[int]:
        if not content_ids:
            return set()
        stmt = select(LearnerContentProgress.content_id).where(
            LearnerContentProgress.learner_id == learner_id,
            LearnerContentProgress.content_id.in_(content_ids),
            LearnerContentProgress.completed_at.is_not(None),
        )
        result = await self._session.execute(stmt)
        return set(result.scalars())
