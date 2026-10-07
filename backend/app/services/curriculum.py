from fastapi import HTTPException

from app.repositories.cohort_content import CohortContentRepository
from app.repositories.curriculum import CurriculumRepository
from app.schemas.curriculum import (
    ContentNode,
    ContentNodeWithProgress,
    CurriculumResponse,
    CurriculumWithProgressResponse,
    LessonNode,
    LessonNodeWithProgress,
    ModuleNode,
    ModuleNodeWithProgress,
)
from app.services.cohort_learner import CohortLearnerService
from app.services.learner import LearnerService
from app.storage import get_read_url


class CurriculumService:
    def __init__(
        self,
        curriculum_repo: CurriculumRepository,
        cohort_content_repo: CohortContentRepository,
        cohort_learner_service: CohortLearnerService,
        learner_service: LearnerService,
    ):
        self._curriculum_repo = curriculum_repo
        self._cohort_content_repo = cohort_content_repo
        self._learner_service = learner_service
        self._cohort_learner_service = cohort_learner_service

    async def get_tree(self, strand_id: int, cohort_id: int | None) -> CurriculumResponse:
        strand = await self._get_strand_or_404(strand_id)

        allowed_content_ids = None
        if cohort_id is not None:
            allowed_content_ids = set(await self._cohort_content_repo.get_content_ids(cohort_id))

        return CurriculumResponse(
            strand_id=strand.id,
            strand_code=strand.code,
            strand_name=strand.name,
            strand_description=strand.description,
            modules=[
                ModuleNode(
                    module_id=module.id,
                    title=module.title,
                    lessons=[
                        LessonNode(
                            lesson_id=lesson.id,
                            title=lesson.title,
                            contents=[
                                self._build_content(content)
                                for content in self._visible_contents(lesson, allowed_content_ids)
                            ],
                        )
                        for lesson in module.lessons
                    ],
                )
                for module in strand.modules
            ],
        )

    async def get_tree_with_progress(
        self, strand_id: int, user_id: int
    ) -> CurriculumWithProgressResponse:
        learner = await self._learner_service.get_by_user_id(user_id)
        cohort_learner = await self._cohort_learner_service.get_active_by_learner_id(learner.id)

        strand = await self._get_strand_or_404(strand_id)

        allowed_content_ids = set(
            await self._cohort_content_repo.get_content_ids(cohort_learner.cohort_id)
        )

        content_ids = [c.id for m in strand.modules for l in m.lessons for c in l.contents]
        progress_map = await self._curriculum_repo.get_progress_map(learner.id, content_ids)

        return CurriculumWithProgressResponse(
            strand_id=strand.id,
            strand_code=strand.code,
            strand_name=strand.name,
            strand_description=strand.description,
            modules=[
                ModuleNodeWithProgress(
                    module_id=module.id,
                    title=module.title,
                    lessons=[
                        LessonNodeWithProgress(
                            lesson_id=lesson.id,
                            title=lesson.title,
                            contents=[
                                self._build_content_with_progress(content, progress_map)
                                for content in self._visible_contents(lesson, allowed_content_ids)
                            ],
                        )
                        for lesson in module.lessons
                    ],
                )
                for module in strand.modules
            ],
        )

    async def _get_strand_or_404(self, strand_id: int):
        strand = await self._curriculum_repo.get_strand_tree(strand_id)
        if strand is None:
            raise HTTPException(404, "Strand not found")
        return strand

    @staticmethod
    def _visible_contents(lesson, allowed_content_ids: set[int] | None) -> list:
        if allowed_content_ids is None:
            return list(lesson.contents)
        return [c for c in lesson.contents if c.id in allowed_content_ids]

    @staticmethod
    def _build_content(content) -> ContentNode:
        return ContentNode(
            content_id=content.id,
            title=content.title,
            content_type=content.type,
            stimulus_level=content.evaluation.stimulus_level if content.evaluation else None,
            file_url=get_read_url(content.file_key),
        )

    @staticmethod
    def _build_content_with_progress(content, progress_map: dict) -> ContentNodeWithProgress:
        progress = progress_map.get(content.id)
        return ContentNodeWithProgress(
            **CurriculumService._build_content(content).model_dump(),
            completed_at=progress.completed_at if progress else None,
            last_accessed_at=progress.last_accessed_at if progress else None,
        )