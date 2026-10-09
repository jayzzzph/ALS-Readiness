from collections.abc import Collection
from typing import Any

from sqlalchemy import ColumnElement, Row, Select, case, func, insert, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import aliased

from app.enums.at_risk import ACTIVE_FLAG_STATUSES, AtRiskFlagStatus, AtRiskReason
from app.enums.cohort import CohortStatus
from app.enums.curriculum import StructureStatus
from app.enums.strand_test import StrandTestType
from app.models.at_risk_flag import AtRiskFlag
from app.models.cohort import Cohort
from app.models.learner import Learner
from app.models.learning_strand import LearningStrand
from app.models.strand_test import StrandTest
from app.models.strand_test_attempt import StrandTestAttempt
from app.models.user import User
from app.models.user_profile import UserProfile

from .base import BaseRepository

# The profile of the facilitator who reviewed a flag, beside the learner's own.
ReviewerProfile = aliased(UserProfile)


class AtRiskFlagRepository(BaseRepository[AtRiskFlag]):
    model = AtRiskFlag

    async def get_unresolved_in_active_cohorts(
        self,
        cohort_ids: Collection[int],
    ) -> list[AtRiskFlag]:
        """Every flag whose episode is still running (resolved_at null) in those
        of the given cohorts that are active: open, reviewed, and dismissed
        ones alike, whoever they belong to. In one query."""
        if not cohort_ids:
            return []

        statement = (
            select(AtRiskFlag)
            .join(Cohort, Cohort.id == AtRiskFlag.cohort_id)
            .where(
                AtRiskFlag.cohort_id.in_(cohort_ids),
                AtRiskFlag.resolved_at.is_(None),
                Cohort.status == CohortStatus.ACTIVE,
            )
            .order_by(AtRiskFlag.id)
        )
        result = await self._session.execute(statement)
        return list(result.scalars())

    async def get_posttests_in_active_strands(
        self,
        learner_ids: Collection[int],
    ) -> list[tuple[StrandTestAttempt, int]]:
        """The posttest attempts of the given learners in active strands, in one
        query. Rows are (attempt, strand id), oldest first. Pretests and
        attempts in an archived or deleted strand are left out."""
        if not learner_ids:
            return []

        statement = (
            select(StrandTestAttempt, StrandTest.strand_id)
            .join(StrandTest, StrandTest.id == StrandTestAttempt.test_id)
            .join(LearningStrand, LearningStrand.id == StrandTest.strand_id)
            .where(
                StrandTestAttempt.learner_id.in_(learner_ids),
                StrandTest.type == StrandTestType.POSTTEST,
                LearningStrand.status == StructureStatus.ACTIVE,
            )
            .order_by(StrandTestAttempt.taken_at.nulls_first(), StrandTestAttempt.id)
        )
        result = await self._session.execute(statement)
        return [tuple(row) for row in result.all()]

    async def create_many(self, rows: list[dict[str, Any]]) -> None:
        """Insert the flags in one statement.

        If any of them collides with an active flag that another request
        created in the meantime, the unique index rejects the statement; the
        rows are then inserted one at a time and the colliding ones skipped.
        Each try runs in a savepoint, so a rejected insert does not fail the
        request's transaction.
        """
        if not rows:
            return

        try:
            async with self._session.begin_nested():
                await self._session.execute(insert(AtRiskFlag).values(rows))
            return
        except IntegrityError:
            pass

        for row in rows:
            try:
                async with self._session.begin_nested():
                    await self._session.execute(insert(AtRiskFlag).values(row))
            except IntegrityError:
                continue

    async def update_many(self, changes: list[tuple[AtRiskFlag, dict[str, Any]]]) -> None:
        """Apply each set of fields to its flag and write them all in one flush."""
        if not changes:
            return

        for flag, data in changes:
            flag.sqlmodel_update(data)

        await self._session.flush()

    @staticmethod
    def _flag_rows() -> Select:
        """One row per flag with what a flag item shows: the flag, the learner's
        id number and name, the cohort name, the strand code, and the reviewer's
        name. Nothing else of either profile is selected."""
        return (
            select(
                AtRiskFlag,
                User.id_no,
                UserProfile.first_name,
                UserProfile.last_name,
                Cohort.name,
                LearningStrand.code,
                ReviewerProfile.first_name,
                ReviewerProfile.last_name,
            )
            .join(Cohort, Cohort.id == AtRiskFlag.cohort_id)
            .join(Learner, Learner.id == AtRiskFlag.learner_id)
            .join(User, User.id == Learner.user_id)
            .outerjoin(UserProfile, UserProfile.user_id == User.id)
            .outerjoin(LearningStrand, LearningStrand.id == AtRiskFlag.strand_id)
            .outerjoin(ReviewerProfile, ReviewerProfile.user_id == AtRiskFlag.reviewed_by)
        )

    @staticmethod
    def _flag_conditions(
        cohort_ids: Collection[int],
        statuses: Collection[AtRiskFlagStatus] | None,
        reason: AtRiskReason | None,
    ) -> list[ColumnElement[bool]]:
        conditions = [AtRiskFlag.cohort_id.in_(cohort_ids)]

        if statuses is not None:
            conditions.append(AtRiskFlag.status.in_(statuses))
        if reason is not None:
            conditions.append(AtRiskFlag.reason == reason)

        return conditions

    async def get_page(
        self,
        cohort_ids: Collection[int],
        statuses: Collection[AtRiskFlagStatus] | None,
        reason: AtRiskReason | None,
        offset: int,
        limit: int | None,
    ) -> list[Row]:
        """A page of the flags in the given cohorts: open first, then reviewed,
        then the rest, newest detected first within each. `statuses` None means
        every status, and `limit` None means every flag from the offset on."""
        if not cohort_ids:
            return []

        status_order = case(
            (AtRiskFlag.status == AtRiskFlagStatus.OPEN, 0),
            (AtRiskFlag.status == AtRiskFlagStatus.REVIEWED, 1),
            else_=2,
        )
        statement = (
            self._flag_rows()
            .where(*self._flag_conditions(cohort_ids, statuses, reason))
            .order_by(status_order, AtRiskFlag.detected_at.desc(), AtRiskFlag.id.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self._session.execute(statement)
        return list(result.all())

    async def count(
        self,
        cohort_ids: Collection[int],
        statuses: Collection[AtRiskFlagStatus] | None,
        reason: AtRiskReason | None,
    ) -> int:
        if not cohort_ids:
            return 0

        statement = select(func.count(AtRiskFlag.id)).where(
            *self._flag_conditions(cohort_ids, statuses, reason)
        )
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def get_row(self, flag_id: int) -> Row | None:
        """The row for one flag. Same columns as the page."""
        statement = self._flag_rows().where(AtRiskFlag.id == flag_id)
        result = await self._session.execute(statement)
        return result.one_or_none()

    async def get_rows_by_learner_and_cohort(self, learner_id: int, cohort_id: int) -> list[Row]:
        """Every flag of the learner in the cohort, whatever its status, newest
        detected first. Same columns as the page."""
        statement = (
            self._flag_rows()
            .where(AtRiskFlag.learner_id == learner_id, AtRiskFlag.cohort_id == cohort_id)
            .order_by(AtRiskFlag.detected_at.desc(), AtRiskFlag.id.desc())
        )
        result = await self._session.execute(statement)
        return list(result.all())

    async def get_active_reasons(
        self,
        learner_ids: Collection[int],
        cohort_ids: Collection[int],
    ) -> dict[tuple[int, int], set[AtRiskReason]]:
        """The reasons with an active flag, keyed by (learner_id, cohort_id), in
        one query. Memberships with none are absent."""
        if not learner_ids or not cohort_ids:
            return {}

        statement = (
            select(AtRiskFlag.learner_id, AtRiskFlag.cohort_id, AtRiskFlag.reason)
            .where(
                AtRiskFlag.learner_id.in_(learner_ids),
                AtRiskFlag.cohort_id.in_(cohort_ids),
                AtRiskFlag.status.in_(ACTIVE_FLAG_STATUSES),
            )
            .distinct()
        )
        result = await self._session.execute(statement)

        reasons: dict[tuple[int, int], set[AtRiskReason]] = {}
        for learner_id, cohort_id, reason in result.all():
            reasons.setdefault((learner_id, cohort_id), set()).add(reason)
        return reasons
