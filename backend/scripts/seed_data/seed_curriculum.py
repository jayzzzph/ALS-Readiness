# This script seeds the curriculum structure: learning strands, modules,
# lessons, contents, and content evaluations for LS1-EN, LS1-FIL, LS3.
# Scope: LS1-EN, LS1-FIL, LS3 only, per thesis Delimitation.
# Run 'uv run python -m scripts.seed_curriculum'.

import asyncio
import sys

from sqlalchemy.ext.asyncio import AsyncSession

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.db.session import AsyncSessionLocal
from app.enums.content import (
    ContentStatus,
    ContentType,
    ContentVisibility,
    StimulusLevel,
)
from app.models.content import Content
from app.models.content_evaluation import ContentEvaluation
from app.models.learning_strand import LearningStrand
from app.models.lesson import Lesson
from app.models.module import Module
from app.repositories.content import ContentRepository
from app.repositories.content_evaluation import ContentEvaluationRepository
from app.repositories.learning_strand import LearningStrandRepository
from app.repositories.lesson import LessonRepository
from app.repositories.module import ModuleRepository

CURRICULUM_DATA = {
    "LS1-EN": {
        "name": "Communication Skills (English)",
        "description": (
            "Covers listening, speaking, reading, and writing competencies "
            "in English, aligned with the ALS K-to-12 Basic Education Curriculum."
        ),
        "modules": [
            {
                "title": "Listening and Speaking Skills",
                "description": (
                    "Develops learners' ability to comprehend spoken English "
                    "and express ideas clearly in conversation."
                ),
                "lessons": [
                    {
                        "title": "Active Listening Strategies",
                        "description": (
                            "Introduces techniques for understanding spoken "
                            "instructions, conversations, and short talks."
                        ),
                    },
                    {
                        "title": "Everyday Conversations",
                        "description": (
                            "Practices common conversational exchanges used "
                            "in daily situations such as greetings and requests."
                        ),
                    },
                ],
            },
            {
                "title": "Reading and Writing Skills",
                "description": (
                    "Builds learners' ability to comprehend written texts and "
                    "produce clear, organized written work."
                ),
                "lessons": [
                    {
                        "title": "Reading Comprehension Basics",
                        "description": (
                            "Covers identifying main ideas, details, and "
                            "sequence in short passages."
                        ),
                    },
                    {
                        "title": "Writing Simple Paragraphs",
                        "description": (
                            "Guides learners in constructing paragraphs with "
                            "a clear topic sentence and supporting details."
                        ),
                    },
                ],
            },
        ],
    },
    "LS1-FIL": {
        "name": "Kasanayan sa Pakikipagtalastasan",
        "description": (
            "Sumasaklaw sa pakikinig, pagsasalita, pagbasa, at pagsulat "
            "gamit ang wikang Filipino, alinsunod sa ALS K to 12 Basic "
            "Education Curriculum."
        ),
        "modules": [
            {
                "title": "Kasanayan sa Pakikinig at Pagsasalita",
                "description": (
                    "Nagpapalawak ng kakayahang unawain ang mga sinasabi at "
                    "magpahayag ng ideya sa wikang Filipino."
                ),
                "lessons": [
                    {
                        "title": "Mga Estratehiya sa Mabisang Pakikinig",
                        "description": (
                            "Ipinapakilala ang mga paraan ng pag-unawa sa "
                            "mga panuto at usapan."
                        ),
                    },
                    {
                        "title": "Pang-araw-araw na Pakikipag-usap",
                        "description": (
                            "Nagsasanay sa karaniwang usapan tulad ng "
                            "pagbati at paghingi ng tulong."
                        ),
                    },
                ],
            },
            {
                "title": "Kasanayan sa Pagbasa at Pagsulat",
                "description": (
                    "Nagpapaunlad ng kakayahang unawain ang binasang teksto "
                    "at makasulat nang malinaw."
                ),
                "lessons": [
                    {
                        "title": "Pag-unawa sa Binasa",
                        "description": (
                            "Tumatalakay sa paghahanap ng pangunahing ideya "
                            "at detalye sa maikling teksto."
                        ),
                    },
                    {
                        "title": "Pagsulat ng Simpleng Talata",
                        "description": (
                            "Naggagabay sa mag-aaral sa paggawa ng talata na "
                            "may malinaw na paksang pangungusap."
                        ),
                    },
                ],
            },
        ],
    },
    "LS3": {
        "name": "Mathematical and Problem Solving Skills",
        "description": (
            "Covers numeracy, logical reasoning, and problem-solving "
            "competencies aligned with the ALS K-to-12 Basic Education "
            "Curriculum."
        ),
        "modules": [
            {
                "title": "Numbers and Operations",
                "description": (
                    "Develops fluency in basic arithmetic operations and "
                    "number sense."
                ),
                "lessons": [
                    {
                        "title": "Whole Numbers and Place Value",
                        "description": (
                            "Covers reading, writing, and comparing whole "
                            "numbers using place value concepts."
                        ),
                    },
                    {
                        "title": "Addition and Subtraction",
                        "description": (
                            "Practices solving problems involving addition "
                            "and subtraction of whole numbers."
                        ),
                    },
                ],
            },
            {
                "title": "Problem Solving and Reasoning",
                "description": (
                    "Builds logical reasoning skills through real-world "
                    "problem-solving tasks."
                ),
                "lessons": [
                    {
                        "title": "Word Problems in Daily Life",
                        "description": (
                            "Applies arithmetic skills to solve practical, "
                            "everyday word problems."
                        ),
                    },
                    {
                        "title": "Patterns and Logical Reasoning",
                        "description": (
                            "Introduces identifying and extending numerical "
                            "and visual patterns."
                        ),
                    },
                ],
            },
        ],
    },
}

