from fastapi import HTTPException

from app.core.exceptions import LearningStrandNotFoundError, StorageUnavailableError
from app.enums.curriculum import StructureStatus
from app.models.content import Content
from app.models.user import User
from app.repositories.cohort_content import CohortContentRepository
from app.repositories.curriculum import CurriculumRepository
from app.schemas.curriculum import (
    ContentNode,
    ContentNodeWithProgress,
    CurriculumWithProgressResponse,
    LessonNodeWithProgress,
    ModuleNodeWithProgress,
)
from app.schemas.facilitator_curriculum import (
    FacilitatorContentNode,
    FacilitatorCurriculumResponse,
    FacilitatorLessonNode,
    FacilitatorModuleNode,
)
from app.services.cohort_learner import CohortLearnerService
from app.services.facilitator_scope import FacilitatorScopeService
from app.services.learner import LearnerService
from app.storage import STORAGE_ERRORS, get_read_url


class CurriculumService:
    def __init__(
        self,
        curriculum_repo: CurriculumRepository,
        cohort_content_repo: CohortContentRepository,
        cohort_learner_service: CohortLearnerService,
        learner_service: LearnerService,
        facilitator_scope_service: FacilitatorScopeService,
    ):
        self._curriculum_repo = curriculum_repo
        self._cohort_content_repo = cohort_content_repo
        self._learner_service = learner_service
        self._cohort_learner_service = cohort_learner_service
        self._facilitator_scope_service = facilitator_scope_service

    async def get_tree(
        self,
        user: User,
        strand_id: int,
        cohort_id: int | None,
        include_archived: bool = False,
    ) -> FacilitatorCurriculumResponse:
        """The facilitator's tree: active structure, and only content the caller may see.
        With `include_archived`, archived modules and lessons are listed too,
        so they can be found and restored; contents are active-only either way.

        Without a cohort_id, each lesson lists all its visible content. With one,
        the caller must have access to that cohort, and each lesson lists what is
        assigned to the cohort and, separately, what the caller may still assign.
        """
        if cohort_id is not None:
            await self._facilitator_scope_service.assert_cohort_access(user, cohort_id)

        # An archived strand is not on the facilitator's tab bar, so its tree
        # is not found either.
        strand = await self._curriculum_repo.get_strand_tree(strand_id, include_archived)
        if strand is None or strand.status != StructureStatus.ACTIVE:
            raise LearningStrandNotFoundError()

        access = await self._facilitator_scope_service.get_content_access(user)
        assigned_ids = (
            set(await self._cohort_content_repo.get_content_ids(cohort_id))
            if cohort_id is not None
            else None
        )

        def content_node(content: Content) -> FacilitatorContentNode:
            return FacilitatorContentNode(
                content_id=content.id,
                title=content.title,
                content_type=content.type,
                visibility=content.visibility,
                has_evaluation=content.evaluation is not None,
                is_own=access.is_own(content),
                file_url=self._read_url_or_none(content),
            )

        def lesson_node(lesson) -> FacilitatorLessonNode:
            visible = [content for content in lesson.contents if access.can_see(content)]
            if assigned_ids is None:
                contents, available = visible, []
            else:
                # Everything assigned to this cohort is visible to the caller,
                # who has access to it. Only what they may assign is offered.
                contents = [content for content in visible if content.id in assigned_ids]
                available = [
                    content
                    for content in visible
                    if content.id not in assigned_ids and access.can_assign(content)
                ]

            return FacilitatorLessonNode(
                lesson_id=lesson.id,
                title=lesson.title,
                description=lesson.description,
                order_index=lesson.order_index,
                status=lesson.status,
                contents=[content_node(content) for content in contents],
                available_contents=[content_node(content) for content in available],
            )

        return FacilitatorCurriculumResponse(
            strand_id=strand.id,
            strand_code=strand.code,
            strand_name=strand.name,
            strand_description=strand.description,
            cohort_id=cohort_id,
            modules=[
                FacilitatorModuleNode(
                    module_id=module.id,
                    title=module.title,
                    description=module.description,
                    order_index=module.order_index,
                    status=module.status,
                    lessons=[lesson_node(lesson) for lesson in module.lessons],
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

    @staticmethod
    def _read_url_or_none(content: Content) -> str | None:
        # A storage failure costs the link, not the whole tree. Storage that
        # is not configured counts as one.
        try:
            return get_read_url(content.file_key)
        except (*STORAGE_ERRORS, StorageUnavailableError):
            return None

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
