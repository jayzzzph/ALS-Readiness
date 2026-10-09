# This script seeds a single cohort with one learner and one facilitator
# assigned to it, plus all seeded contents assigned to the cohort, for local
# development/testing purposes.
# Assumes learner id = 1, facilitator id = 1, and admin user id = 1 already exist,
# and that scripts.seed_curriculum has already been run (so contents exist).
# Run 'uv run python -m scripts.seed_cohort'.

import asyncio
import sys
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.db.session import AsyncSessionLocal
from app.models.cohort import Cohort, CohortFacilitator, CohortLearner
from app.models.cohort_content import CohortContent
from app.models.content import Content
from app.repositories.cohort import CohortRepository
from app.repositories.cohort_content import CohortContentRepository
from app.repositories.cohort_facilitator import CohortFacilitatorRepository
from app.repositories.cohort_learner import CohortLearnerRepository

LEARNER_ID = 1
FACILITATOR_ID = 1
ADMIN_USER_ID = 1

COHORT_DATA = {
    "code": "COH-2026-01",
    "name": "Cohort 1 - School Year 2026-2027",
    "school_year": "2026-2027",
    "start_date": date(2026, 8, 1),
    "end_date": date(2027, 5, 31),
}


async def create_cohort_with_members(
    session: AsyncSession,
    learner_id: int,
    facilitator_id: int,
    admin_user_id: int,
) -> None:
    cohort_repo = CohortRepository(session)
    cohort_learner_repo = CohortLearnerRepository(session)
    cohort_facilitator_repo = CohortFacilitatorRepository(session)
    cohort_content_repo = CohortContentRepository(session)

    cohort = await cohort_repo.create(
        Cohort(
            created_by=admin_user_id,
            code=COHORT_DATA["code"],
            name=COHORT_DATA["name"],
            school_year=COHORT_DATA["school_year"],
            start_date=COHORT_DATA["start_date"],
            end_date=COHORT_DATA["end_date"],
        )
    )
    print(f"Cohort created - code: {cohort.code}, id: {cohort.id}")

    cohort_learner = await cohort_learner_repo.create(
        CohortLearner(
            cohort_id=cohort.id,
            learner_id=learner_id,
            assigned_by=admin_user_id,
        )
    )
    print(
        f"  Learner assigned - learner_id: {cohort_learner.learner_id}, "
        f"cohort_id: {cohort_learner.cohort_id}"
    )

    cohort_facilitator = await cohort_facilitator_repo.create(
        CohortFacilitator(
            cohort_id=cohort.id,
            facilitator_id=facilitator_id,
            assigned_by=admin_user_id,
        )
    )
    print(
        f"  Facilitator assigned - facilitator_id: {cohort_facilitator.facilitator_id}, "
        f"cohort_id: {cohort_facilitator.cohort_id}"
    )

    # Assign every content created by seed_curriculum to this cohort.
    result = await session.execute(select(Content).order_by(Content.id))
    contents = result.scalars().all()

    if not contents:
        print("  No contents found - run scripts.seed_curriculum first.")
        return

    for content in contents:
        cohort_content = await cohort_content_repo.create(
            CohortContent(
                cohort_id=cohort.id,
                content_id=content.id,
                assigned_by=admin_user_id,
            )
        )

        print(
            f"  Content assigned - content_id: {cohort_content.content_id}, "
            f"title: {content.title}, cohort_id: {cohort_content.cohort_id}"
        )


async def main() -> None:
    async with AsyncSessionLocal() as session, session.begin():
        await create_cohort_with_members(
            session,
            learner_id=LEARNER_ID,
            facilitator_id=FACILITATOR_ID,
            admin_user_id=ADMIN_USER_ID,
        )


if __name__ == "__main__":
    asyncio.run(main())