from collections.abc import Collection

from sqlalchemy import select

from app.models.lri_test_attempt import LRITestAttempt

from .base import BaseRepository


class LRITestAttemptRepository(BaseRepository[LRITestAttempt]):
    model = LRITestAttempt

    async def get_by_test_and_learner(
        self, test_id: int, learner_id: int
    ) -> LRITestAttempt | None:
        """The learner's own attempt for a test. There is at most one: the
        uq_lri_test_attempts_learner_test constraint allows one attempt per
        learner per test."""
        statement = (
            select(LRITestAttempt)
            .where(
                LRITestAttempt.test_id == test_id,
                LRITestAttempt.learner_id == learner_id,
            )
            .order_by(LRITestAttempt.id)
            .limit(1)
        )
        result = await self._session.execute(statement)
        return result.scalar_one_or_none()

    async def get_latest_by_learner_ids(
        self,
        learner_ids: Collection[int],
    ) -> dict[int, LRITestAttempt]:
        """Each learner's most recently submitted attempt, in one query.

        An attempt row exists only once it has been submitted. Learners with
        none are absent.
        """
        if not learner_ids:
            return {}

        statement = (
            select(LRITestAttempt)
            .where(LRITestAttempt.learner_id.in_(learner_ids))
            .distinct(LRITestAttempt.learner_id)
            .order_by(
                LRITestAttempt.learner_id,
                LRITestAttempt.submitted_at.desc().nulls_last(),
                LRITestAttempt.id.desc(),
            )
        )
        result = await self._session.execute(statement)
        return {attempt.learner_id: attempt for attempt in result.scalars()}
