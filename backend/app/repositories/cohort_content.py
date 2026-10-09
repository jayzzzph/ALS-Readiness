from sqlalchemy import select

from app.models.cohort_content import CohortContent

from .base import BaseRepository


class CohortContentRepository(BaseRepository[CohortContent]):
    model = CohortContent

    async def get_content_ids(self, cohort_id: int) -> list[int]:
        stmt = select(CohortContent.content_id).where(CohortContent.cohort_id == cohort_id)
        result = await self._session.execute(stmt)
        return list(result.scalars())

    async def get_content_ids_for_cohorts(self, cohort_ids: list[int]) -> list[int]:
        """The ids of the content assigned to any of the given cohorts."""
        if not cohort_ids:
            return []
        stmt = (
            select(CohortContent.content_id)
            .where(CohortContent.cohort_id.in_(cohort_ids))
            .distinct()
        )
        result = await self._session.execute(stmt)
        return list(result.scalars())

    async def get_by_cohort_id_and_content_id(
        self,
        cohort_id: int,
        content_id: int,
    ) -> CohortContent | None:
        statement = select(CohortContent).where(
            CohortContent.cohort_id == cohort_id,
            CohortContent.content_id == content_id,
        )
        result = await self._session.execute(statement)
        return result.scalar_one_or_none()

    async def delete(self, cohort_content: CohortContent) -> None:
        # cohort_content has no status or soft-delete column, so unassigning
        # removes the row.
        await self._session.delete(cohort_content)
        await self._session.flush()
