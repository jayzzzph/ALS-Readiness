from app.core.exceptions import (
    CurriculumModuleNotFoundError,
    LessonNotActiveError,
    LessonNotFoundError,
    ModuleNotActiveError,
    StrandNotActiveError,
)
from app.enums.curriculum import StructureStatus
from app.models.lesson import Lesson
from app.models.module import Module
from app.models.user import User
from app.repositories.learning_strand import LearningStrandRepository
from app.repositories.lesson import LessonRepository
from app.repositories.module import ModuleRepository
from app.schemas.facilitator_curriculum import LessonCreate, LessonUpdate
from app.services.ordering import order_by_ids


class LessonService:
    """Lookup and authoring of a module's lessons. Structure is global per strand (D4)."""

    def __init__(
        self,
        lesson_repo: LessonRepository,
        module_repo: ModuleRepository,
        strand_repo: LearningStrandRepository,
    ):
        self._lesson_repo = lesson_repo
        self._module_repo = module_repo
        self._strand_repo = strand_repo

    async def get_by_id(self, lesson_id: int) -> Lesson:
        lesson = await self._lesson_repo.get_by_id(lesson_id)

        if lesson is None:
            raise LessonNotFoundError()

        return lesson

    async def get_active_by_id(self, lesson_id: int) -> Lesson:
        """The lesson, if it, its module, and its strand are all active. Content
        can only be added to, moved to, restored in, or assigned from such a
        lesson."""
        lesson = await self.get_by_id(lesson_id)
        if lesson.status != StructureStatus.ACTIVE:
            raise LessonNotActiveError()

        module = await self._module_repo.get_by_id(lesson.module_id)
        if module is None or module.status != StructureStatus.ACTIVE:
            raise ModuleNotActiveError()

        strand = await self._strand_repo.get_by_id(module.strand_id)
        if strand is None or strand.status != StructureStatus.ACTIVE:
            raise StrandNotActiveError()

        return lesson

    async def create(self, user: User, module_id: int, lesson_create: LessonCreate) -> Lesson:
        module = await self._module_repo.get_by_id(module_id)
        if module is None:
            raise CurriculumModuleNotFoundError()
        await self._ensure_active_parents(module)

        # Placed last: after every existing lesson, archived ones included.
        order_index = await self._lesson_repo.get_max_order_index(module_id) + 1

        return await self._lesson_repo.create(
            Lesson(
                module_id=module_id,
                title=lesson_create.title,
                description=lesson_create.description,
                order_index=order_index,
                status=StructureStatus.ACTIVE,
                deleted_at=None,
                created_by=user.id,
            )
        )

    async def update(self, lesson_id: int, lesson_update: LessonUpdate) -> Lesson:
        lesson = await self.get_by_id(lesson_id)
        fields = lesson_update.model_dump(exclude_unset=True)

        if fields.get("status") == StructureStatus.ACTIVE and lesson.status != StructureStatus.ACTIVE:
            # A lesson can only be restored into an active module of an active
            # strand. Archiving is never refused.
            await self._ensure_active_parents(await self._module_repo.get_by_id(lesson.module_id))

            # A restored lesson goes to the end of the list.
            fields["order_index"] = await self._lesson_repo.get_max_order_index(lesson.module_id) + 1

        return await self._lesson_repo.update(lesson, fields)

    async def reorder(self, module_id: int, lesson_ids: list[int]) -> list[Lesson]:
        await self._ensure_module(module_id)

        active = [
            lesson
            for lesson in await self._lesson_repo.get_by_module_id(module_id)
            if lesson.status == StructureStatus.ACTIVE
        ]

        return await self._lesson_repo.set_order(order_by_ids(active, lesson_ids))

    async def _ensure_active_parents(self, module: Module | None) -> None:
        """A lesson can be added to, or restored in, only an active module
        whose strand is active too."""
        if module is None or module.status != StructureStatus.ACTIVE:
            raise ModuleNotActiveError()

        strand = await self._strand_repo.get_by_id(module.strand_id)
        if strand is None or strand.status != StructureStatus.ACTIVE:
            raise StrandNotActiveError()

    async def _ensure_module(self, module_id: int) -> None:
        if await self._module_repo.get_by_id(module_id) is None:
            raise CurriculumModuleNotFoundError()
