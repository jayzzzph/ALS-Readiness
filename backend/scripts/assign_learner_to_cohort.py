# DEV ONLY. Assigns one learner, given by id_no, to cohort COH-2026-01 for local testing.
# Skips (and says so) if the learner is already assigned to it, or is active in another
# cohort (a learner can only have one active cohort, so this script never moves anyone).
# Run from backend/ with 'uv run python -m scripts.assign_learner_to_cohort <id_no>'.

import asyncio
import sys

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.db.session import AsyncSessionLocal
from app.enums.user import UserRole
from app.models.cohort import Cohort, CohortLearner
from app.models.learner import Learner
from app.models.user import User
from app.repositories.cohort_learner import CohortLearnerRepository

COHORT_CODE = "COH-2026-01"


async def assign_learner_to_cohort(session: AsyncSession, id_no: str) -> None:
    cohort = (await session.execute(select(Cohort).where(Cohort.code == COHORT_CODE))).scalars().first()
    if cohort is None:
        print(f"Cohort {COHORT_CODE} not found. Run seed_cohort first.")
        return

    user = (await session.execute(select(User).where(User.id_no == id_no))).scalars().first()
    if user is None:
        print(f"No user with id_no {id_no}.")
        return
    if user.role != UserRole.LEARNER:
        print(f"User {id_no} is not a learner (role: {user.role}).")
        return

    learner = (await session.execute(select(Learner).where(Learner.user_id == user.id))).scalars().first()
    if learner is None:
        print(f"User {id_no} has no learner record.")
        return

    repo = CohortLearnerRepository(session)

    existing = await repo.get_by_cohort_id_and_learner_id(cohort.id, learner.id)
    if existing is not None:
        print(f"Skipped - learner {id_no} (learner id {learner.id}) is already assigned to {COHORT_CODE} (status: {existing.status}).")
        return

    active = await repo.get_active_by_learner_id(learner.id)
    if active is not None:
        print(f"Skipped - learner {id_no} (learner id {learner.id}) is already active in another cohort (cohort id {active.cohort_id}).")
        return

    await repo.create(CohortLearner(cohort_id=cohort.id, learner_id=learner.id, assigned_by=cohort.created_by))
    print(f"Assigned - learner {id_no} (learner id {learner.id}) to {COHORT_CODE} (cohort id {cohort.id}).")


async def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: uv run python -m scripts.assign_learner_to_cohort <id_no>")
        sys.exit(1)
    async with AsyncSessionLocal() as session, session.begin():
        await assign_learner_to_cohort(session, sys.argv[1])


if __name__ == "__main__":
    asyncio.run(main())
