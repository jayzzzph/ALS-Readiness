# DEV ONLY. Creates a few sample learning contents for local testing of the learner
# Learning Content page: for every existing strand, three items spread across the lessons
# of its first module (video, audio, reading), some with a content evaluation (stimulus
# level), all assigned to cohort COH-2026-01.
# File keys are placeholders ("sample/..."), so nothing can actually be opened or played.
# Assumes the strands/modules/lessons (seed_learning_strand) and the cohort (seed_cohort)
# already exist. Safe to run twice: an item whose file key already exists is skipped.
# Run from backend/ with 'uv run python -m scripts.seed_sample_contents'.

import asyncio
import sys

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.db.session import AsyncSessionLocal
from app.enums.content import ContentType, StimulusLevel
from app.models.cohort import Cohort
from app.models.cohort_content import CohortContent
from app.models.content import Content
from app.models.content_evaluation import ContentEvaluation
from app.models.learning_strand import LearningStrand
from app.models.lesson import Lesson
from app.models.module import Module

COHORT_CODE = "COH-2026-01"

# (index of the lesson in the first module, type, stimulus level or None for "no evaluation", cognitive sustainability rating)
# The levels are rotated per strand so the strands don't all look the same.
PLAN: list[tuple[int, ContentType, StimulusLevel | None, float]] = [
    (0, ContentType.VIDEO, StimulusLevel.MEDIUM, 0.62),
    (0, ContentType.AUDIO, None, 0.0),
    (1, ContentType.READING, StimulusLevel.LOW, 0.35),
]
LEVELS = [StimulusLevel.LOW, StimulusLevel.MEDIUM, StimulusLevel.HIGH]
EXTENSION = {ContentType.VIDEO: "mp4", ContentType.AUDIO: "mp3", ContentType.READING: "pdf"}
RATING = {StimulusLevel.LOW: 0.35, StimulusLevel.MEDIUM: 0.62, StimulusLevel.HIGH: 0.88}


async def seed_sample_contents(session: AsyncSession) -> None:
    cohort = (await session.execute(select(Cohort).where(Cohort.code == COHORT_CODE))).scalars().first()
    if cohort is None:
        print(f"Cohort {COHORT_CODE} not found. Run seed_cohort first.")
        return

    strands = list((await session.execute(select(LearningStrand).order_by(LearningStrand.id))).scalars())
    if not strands:
        print("No learning strands found. Run seed_learning_strand first.")
        return

    created = 0
    for strand_index, strand in enumerate(strands):
        module = (
            await session.execute(
                select(Module).where(Module.strand_id == strand.id).order_by(Module.order_index).limit(1)
            )
        ).scalars().first()
        if module is None:
            print(f"{strand.code}: no modules, skipped")
            continue
        lessons = list(
            (await session.execute(select(Lesson).where(Lesson.module_id == module.id).order_by(Lesson.order_index))).scalars()
        )
        if not lessons:
            print(f"{strand.code}: first module has no lessons, skipped")
            continue

        print(f"{strand.code} - {module.title}")
        for plan_index, (lesson_index, content_type, level, _rating) in enumerate(PLAN, start=1):
            lesson = lessons[min(lesson_index, len(lessons) - 1)]
            file_key = f"sample/{strand.code.lower()}/lesson-{lesson.id}-{content_type.value}-{plan_index}.{EXTENSION[content_type]}"

            exists = (await session.execute(select(Content).where(Content.file_key == file_key))).scalars().first()
            if exists is not None:
                print(f"  already there - {file_key}")
                continue

            # Rotate the stimulus level by strand, but keep the "no evaluation" items without one.
            if level is not None:
                level = LEVELS[(LEVELS.index(level) + strand_index) % len(LEVELS)]

            verb = {ContentType.VIDEO: "Watch", ContentType.AUDIO: "Listen to", ContentType.READING: "Read"}[content_type]
            content = Content(
                lesson_id=lesson.id,
                file_key=file_key,
                title=f"{verb}: {lesson.title}",
                description="Sample content for local testing. The file does not exist.",
                type=content_type,
            )
            session.add(content)
            await session.flush()
            await session.refresh(content)

            if level is not None:
                session.add(ContentEvaluation(content_id=content.id, stimulus_level=level, cognitive_sustainability_rating=RATING[level]))

            session.add(CohortContent(cohort_id=cohort.id, content_id=content.id, assigned_by=cohort.created_by))
            await session.flush()

            created += 1
            evaluation = f"stimulus {level.value}" if level is not None else "no evaluation"
            print(f"  created - {content_type.value}: {content.title} (content id {content.id}, lesson id {lesson.id}, {evaluation}, key {file_key})")

    print(f"Done. {created} sample content item(s) created and assigned to {COHORT_CODE}.")


async def main() -> None:
    async with AsyncSessionLocal() as session, session.begin():
        await seed_sample_contents(session)


if __name__ == "__main__":
    asyncio.run(main())
