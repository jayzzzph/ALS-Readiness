from collections.abc import Collection

from sqlalchemy import select

from app.enums.strand_test import StrandTestType
from app.models.strand_test import StrandTest
from app.models.strand_test_attempt import StrandTestAttempt

from .base import BaseRepository


class StrandTestAttemptRepository(BaseRepository[StrandTestAttempt]):
    model = StrandTestAttempt

    async def get_by_test_and_learner(
        self, test_id: int, learner_id: int
    ) -> StrandTestAttempt | None:
        """The learner's own attempt for a test. There is at most one: the
        uq_strand_test_attempts_learner_test constraint allows one attempt per
        learner per test."""
        statement = (
            select(StrandTestAttempt)
            .where(
                StrandTestAttempt.test_id == test_id,
                StrandTestAttempt.learner_id == learner_id,
            )
            .order_by(StrandTestAttempt.id)
            .limit(1)
        )
        result = await self._session.execute(statement)
        return result.scalar_one_or_none()

    async def has_pretest_attempt(self, learner_id: int, strand_id: int) -> bool:
        """Whether the learner has attempted the pretest of the given strand."""
        statement = (
            select(StrandTestAttempt.id)
            .join(StrandTest, StrandTest.id == StrandTestAttempt.test_id)
            .where(
                StrandTestAttempt.learner_id == learner_id,
                StrandTest.strand_id == strand_id,
                StrandTest.type == StrandTestType.PRETEST.value,
            )
            .limit(1)
        )
        result = await self._session.execute(statement)
        return result.first() is not None

    async def get_by_learner_ids(
        self,
        learner_ids: Collection[int],
    ) -> list[tuple[StrandTestAttempt, StrandTestType, int]]:
        """Every attempt of the given learners, in one query.

        Rows are (attempt, test type, strand id), oldest first. An attempt row
        exists only once it has been submitted, so every row is a completed one.
        """
        if not learner_ids:
            return []

        statement = (
            select(StrandTestAttempt, StrandTest.type, StrandTest.strand_id)
            .join(StrandTest, StrandTest.id == StrandTestAttempt.test_id)
            .where(StrandTestAttempt.learner_id.in_(learner_ids))
            .order_by(StrandTestAttempt.taken_at.nulls_first(), StrandTestAttempt.id)
        )
        result = await self._session.execute(statement)
        return [tuple(row) for row in result.all()]
