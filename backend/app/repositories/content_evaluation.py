from sqlalchemy import select

from app.models.content_evaluation import ContentEvaluation

from .base import BaseRepository


class ContentEvaluationRepository(BaseRepository[ContentEvaluation]):
    model = ContentEvaluation

    async def get_by_content_id(self, content_id: int) -> ContentEvaluation | None:
        statement = select(ContentEvaluation).where(ContentEvaluation.content_id == content_id)
        result = await self._session.execute(statement)
        return result.scalar_one_or_none()
