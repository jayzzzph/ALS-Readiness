from sqlalchemy import Row, case, func, select

from app.enums.strand_test import StrandTestType
from app.models.learning_strand import LearningStrand
from app.models.strand_test import StrandTest, StrandTestItem, StrandTestItemOption
from app.models.strand_test_attempt import StrandTestAttempt
from app.models.test_item_asset import TestItemAsset

from .base import BaseRepository


class StrandTestRepository(BaseRepository[StrandTest]):
    model = StrandTest

    async def get_by_type_with_attempt(self, learner_id: int, test_type: StrandTestType):
        """Get strand tests with their learning strand and the learner's attempt."""

        statement = (
            select(StrandTest, LearningStrand, StrandTestAttempt)
            .join(LearningStrand, LearningStrand.id == StrandTest.strand_id)
            .outerjoin(
                StrandTestAttempt,
                (StrandTestAttempt.test_id == StrandTest.id)
                & (StrandTestAttempt.learner_id == learner_id),
            )
            .where(StrandTest.type == test_type.value)
        )

        result = await self._session.execute(statement)
        return result.all()

    async def get_by_id(self, test_id: int) -> StrandTest:
        statement = select(StrandTest).where(StrandTest.id == test_id)
        result = await self._session.execute(statement)
        return result.scalar_one_or_none()

    async def get_by_id_with_items(self, test_id: int) -> list[tuple[StrandTest, StrandTestItem, StrandTestItemOption, TestItemAsset]]:
        statement = (
            select(StrandTest, StrandTestItem, StrandTestItemOption, TestItemAsset)
            .join(StrandTestItem, StrandTestItem.test_id == StrandTest.id)
            .join(StrandTestItemOption, StrandTestItemOption.item_id == StrandTestItem.id)
            .outerjoin(TestItemAsset, TestItemAsset.item_id == StrandTestItem.id)
            .where(StrandTest.id == test_id)
            # Without an ORDER BY the database may return rows in any order, and
            # it can change after rows are updated. Items by id, options by id
            # within each item: the order the facilitator's viewer shows.
            .order_by(StrandTestItem.id, StrandTestItemOption.id, TestItemAsset.id)
        )

        result = await self._session.execute(statement)
        return result.all()

    # ================ Viewer (facilitator and admin) ================
    # Read-only.

    async def get_overview_rows(
        self,
        strand_id: int | None = None,
        test_type: StrandTestType | None = None,
        test_id: int | None = None,
    ) -> list[Row]:
        """Tests with their strand and their counts, in one query however many
        there are. Rows are (test, strand code, strand name, item count,
        attempt count), in strand order, pretest before posttest."""
        item_count = (
            select(func.count(StrandTestItem.id))
            .where(StrandTestItem.test_id == StrandTest.id)
            .scalar_subquery()
        )
        attempt_count = (
            select(func.count(StrandTestAttempt.id))
            .where(StrandTestAttempt.test_id == StrandTest.id)
            .scalar_subquery()
        )
        statement = (
            select(StrandTest, LearningStrand.code, LearningStrand.name, item_count, attempt_count)
            .join(LearningStrand, LearningStrand.id == StrandTest.strand_id)
            .order_by(
                LearningStrand.id,
                case((StrandTest.type == StrandTestType.PRETEST, 0), else_=1),
                StrandTest.id,
            )
        )
        if strand_id is not None:
            statement = statement.where(StrandTest.strand_id == strand_id)
        if test_type is not None:
            statement = statement.where(StrandTest.type == test_type)
        if test_id is not None:
            statement = statement.where(StrandTest.id == test_id)

        result = await self._session.execute(statement)
        return list(result.all())

    async def get_items(self, test_id: int) -> list[StrandTestItem]:
        """The test's items in stored order. There is no order column, so that
        is the order they were created in."""
        statement = (
            select(StrandTestItem)
            .where(StrandTestItem.test_id == test_id)
            .order_by(StrandTestItem.id)
        )
        result = await self._session.execute(statement)
        return list(result.scalars())

    async def get_options(self, test_id: int) -> list[StrandTestItemOption]:
        """Every option of the test's items, correct ones marked, in stored
        order. In one query."""
        statement = (
            select(StrandTestItemOption)
            .join(StrandTestItem, StrandTestItem.id == StrandTestItemOption.item_id)
            .where(StrandTestItem.test_id == test_id)
            .order_by(StrandTestItemOption.item_id, StrandTestItemOption.id)
        )
        result = await self._session.execute(statement)
        return list(result.scalars())

    async def get_assets(self, test_id: int) -> list[TestItemAsset]:
        """Every asset of the test's items, in stored order. In one query."""
        statement = (
            select(TestItemAsset)
            .join(StrandTestItem, StrandTestItem.id == TestItemAsset.item_id)
            .where(StrandTestItem.test_id == test_id)
            .order_by(TestItemAsset.item_id, TestItemAsset.id)
        )
        result = await self._session.execute(statement)
        return list(result.scalars())
