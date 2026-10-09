from sqlalchemy import select

from app.enums.curriculum import StructureStatus
from app.models.learning_strand import LearningStrand

from .base import BaseRepository


class LearningStrandRepository(BaseRepository[LearningStrand]):
    model = LearningStrand

    async def get_by_code(self, code: str) -> LearningStrand | None:
        statement = select(LearningStrand).where(LearningStrand.code == code)
        result = await self._session.execute(statement)
        return result.scalar_one_or_none()

    async def get_all_active(self) -> list[LearningStrand]:
        """Active strands in display order (seed order: LS1-EN, LS1-FIL, LS3)."""
        stmt = (
            select(LearningStrand)
            .where(LearningStrand.status == StructureStatus.ACTIVE)
            .order_by(LearningStrand.id)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars())