# Each strand has one lesson that carries all three stimulus-level versions
# (low / medium / high) of the same video content. Contents are keyed by
# (strand code, lesson title). Which lesson hosts the videos is a best guess;
# change the lesson titles below if they belong elsewhere. Ratings are dummy
# values that drop as stimulus level rises (low ~0.9, medium ~0.7, high ~0.45).
CONTENT_DATA = {
    ("LS1-EN", "Reading Comprehension Basics"): [
        {
            "file_key": "learning-contents/a1e1cd18-cb42-48ba-ad84-4dd9bc6ca5ef_en_low.mp4",
            "title": "Reading Made Simple",
            "description": "Low-stimulus version: a calm, beginner-friendly walkthrough.",
            "stimulus_level": StimulusLevel.LOW,
            "cognitive_sustainability_rating": 0.88,
        },
        {
            "file_key": "learning-contents/71001e73-aafb-42d0-9bc6-867ba3a6b3f1_en_med.mp4",
            "title": "Master Everyday English",
            "description": "Medium-stimulus version: balanced pacing with everyday examples.",
            "stimulus_level": StimulusLevel.MEDIUM,
            "cognitive_sustainability_rating": 0.72,
        },
        {
            "file_key": "learning-contents/311b9410-125c-4eab-b5e7-a9b3eedd7887_en_high.mp4",
            "title": "Cognitive Exam Breakdown",
            "description": "High-stimulus version: fast-paced, exam-style breakdown.",
            "stimulus_level": StimulusLevel.HIGH,
            "cognitive_sustainability_rating": 0.46,
        },
    ],
    ("LS1-FIL", "Pag-unawa sa Binasa"): [
        {
            "file_key": "learning-contents/2deaa9c6-d5d0-46e2-994f-4e853b0f067d_fil_low.mp4",
            "title": "Mga Susi sa Pag-unawa",
            "description": "Mababang stimulus: mahinahon at payak na paliwanag.",
            "stimulus_level": StimulusLevel.LOW,
            "cognitive_sustainability_rating": 0.86,
        },
        {
            "file_key": "learning-contents/ba5271cf-69cf-4016-a104-02c6218d80cd_fil_med.mp4",
            "title": "Reading Toolkit Mo",
            "description": "Katamtamang stimulus: balanseng bilis na may mga halimbawa.",
            "stimulus_level": StimulusLevel.MEDIUM,
            "cognitive_sustainability_rating": 0.70,
        },
        {
            "file_key": "learning-contents/58e3fdb1-8e02-4e51-b83e-6ec8ca53af32_fil_high.mp4",
            "title": "Kasanayang Pangkomunikasyon",
            "description": "Mataas na stimulus: mabilis at masiglang talakayan.",
            "stimulus_level": StimulusLevel.HIGH,
            "cognitive_sustainability_rating": 0.44,
        },
    ],
    ("LS3", "Whole Numbers and Place Value"): [
        {
            "file_key": "learning-contents/429760dd-5522-4ec8-952d-4fa39ba87732_mat_low.mp4",
            "title": "Mastering Math Visuals",
            "description": "Low-stimulus version: slow, visual-first explanation.",
            "stimulus_level": StimulusLevel.LOW,
            "cognitive_sustainability_rating": 0.90,
        },
        {
            "file_key": "learning-contents/829ec187-8d7d-475b-bd40-517fa4527659_mat_med.mp4",
            "title": "Real World Math Toolkit",
            "description": "Medium-stimulus version: balanced pacing with real-world examples.",
            "stimulus_level": StimulusLevel.MEDIUM,
            "cognitive_sustainability_rating": 0.68,
        },
        {
            "file_key": "learning-contents/ed2740df-5d8e-491e-86f9-e0770b451a70_mat_high.mp4",
            "title": "Deconstructing Math",
            "description": "High-stimulus version: dense, fast-moving breakdown.",
            "stimulus_level": StimulusLevel.HIGH,
            "cognitive_sustainability_rating": 0.42,
        },
    ],
}


