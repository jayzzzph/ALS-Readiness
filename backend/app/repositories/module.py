from sqlalchemy import func, select

from app.models.module import Module

from .base import BaseRepository


class ModuleRepository(BaseRepository[Module]):
    model = Module

    async def get_by_strand_id(self, strand_id: int) -> list[Module]:
        """Every module of the strand, any status, in display order."""
        statement = (
            select(Module)
            .where(Module.strand_id == strand_id)
            .order_by(Module.order_index, Module.id)
        )
        result = await self._session.execute(statement)
        return list(result.scalars().all())

    async def get_max_order_index(self, strand_id: int) -> int:
        """Highest order_index among the strand's modules, any status; 0 if none."""
        statement = select(func.max(Module.order_index)).where(Module.strand_id == strand_id)
        result = await self._session.execute(statement)
        return result.scalar_one_or_none() or 0

    async def set_order(self, modules: list[Module]) -> list[Module]:
        """Give the modules order_index 1..n in the order given."""
        for position, module in enumerate(modules, start=1):
            module.order_index = position

        await self._session.flush()
        for module in modules:
            await self._session.refresh(module)

        return modules
