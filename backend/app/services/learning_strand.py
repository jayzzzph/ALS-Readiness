from collections.abc import Collection
from dataclasses import dataclass

from app.models.learning_strand import LearningStrand
from app.repositories.curriculum import CurriculumRepository
from app.repositories.learning_strand import LearningStrandRepository
from app.schemas.curriculum import StrandProgressResponse
from app.services.cohort_learner import CohortLearnerService
from app.services.learner import LearnerService


@dataclass(frozen=True)
class StrandProgress:
    """One learner's progress in one strand, within one cohort."""

    strand: LearningStrand
    completed_lessons: int
    total_lessons: int
    # Completed lessons as a percentage of the counted ones; 0 when none count.
    percent: float


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

    async def get_active_strands(self) -> list[LearningStrand]:
        return await self._strand_repo.get_all_active()

    async def get_progress_list(self, user_id: int) -> list[StrandProgressResponse]:
        learner = await self._learner_service.get_by_user_id(user_id)

        cohort_learner = await self._cohort_learner_service.get_active_by_learner_id(learner.id)

        progress = await self.get_progress(learner.id, cohort_learner.cohort_id)

        # A learner can only open strands which have content assigned to their
        # active cohort.  Returning every active strand made the upper list and
        # the curriculum endpoint disagree: unassigned strands necessarily had
        # an empty content tree.
        return [
            StrandProgressResponse(
                strand_id=item.strand.id,
                code=item.strand.code,
                name=item.strand.name,
                completed_lessons=item.completed_lessons,
                total_lessons=item.total_lessons,
            )
            for item in progress
            if item.total_lessons
        ]

    async def get_progress(self, learner_id: int, cohort_id: int) -> list[StrandProgress]:
        """The learner's progress in every active strand, in strand order, counted
        against what is assigned to the given cohort (D3)."""
        memberships = [(learner_id, cohort_id)]
        return (await self.get_progress_batch(memberships))[(learner_id, cohort_id)]

    async def get_progress_batch(
        self,
        memberships: Collection[tuple[int, int]],
    ) -> dict[tuple[int, int], list[StrandProgress]]:
        """`get_progress` for many (learner_id, cohort_id) pairs, in three
        queries however many there are.

        A lesson counts when it has at least one active content assigned to the
        cohort, and is active under an active module. It is complete when the
        learner has completed every such content.
        """
        if not memberships:
            return {}

        strands = await self._strand_repo.get_all_active()
        curriculum_maps = await self._curriculum_repo.get_cohort_curriculum_maps(
            {cohort_id for _, cohort_id in memberships}
        )
        completed_by_learner = await self._curriculum_repo.get_completed_content_ids_by_learner(
            {learner_id for learner_id, _ in memberships},
            {
                content_id
                for strand_map in curriculum_maps.values()
                for lessons_map in strand_map.values()
                for content_ids in lessons_map.values()
                for content_id in content_ids
            },
        )

        progress: dict[tuple[int, int], list[StrandProgress]] = {}
        for learner_id, cohort_id in memberships:
            strand_map = curriculum_maps.get(cohort_id, {})
            completed_ids = completed_by_learner.get(learner_id, set())

            items = []
            for strand in strands:
                lessons_map = strand_map.get(strand.id, {})
                total_lessons = len(lessons_map)
                completed_lessons = sum(
                    1
                    for content_ids in lessons_map.values()
                    if all(content_id in completed_ids for content_id in content_ids)
                )
                items.append(
                    StrandProgress(
                        strand=strand,
                        completed_lessons=completed_lessons,
                        total_lessons=total_lessons,
                        percent=(
                            round(completed_lessons / total_lessons * 100, 1)
                            if total_lessons
                            else 0.0
                        ),
                    )
                )
            progress[(learner_id, cohort_id)] = items

        return progress