async def seed_curriculum(session: AsyncSession) -> None:
    strand_repo = LearningStrandRepository(session)
    module_repo = ModuleRepository(session)
    lesson_repo = LessonRepository(session)
    content_repo = ContentRepository(session)
    evaluation_repo = ContentEvaluationRepository(session)

    for code, strand_data in CURRICULUM_DATA.items():
        strand = await strand_repo.create(
            LearningStrand(
                code=code,
                name=strand_data["name"],
                description=strand_data["description"],
            )
        )
        print(f"Strand created - code: {strand.code}, id: {strand.id}")

        for module_index, module_data in enumerate(strand_data["modules"], start=1):
            module = await module_repo.create(
                Module(
                    strand_id=strand.id,
                    title=module_data["title"],
                    description=module_data["description"],
                    order_index=module_index,
                )
            )
            print(f"  Module created - title: {module.title}, id: {module.id}")

            for lesson_index, lesson_data in enumerate(module_data["lessons"], start=1):
                lesson = await lesson_repo.create(
                    Lesson(
                        module_id=module.id,
                        title=lesson_data["title"],
                        description=lesson_data["description"],
                        order_index=lesson_index,
                    )
                )
                print(f"    Lesson created - title: {lesson.title}, id: {lesson.id}")

                for content_data in CONTENT_DATA.get((code, lesson.title), []):
                    content = await content_repo.create(
                        Content(
                            lesson_id=lesson.id,
                            file_key=content_data["file_key"],
                            title=content_data["title"],
                            description=content_data["description"],
                            type=ContentType.VIDEO,
                            status=ContentStatus.ACTIVE,
                            visibility=ContentVisibility.PUBLIC,
                        )
                    )
                    print(f"      Content created - title: {content.title}, id: {content.id}")

                    await evaluation_repo.create(
                        ContentEvaluation(
                            content_id=content.id,
                            stimulus_level=content_data["stimulus_level"],
                            cognitive_sustainability_rating=content_data[
                                "cognitive_sustainability_rating"
                            ],
                        )
                    )
                    print(
                        f"        Evaluation created - level: "
                        f"{content_data['stimulus_level'].value}, "
                        f"rating: {content_data['cognitive_sustainability_rating']}"
                    )


async def main() -> None:
    async with AsyncSessionLocal() as session, session.begin():
        await seed_curriculum(session)


if __name__ == "__main__":
    asyncio.run(main())