import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.db.session import AsyncSessionLocal
from sqlalchemy.ext.asyncio import AsyncSession

from .seed_admin import create_admin
from .seed_data.seed_cohort import create_cohort_with_members
from .seed_data.seed_curriculum import seed_curriculum
from .seed_data.seed_participants import seed_participants
from .seed_facilitator import create_facilitator
from .seed_learner import create_learner
from .seed_lri_test import create_lri_test
from .seed_strand_test import create_strand_tests


async def populate_db(session: AsyncSession) -> None:
    # ======== Curriculum ========
    print("======== Curriculum ========")
    await seed_curriculum(session)

    print("\n======== Tests ========")
    print("LRI Test:")
    # ======== Tests =========
    lri_test = await create_lri_test(session)

    print("\nStrand Tests:")
    strand_tests = await create_strand_tests(session)

    # ======== Actors ========
    print("\n======== Actors ========")
    _, learner = await create_learner(session)
    _, facilitator = await create_facilitator(session)
    admin = await create_admin(session)

    # ======== Cohort ========
    print("\n======== Cohort ========")
    await create_cohort_with_members(session, learner.id, facilitator.id, admin.id)

    # ======== Participants ========
    print("\n======== Participants ========")
    await seed_participants(session)

    print("\nAll records created successfully.")


async def main() -> None:
    async with AsyncSessionLocal() as session, session.begin():
        await populate_db(session)


if __name__ == "__main__":
    asyncio.run(main())
 