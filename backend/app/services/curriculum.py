from fastapi import HTTPException

from app.repositories.cohort_content import CohortContentRepository
from app.repositories.curriculum import CurriculumRepository
from app.schemas.curriculum import (
    ContentNode,
    CurriculumResponse,
    LessonNode,
    ModuleNode,
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
        strand = await self._curriculum_repo.get_strand_tree(strand_id)
        if strand is None:
            raise HTTPException(404, "Strand not found")

        allowed_content_ids = None
        if cohort_id is not None:
            allowed_content_ids = await self._cohort_content_repo.get_content_ids(cohort_id)

        return self._build_response(strand, progress_map={}, allowed_content_ids=allowed_content_ids)

    async def get_tree_with_progress(self, strand_id: int, user_id: int) -> CurriculumResponse:
        learner = await self._learner_service.get_by_user_id(user_id)

        cohort_learner = await self._cohort_learner_service.get_active_by_learner_id(learner.id)

        strand = await self._curriculum_repo.get_strand_tree(strand_id)
        if strand is None:
            raise HTTPException(404, "Strand not found")

        allowed_content_ids = await self._cohort_content_repo.get_content_ids(cohort_learner.cohort_id)

        content_ids = [c.id for m in strand.modules for l in m.lessons for c in l.contents]
        progress_map = await self._curriculum_repo.get_progress_map(learner.id, content_ids)

        return self._build_response(strand, progress_map, allowed_content_ids)

    def _build_response(
        self,
        strand,
        progress_map: dict,
        allowed_content_ids: list[int] | None,
    ) -> CurriculumResponse:
        def include(content) -> bool:
            return allowed_content_ids is None or content.id in allowed_content_ids

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
                                ContentNode(
                                    content_id=content.id,
                                    title=content.title,
                                    content_type=content.type,
                                    stimulus_level=(
                                        content.evaluation.stimulus_level
                                        if content.evaluation
                                        else None
                                    ),
                                    progress_status=(
                                        progress_map[content.id].status
                                        if content.id in progress_map
                                        else "not_opened"
                                    ),
                                    file_url=get_read_url(content.file_key)
                                )
                                for content in lesson.contents
                                if include(content)
                            ],
                        )
                        for lesson in module.lessons
                    ],
                )
                for module in strand.modules
            ],
        )