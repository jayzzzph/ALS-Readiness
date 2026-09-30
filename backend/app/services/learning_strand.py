from fastapi import HTTPException

from app.repositories.curriculum import CurriculumRepository
from app.repositories.learning_strand import LearningStrandRepository
from app.schemas.curriculum import StrandProgressResponse
from app.services.cohort_learner import CohortLearnerService
from app.services.learner import LearnerService


class LearningStrandService:
    def __init__(
        self,
        strand_repo: LearningStrandRepository,
        curriculum_repo: CurriculumRepository,
        cohort_learner_service: CohortLearnerService,
        learner_service: LearnerService,
    ):
        self._strand_repo = strand_repo
        self._curriculum_repo = curriculum_repo
        self._learner_service = learner_service
        self._cohort_learner_service = cohort_learner_service

    async def get_progress_list(self, user_id: int) -> list[StrandProgressResponse]:
        learner = await self._learner_service.get_by_user_id(user_id)

        cohort_learner = await self._cohort_learner_service.get_active_by_learner_id(learner.id)

        curriculum_map = await self._curriculum_repo.get_cohort_curriculum_map(cohort_learner.cohort_id)
        # A learner can only open strands which have content assigned to their
        # active cohort.  Returning every active strand made the upper list and
        # the curriculum endpoint disagree: unassigned strands necessarily had
        # an empty content tree.
        strands = [
            strand
            for strand in await self._strand_repo.get_all_active()
            if strand.id in curriculum_map
        ]

        all_content_ids = [
            cid
            for lessons in curriculum_map.values()
            for content_ids in lessons.values()
            for cid in content_ids
        ]
        completed_ids = await self._curriculum_repo.get_completed_content_ids(
            learner.id, all_content_ids
        )

        responses = []
        for strand in strands:
            lessons_map = curriculum_map.get(strand.id, {})
            total_lessons = len(lessons_map)
            completed_lessons = sum(
                1
                for content_ids in lessons_map.values()
                if content_ids and all(cid in completed_ids for cid in content_ids)
            )
            progress_percent = (
                round(completed_lessons / total_lessons * 100, 1) if total_lessons else None
            )

            responses.append(
                StrandProgressResponse(
                    strand_id=strand.id,
                    code=strand.code,
                    name=strand.name,
                    description=strand.description,
                    completed_lessons=completed_lessons,
                    total_lessons=total_lessons,
                    progress_percent=progress_percent,
                )
            )
        return responses
