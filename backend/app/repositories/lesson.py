from sqlalchemy import func, select

from app.models.lesson import Lesson

from .base import BaseRepository


class LessonRepository(BaseRepository[Lesson]):
    model = Lesson

    async def get_by_module_id(self, module_id: int) -> list[Lesson]:
        """Every lesson of the module, any status, in display order."""
        statement = (
            select(Lesson)
            .where(Lesson.module_id == module_id)
            .order_by(Lesson.order_index, Lesson.id)
        )
        result = await self._session.execute(statement)
        return list(result.scalars().all())

    async def get_max_order_index(self, module_id: int) -> int:
        """Highest order_index among the module's lessons, any status; 0 if none."""
        statement = select(func.max(Lesson.order_index)).where(Lesson.module_id == module_id)
        result = await self._session.execute(statement)
        return result.scalar_one_or_none() or 0

    async def set_order(self, lessons: list[Lesson]) -> list[Lesson]:
        """Give the lessons order_index 1..n in the order given."""
        for position, lesson in enumerate(lessons, start=1):
            lesson.order_index = position

        await self._session.flush()
        for lesson in lessons:
            await self._session.refresh(lesson)

        return lessons
