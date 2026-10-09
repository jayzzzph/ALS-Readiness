from collections.abc import Collection

from sqlalchemy import ColumnElement, Row, Select, exists, func, select

from app.models.at_risk_flag import AtRiskFlag
from app.models.cohort import Cohort, CohortLearner
from app.models.learner import Learner
from app.models.user import User
from app.models.user_profile import UserProfile
from app.enums.at_risk import ACTIVE_FLAG_STATUSES
from app.enums.cohort import CohortMemberStatus, CohortStatus

from .base import BaseRepository
from .search import person_search_condition


class CohortLearnerRepository(BaseRepository[CohortLearner]):
    model = CohortLearner

    async def get_by_cohort_id_and_learner_id(
        self,
        cohort_id: int,
        learner_id: int,
    ) -> CohortLearner | None:
        statement = select(CohortLearner).where(
            CohortLearner.cohort_id == cohort_id,
            CohortLearner.learner_id == learner_id,
        )
        result = await self._session.execute(statement)

        return result.scalar_one_or_none()

    async def get_all_by_cohort_id_with_profile(
        self,
        cohort_id: int
    ) -> list[tuple[CohortLearner, UserProfile, str | None]]:
        """Rows are (membership, profile, id_no), all from the one query."""
        statement = (
            select(CohortLearner, UserProfile, User.id_no)
            .join(Learner, Learner.id == CohortLearner.learner_id)
            .join(User, User.id == Learner.user_id)
            .join(UserProfile, UserProfile.user_id == User.id)
            .where(CohortLearner.cohort_id == cohort_id)
        )
        result = await self._session.execute(statement)
        return result.all()

    async def get_active_by_learner_id(self, learner_id: int) -> CohortLearner | None:
        statement = (
            select(CohortLearner)
            .where(
                CohortLearner.learner_id == learner_id, 
                CohortLearner.status == CohortMemberStatus.ACTIVE,
            )
        )
        result = await self._session.execute(statement)
        return result.scalar_one_or_none()

    async def exists_in_cohorts(self, learner_id: int, cohort_ids: list[int]) -> bool:
        """Whether the learner has a membership, active or ended, in any of the cohorts."""
        if not cohort_ids:
            return False

        statement = (
            select(CohortLearner.id)
            .where(
                CohortLearner.learner_id == learner_id,
                CohortLearner.cohort_id.in_(cohort_ids),
            )
            .limit(1)
        )
        result = await self._session.execute(statement)
        return result.first() is not None

    async def count_active_by_cohort_ids(self, cohort_ids: list[int]) -> dict[int, int]:
        """Active membership count per cohort, in one query. Cohorts with none are absent."""
        if not cohort_ids:
            return {}

        statement = (
            select(CohortLearner.cohort_id, func.count(CohortLearner.id))
            .where(
                CohortLearner.cohort_id.in_(cohort_ids),
                CohortLearner.status == CohortMemberStatus.ACTIVE,
            )
            .group_by(CohortLearner.cohort_id)
        )
        result = await self._session.execute(statement)
        return {cohort_id: count for cohort_id, count in result.all()}

    async def get_roster_by_cohort_id(
        self,
        cohort_id: int,
    ) -> list[tuple[CohortLearner, str | None, str | None, str | None]]:
        """Every membership of the cohort (active and ended) with the learner's
        id number and name only, ordered by last name then first name.

        Rows are (membership, id_no, first_name, last_name).
        """
        statement = (
            select(CohortLearner, User.id_no, UserProfile.first_name, UserProfile.last_name)
            .join(Learner, Learner.id == CohortLearner.learner_id)
            .join(User, User.id == Learner.user_id)
            .outerjoin(UserProfile, UserProfile.user_id == User.id)
            .where(CohortLearner.cohort_id == cohort_id)
            .order_by(UserProfile.last_name, UserProfile.first_name, CohortLearner.id)
        )
        result = await self._session.execute(statement)
        return result.all()

    async def get_active_in_active_cohorts(
        self,
        cohort_ids: Collection[int],
    ) -> list[tuple[CohortLearner, Cohort]]:
        """The active memberships of those of the given cohorts that are
        themselves active, each with its cohort, in one query."""
        if not cohort_ids:
            return []

        statement = (
            select(CohortLearner, Cohort)
            .join(Cohort, Cohort.id == CohortLearner.cohort_id)
            .where(
                CohortLearner.cohort_id.in_(cohort_ids),
                CohortLearner.status == CohortMemberStatus.ACTIVE,
                Cohort.status == CohortStatus.ACTIVE,
            )
            .order_by(CohortLearner.id)
        )
        result = await self._session.execute(statement)
        return [tuple(row) for row in result.all()]

    @staticmethod
    def _membership_rows() -> Select:
        """One row per membership with what a facilitator's learner views show:
        the membership, its cohort, and the learner's user id, id number and
        name. Nothing else of the profile is selected."""
        return (
            select(
                CohortLearner,
                Cohort,
                Learner.user_id,
                User.id_no,
                UserProfile.first_name,
                UserProfile.last_name,
            )
            .join(Cohort, Cohort.id == CohortLearner.cohort_id)
            .join(Learner, Learner.id == CohortLearner.learner_id)
            .join(User, User.id == Learner.user_id)
            .outerjoin(UserProfile, UserProfile.user_id == User.id)
        )

    @staticmethod
    def _membership_conditions(
        cohort_ids: Collection[int],
        status: CohortMemberStatus | None,
        search: str | None,
        at_risk_only: bool = False,
    ) -> list[ColumnElement[bool]]:
        conditions = [CohortLearner.cohort_id.in_(cohort_ids)]

        if status is not None:
            conditions.append(CohortLearner.status == status)
        if search:
            conditions.append(
                person_search_condition(
                    search,
                    first_name=UserProfile.first_name,
                    last_name=UserProfile.last_name,
                    id_no=User.id_no,
                )
            )
        if at_risk_only:
            conditions.append(
                exists().where(
                    AtRiskFlag.learner_id == CohortLearner.learner_id,
                    AtRiskFlag.cohort_id == CohortLearner.cohort_id,
                    AtRiskFlag.status.in_(ACTIVE_FLAG_STATUSES),
                )
            )

        return conditions

    async def get_membership_page(
        self,
        cohort_ids: Collection[int],
        status: CohortMemberStatus | None,
        search: str | None,
        offset: int,
        limit: int,
        at_risk_only: bool = False,
    ) -> list[Row]:
        """A page of the memberships in the given cohorts, by last name, first
        name, then cohort name. `status` None means active and ended alike.
        `at_risk_only` keeps the memberships with an active at-risk flag."""
        if not cohort_ids:
            return []

        statement = (
            self._membership_rows()
            .where(*self._membership_conditions(cohort_ids, status, search, at_risk_only))
            .order_by(
                func.lower(UserProfile.last_name),
                func.lower(UserProfile.first_name),
                func.lower(Cohort.name),
                CohortLearner.id,
            )
            .offset(offset)
            .limit(limit)
        )
        result = await self._session.execute(statement)
        return list(result.all())

    async def get_memberships_by_cohort_id(
        self,
        cohort_id: int,
        status: CohortMemberStatus | None,
    ) -> list[Row]:
        """Every membership of the cohort, not a page of them, for views that
        total over the whole cohort. Same rows and order as the page. `status`
        None means active and ended alike."""
        statement = (
            self._membership_rows()
            .where(*self._membership_conditions([cohort_id], status, None))
            .order_by(
                func.lower(UserProfile.last_name),
                func.lower(UserProfile.first_name),
                CohortLearner.id,
            )
        )
        result = await self._session.execute(statement)
        return list(result.all())

    async def count_memberships(
        self,
        cohort_ids: Collection[int],
        status: CohortMemberStatus | None,
        search: str | None,
        at_risk_only: bool = False,
    ) -> int:
        if not cohort_ids:
            return 0

        statement = (
            select(func.count(CohortLearner.id))
            .join(Learner, Learner.id == CohortLearner.learner_id)
            .join(User, User.id == Learner.user_id)
            .outerjoin(UserProfile, UserProfile.user_id == User.id)
            .where(*self._membership_conditions(cohort_ids, status, search, at_risk_only))
        )
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def get_memberships_by_learner_id(
        self,
        learner_id: int,
        cohort_ids: Collection[int],
    ) -> list[Row]:
        """The learner's memberships, active and ended, within the given
        cohorts, most recently assigned first. Same rows as the page."""
        if not cohort_ids:
            return []

        statement = (
            self._membership_rows()
            .where(
                CohortLearner.learner_id == learner_id,
                CohortLearner.cohort_id.in_(cohort_ids),
            )
            .order_by(CohortLearner.assigned_at.desc(), CohortLearner.id.desc())
        )
        result = await self._session.execute(statement)
        return list(result.all())
