from collections.abc import Collection

from sqlalchemy import select

from app.models.participant_intake import ParticipantIntake
from app.schemas.participant_intake import ParticipantIntakeUpsert

from .base import BaseRepository


class ParticipantIntakeRepository(BaseRepository[ParticipantIntake]):
    model = ParticipantIntake

    async def get_by_user_id(self, user_id: int) -> ParticipantIntake | None:
        return await self._session.get(ParticipantIntake, user_id)

    async def get_by_user_ids(self, user_ids: Collection[int]) -> dict[int, ParticipantIntake]:
        """The intakes of the given users, in one query. Users with none are absent."""
        if not user_ids:
            return {}

        statement = select(ParticipantIntake).where(ParticipantIntake.user_id.in_(user_ids))
        result = await self._session.execute(statement)
        return {intake.user_id: intake for intake in result.scalars()}

    async def update(self, intake: ParticipantIntake, data: ParticipantIntakeUpsert) -> ParticipantIntake:
        intake.sqlmodel_update(data.model_dump())
        await self._session.flush()
        await self._session.refresh(intake)
        return intake
