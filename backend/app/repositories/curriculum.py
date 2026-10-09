from collections.abc import Collection

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.enums.content import ContentStatus
from app.enums.curriculum import StructureStatus
from app.models.cohort_content import CohortContent
from app.models.content import Content
from app.models.learner_content_progress import LearnerContentProgress
from app.models.learning_strand import LearningStrand
from app.models.lesson import Lesson
from app.models.module import Module


class CurriculumRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_strand_tree(
        self,
        strand_id: int,
        include_archived: bool = False,
    ) -> LearningStrand | None:
        """The strand with only its active modules, their active lessons, and those
        lessons' active contents. An archived module hides its lessons whatever
        their own status.

        With `include_archived`, archived modules and lessons are loaded too,
        in their normal order, each under its parent whatever the parent's
        status. Deleted ones never are, and contents stay active-only."""
        statuses = [StructureStatus.ACTIVE]
        if include_archived:
            statuses.append(StructureStatus.ARCHIVED)

        stmt = (
            select(LearningStrand)
            .where(LearningStrand.id == strand_id)
            .options(
                selectinload(LearningStrand.modules.and_(Module.status.in_(statuses)))
                .selectinload(Module.lessons.and_(Lesson.status.in_(statuses)))
                .selectinload(Lesson.contents.and_(Content.status == ContentStatus.ACTIVE))
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

    async def get_cohort_curriculum_maps(
        self,
        cohort_ids: Collection[int],
    ) -> dict[int, dict[int, dict[int, list[int]]]]:
        """What counts toward progress in each cohort, in one query.

        Returns {cohort_id: {strand_id: {lesson_id: [content_id, ...]}}}, holding
        only active content assigned to the cohort, under an active lesson and
        an active module. This is what the learner's tree shows, so an archived
        item never counts. A cohort with nothing that counts is absent.
        """
        if not cohort_ids:
            return {}

        stmt = (
            select(CohortContent.cohort_id, Module.strand_id, Lesson.id, Content.id)
            .select_from(Content)
            .join(CohortContent, CohortContent.content_id == Content.id)
            .join(Lesson, Lesson.id == Content.lesson_id)
            .join(Module, Module.id == Lesson.module_id)
            .where(
                CohortContent.cohort_id.in_(cohort_ids),
                Content.status == ContentStatus.ACTIVE,
                Lesson.status == StructureStatus.ACTIVE,
                Module.status == StructureStatus.ACTIVE,
            )
        )
        result = await self._session.execute(stmt)

        mapping: dict[int, dict[int, dict[int, list[int]]]] = {}
        for cohort_id, strand_id, lesson_id, content_id in result.all():
            (
                mapping.setdefault(cohort_id, {})
                .setdefault(strand_id, {})
                .setdefault(lesson_id, [])
                .append(content_id)
            )
        return mapping

    async def get_completed_content_ids_by_learner(
        self,
        learner_ids: Collection[int],
        content_ids: Collection[int],
    ) -> dict[int, set[int]]:
        """Which of the contents each learner has completed, in one query.
        A content is completed when its progress row has a completed_at.
        Learners who completed none are absent."""
        if not learner_ids or not content_ids:
            return {}

        stmt = select(LearnerContentProgress.learner_id, LearnerContentProgress.content_id).where(
            LearnerContentProgress.learner_id.in_(learner_ids),
            LearnerContentProgress.content_id.in_(content_ids),
            LearnerContentProgress.completed_at.is_not(None),
        )
        result = await self._session.execute(stmt)

        completed: dict[int, set[int]] = {}
        for learner_id, content_id in result.all():
            completed.setdefault(learner_id, set()).add(content_id)
        return completed
