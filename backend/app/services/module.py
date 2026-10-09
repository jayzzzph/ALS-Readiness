from app.core.exceptions import (
    CurriculumModuleNotFoundError,
    LearningStrandNotFoundError,
    StrandNotActiveError,
)
from app.enums.curriculum import StructureStatus
from app.models.module import Module
from app.models.user import User
from app.repositories.learning_strand import LearningStrandRepository
from app.repositories.module import ModuleRepository
from app.schemas.facilitator_curriculum import ModuleCreate, ModuleUpdate
from app.services.ordering import order_by_ids


class ModuleService:
    """Authoring of a strand's modules. Structure is global per strand (D4)."""

    def __init__(
        self,
        module_repo: ModuleRepository,
        strand_repo: LearningStrandRepository,
    ) -> None:
        self._module_repo = module_repo
        self._strand_repo = strand_repo

    async def get_by_id(self, module_id: int) -> Module:
        module = await self._module_repo.get_by_id(module_id)

        if module is None:
            raise CurriculumModuleNotFoundError()

        return module

    async def create(self, user: User, strand_id: int, module_create: ModuleCreate) -> Module:
        strand = await self._strand_repo.get_by_id(strand_id)
        if strand is None:
            raise LearningStrandNotFoundError()
        if strand.status != StructureStatus.ACTIVE:
            raise StrandNotActiveError()

        # Placed last: after every existing module, archived ones included.
        order_index = await self._module_repo.get_max_order_index(strand_id) + 1

        return await self._module_repo.create(
            Module(
                strand_id=strand_id,
                title=module_create.title,
                description=module_create.description,
                order_index=order_index,
                status=StructureStatus.ACTIVE,
                deleted_at=None,
                created_by=user.id,
            )
        )

    async def update(self, module_id: int, module_update: ModuleUpdate) -> Module:
        module = await self.get_by_id(module_id)
        fields = module_update.model_dump(exclude_unset=True)

        if fields.get("status") == StructureStatus.ACTIVE and module.status != StructureStatus.ACTIVE:
            # A module can only be restored into an active strand. Archiving
            # is never refused.
            strand = await self._strand_repo.get_by_id(module.strand_id)
            if strand is None or strand.status != StructureStatus.ACTIVE:
                raise StrandNotActiveError()

            # A restored module goes to the end of the list, so it cannot collide
            # with an order the facilitator set while it was archived.
            fields["order_index"] = await self._module_repo.get_max_order_index(module.strand_id) + 1

        return await self._module_repo.update(module, fields)

    async def reorder(self, strand_id: int, module_ids: list[int]) -> list[Module]:
        await self._ensure_strand(strand_id)

        active = [
            module
            for module in await self._module_repo.get_by_strand_id(strand_id)
            if module.status == StructureStatus.ACTIVE
        ]

        return await self._module_repo.set_order(order_by_ids(active, module_ids))

    async def _ensure_strand(self, strand_id: int) -> None:
        if await self._strand_repo.get_by_id(strand_id) is None:
            raise LearningStrandNotFoundError()
