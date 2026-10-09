"""Test data builders for the API suite.

Most builders write rows straight to the test database with the app's own
models: it is fast, and it can produce states the API never would (an ended
membership dated last year, a refresh token created five days ago). Strand test
attempts go through the API by default, because submitting one is what makes
the app raise at-risk flags.

Every builder returns a small record whose ids are plain ints, so a test never
touches a detached ORM object.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from itertools import count
from typing import Any
from uuid import uuid4

from httpx import AsyncClient

from app.core.jwt import issue_access_token
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.enums.at_risk import AtRiskFlagStatus, AtRiskReason
from app.enums.cohort import CohortMemberStatus, CohortStatus
from app.enums.content import (
    ContentStatus,
    ContentType,
    ContentVisibility,
    StimulusLevel,
)
from app.enums.curriculum import StructureStatus
from app.enums.strand_test import StrandTestType
from app.enums.user import Gender, UserRole
from app.models.at_risk_flag import AtRiskFlag
from app.models.cohort import Cohort, CohortFacilitator, CohortLearner
from app.models.cohort_content import CohortContent
from app.models.content import Content
from app.models.content_evaluation import ContentEvaluation
from app.models.facilitator import Facilitator
from app.models.learner import Learner
from app.models.learner_content_progress import LearnerContentProgress
from app.models.learning_strand import LearningStrand
from app.models.lesson import Lesson
from app.models.lri_test import LRITest, LRITestItem
from app.models.lri_test_attempt import LRITestAttempt
from app.models.module import Module
from app.models.participant_intake import ParticipantIntake
from app.models.refresh_token import RefreshToken
from app.models.strand_test import StrandTest, StrandTestItem, StrandTestItemOption
from app.models.strand_test_attempt import StrandTestAttempt, StrandTestAttemptAnswer
from app.models.user import User
from app.models.user_profile import UserProfile
from app.services.cohort import DIVISION_PREFIX
from app.services.user import UserService

# The one password every test account gets. It exists only in the test database.
TEST_PASSWORD = "Test-Passw0rd!"

_password_hash: str | None = None


def _hashed_test_password() -> str:
    """Hashed once per run: argon2 is slow on purpose, and every account shares the password."""
    global _password_hash
    if _password_hash is None:
        _password_hash = hash_password(TEST_PASSWORD)
    return _password_hash


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def naive_utc(value: datetime | None) -> datetime | None:
    """The database stores UTC without a zone."""
    if value is None:
        return None
    if value.tzinfo is None:
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)


# ── Records ──────────────────────────────────────────────────────────────────


@dataclass
class UserRecord:
    id: int
    id_no: str
    role: str
    first_name: str
    last_name: str
    password: str = TEST_PASSWORD
    learner_id: int | None = None
    facilitator_id: int | None = None

    @property
    def name(self) -> str:
        return f"{self.first_name} {self.last_name}"


@dataclass
class CohortRecord:
    id: int
    name: str
    code: str
    school_year: str
    status: str


@dataclass
class StrandRecord:
    id: int
    code: str
    name: str


@dataclass
class NodeRecord:
    """A module, lesson, or content item."""

    id: int
    title: str
    parent_id: int | None = None
    file_key: str | None = None


@dataclass
class ItemRecord:
    item_id: int
    correct_option_id: int
    wrong_option_id: int


@dataclass
class StrandTestRecord:
    id: int
    strand_id: int
    type: str
    title: str
    items: list[ItemRecord] = field(default_factory=list)

    def answers(self, correct: int) -> dict[str, Any]:
        """A submission body with the first `correct` items right and the rest wrong."""
        return {
            "answers": [
                {
                    "item_id": item.item_id,
                    "option_id": item.correct_option_id if index < correct else item.wrong_option_id,
                }
                for index, item in enumerate(self.items)
            ]
        }


@dataclass
class LriTestRecord:
    id: int
    item_ids: list[int]


def bearer(user: UserRecord) -> dict[str, str]:
    """Auth headers from a token minted directly. For SETUP calls only: a test's
    own requests log in through the API (see the `login` fixture)."""
    return {"Authorization": f"Bearer {issue_access_token(user.id)}"}


# ── The factory ──────────────────────────────────────────────────────────────


class Factory:
    def __init__(self, client: AsyncClient, storage: Any):
        self._client = client
        self._storage = storage
        self._serial = count(1)
        self._system_admin: UserRecord | None = None

    async def _save(self, *rows: Any) -> None:
        async with AsyncSessionLocal() as session, session.begin():
            session.add_all(rows)
            # The flush assigns the ids, which is all the callers read back.
            await session.flush()

    # ── People ──

    async def user(
        self,
        role: UserRole | str,
        first_name: str | None = None,
        last_name: str = "Tester",
        *,
        is_active: bool = True,
        must_change_password: bool = False,
        is_super_admin: bool = False,
    ) -> UserRecord:
        role = UserRole(role)
        first_name = first_name or f"{role.value.title()}{next(self._serial)}"
        async with AsyncSessionLocal() as session, session.begin():
            user = User(
                password_hash=_hashed_test_password(),
                role=role,
                is_active=is_active,
                must_change_password=must_change_password,
                is_super_admin=is_super_admin,
            )
            session.add(user)
            await session.flush()
            user.id_no = UserService._generate_id_no(user.id)
            session.add(UserProfile(user_id=user.id, first_name=first_name, last_name=last_name))
            record = UserRecord(id=user.id, id_no=user.id_no, role=role.value, first_name=first_name, last_name=last_name)
            if role == UserRole.LEARNER:
                learner = Learner(user_id=user.id)
                session.add(learner)
                await session.flush()
                record.learner_id = learner.id
            elif role == UserRole.FACILITATOR:
                facilitator = Facilitator(user_id=user.id)
                session.add(facilitator)
                await session.flush()
                record.facilitator_id = facilitator.id
        return record

    async def profile_details(self, user: UserRecord, **fields: Any) -> None:
        """Fills in personal fields of a user's profile (birthdate, gender, civil_status,
        address, contact_number, contact_email), e.g. to check they are never exposed."""
        async with AsyncSessionLocal() as session, session.begin():
            profile = await session.get(UserProfile, user.id)
            for name, value in fields.items():
                assert hasattr(profile, name), name
                setattr(profile, name, value)

    async def admin(self, first_name: str | None = None, **kwargs: Any) -> UserRecord:
        return await self.user(UserRole.ADMIN, first_name, **kwargs)

    async def facilitator(self, first_name: str | None = None, **kwargs: Any) -> UserRecord:
        return await self.user(UserRole.FACILITATOR, first_name, **kwargs)

    async def learner(self, first_name: str | None = None, **kwargs: Any) -> UserRecord:
        return await self.user(UserRole.LEARNER, first_name, **kwargs)

    async def system_admin(self) -> UserRecord:
        """An admin to stand as "created by" or "assigned by" when a test does not care who."""
        if self._system_admin is None:
            self._system_admin = await self.admin("System", last_name="Administrator", is_super_admin=True)
        return self._system_admin

    async def refresh_token(
        self,
        user: UserRecord,
        *,
        created_at: datetime | None = None,
        expires_at: datetime | None = None,
        is_revoked: bool = False,
    ) -> int:
        """A refresh token row: what the app reads as "this account signed in at created_at".
        The stored hash matches no real token, so it cannot be used to refresh."""
        created = created_at or utc_now()
        row = RefreshToken(
            user_id=user.id,
            token_hash="not-a-real-token",
            jti=uuid4(),
            is_revoked=is_revoked,
            created_at=naive_utc(created),
            expires_at=naive_utc(expires_at or created.replace(year=created.year + 1)),
        )
        await self._save(row)
        return row.id

    # ── Cohorts ──

    async def cohort(
        self,
        name: str | None = None,
        *,
        school_year: str = "2026-2027",
        status: CohortStatus | str = CohortStatus.ACTIVE,
        created_by: UserRecord | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> CohortRecord:
        by = created_by or await self.system_admin()
        first_year = int(school_year.split("-")[0])
        async with AsyncSessionLocal() as session, session.begin():
            cohort = Cohort(
                created_by=by.id,
                name=name or f"Cohort {next(self._serial)}",
                school_year=school_year,
                status=CohortStatus(status),
                start_date=start_date or date(first_year, 6, 1),
                end_date=end_date or date(first_year + 1, 3, 31),
            )
            session.add(cohort)
            await session.flush()
            # The same code the cohort service generates.
            cohort.code = f"{DIVISION_PREFIX}-{school_year}-{cohort.id:04d}"
            record = CohortRecord(id=cohort.id, name=cohort.name, code=cohort.code, school_year=school_year, status=CohortStatus(status).value)
        return record

    async def assign_facilitator(
        self,
        cohort: CohortRecord,
        facilitator: UserRecord,
        *,
        status: CohortMemberStatus | str = CohortMemberStatus.ACTIVE,
        assigned_at: datetime | None = None,
        ended_at: datetime | None = None,
        assigned_by: UserRecord | None = None,
    ) -> int:
        by = assigned_by or await self.system_admin()
        status = CohortMemberStatus(status)
        row = CohortFacilitator(
            cohort_id=cohort.id,
            facilitator_id=facilitator.facilitator_id,
            status=status,
            assigned_by=by.id,
            assigned_at=naive_utc(assigned_at or utc_now()),
            ended_at=naive_utc(ended_at or (utc_now() if status == CohortMemberStatus.ENDED else None)),
        )
        await self._save(row)
        return row.id

    async def assign_learner(
        self,
        cohort: CohortRecord,
        learner: UserRecord,
        *,
        status: CohortMemberStatus | str = CohortMemberStatus.ACTIVE,
        assigned_at: datetime | None = None,
        ended_at: datetime | None = None,
        assigned_by: UserRecord | None = None,
    ) -> int:
        by = assigned_by or await self.system_admin()
        status = CohortMemberStatus(status)
        row = CohortLearner(
            cohort_id=cohort.id,
            learner_id=learner.learner_id,
            status=status,
            assigned_by=by.id,
            assigned_at=naive_utc(assigned_at or utc_now()),
            # The model calls a membership's end date completed_at.
            completed_at=naive_utc(ended_at or (utc_now() if status == CohortMemberStatus.ENDED else None)),
        )
        await self._save(row)
        return row.id

    # ── Curriculum ──

    async def strand(self, code: str, name: str | None = None, *, status: StructureStatus | str = StructureStatus.ACTIVE) -> StrandRecord:
        row = LearningStrand(code=code, name=name or f"Strand {code}", status=StructureStatus(status))
        await self._save(row)
        return StrandRecord(id=row.id, code=code, name=row.name)

    async def module(
        self,
        strand: StrandRecord,
        title: str | None = None,
        *,
        order_index: int | None = None,
        status: StructureStatus | str = StructureStatus.ACTIVE,
        created_by: UserRecord | None = None,
        description: str | None = None,
    ) -> NodeRecord:
        row = Module(
            strand_id=strand.id,
            title=title or f"Module {next(self._serial)}",
            description=description,
            order_index=order_index if order_index is not None else next(self._serial),
            status=StructureStatus(status),
            created_by=created_by.id if created_by else None,
        )
        await self._save(row)
        return NodeRecord(id=row.id, title=row.title, parent_id=strand.id)

    async def lesson(
        self,
        module: NodeRecord,
        title: str | None = None,
        *,
        order_index: int | None = None,
        status: StructureStatus | str = StructureStatus.ACTIVE,
        created_by: UserRecord | None = None,
        description: str | None = None,
    ) -> NodeRecord:
        row = Lesson(
            module_id=module.id,
            title=title or f"Lesson {next(self._serial)}",
            description=description,
            order_index=order_index if order_index is not None else next(self._serial),
            status=StructureStatus(status),
            created_by=created_by.id if created_by else None,
        )
        await self._save(row)
        return NodeRecord(id=row.id, title=row.title, parent_id=module.id)

    async def content(
        self,
        lesson: NodeRecord,
        title: str | None = None,
        *,
        uploaded_by: UserRecord,
        visibility: ContentVisibility | str = ContentVisibility.PRIVATE,
        type: ContentType | str = ContentType.READING,
        status: ContentStatus | str = ContentStatus.ACTIVE,
        description: str | None = None,
        in_storage: bool = True,
    ) -> NodeRecord:
        """A content row whose file is "in" the fake storage (unless in_storage=False)."""
        file_key = f"learning-contents/{uuid4()}_test-file.pdf"
        row = Content(
            lesson_id=lesson.id,
            file_key=file_key,
            title=title or f"Content {next(self._serial)}",
            description=description,
            type=ContentType(type),
            status=ContentStatus(status),
            visibility=ContentVisibility(visibility),
            uploaded_by=uploaded_by.id,
        )
        await self._save(row)
        if in_storage:
            self._storage.keys.add(file_key)
        return NodeRecord(id=row.id, title=row.title, parent_id=lesson.id, file_key=file_key)

    async def assign_content(self, cohort: CohortRecord, content: NodeRecord, *, assigned_by: UserRecord) -> int:
        row = CohortContent(cohort_id=cohort.id, content_id=content.id, assigned_by=assigned_by.id)
        await self._save(row)
        return row.id

    async def evaluation(self, content: NodeRecord, *, stimulus_level: StimulusLevel | str = StimulusLevel.MEDIUM, rating: float = 0.5) -> int:
        row = ContentEvaluation(content_id=content.id, stimulus_level=StimulusLevel(stimulus_level), cognitive_sustainability_rating=rating)
        await self._save(row)
        return row.id

    async def progress(
        self,
        learner: UserRecord,
        content: NodeRecord,
        *,
        status: str = "completed",
        last_accessed_at: datetime | None = None,
        completed_at: datetime | None = None,
    ) -> int:
        """A learner's progress row for one content item, seeded directly.

        The table holds two times and no status column: a row is completed when
        completed_at is set. `status` says which row to build: "completed"
        (opened and finished), "in_progress" (opened, not finished), or
        "not_opened" (a row with neither time)."""
        if status not in ("completed", "in_progress", "not_opened"):
            raise ValueError(f"Unknown progress status: {status}")
        accessed = last_accessed_at or (None if status == "not_opened" else utc_now())
        row = LearnerContentProgress(
            learner_id=learner.learner_id,
            content_id=content.id,
            last_accessed_at=naive_utc(accessed),
            completed_at=naive_utc(completed_at or (accessed if status == "completed" else None)),
        )
        await self._save(row)
        return row.id

    # ── Tests and attempts ──

    async def strand_test(self, strand: StrandRecord, type: StrandTestType | str, *, items: int = 4, title: str | None = None) -> StrandTestRecord:
        """A strand test of `items` questions, each with one correct and one wrong option.
        Four items give the scores 0, 25, 50, 75 and 100."""
        type = StrandTestType(type)
        record = StrandTestRecord(id=0, strand_id=strand.id, type=type.value, title=title or f"{strand.code} {type.value}")
        async with AsyncSessionLocal() as session, session.begin():
            test = StrandTest(strand_id=strand.id, title=record.title, type=type)
            session.add(test)
            await session.flush()
            record.id = test.id
            for number in range(1, items + 1):
                item = StrandTestItem(test_id=test.id, question_text=f"Question {number}")
                session.add(item)
                await session.flush()
                right = StrandTestItemOption(item_id=item.id, option_text="right", is_correct=True)
                wrong = StrandTestItemOption(item_id=item.id, option_text="wrong", is_correct=False)
                session.add_all([right, wrong])
                await session.flush()
                record.items.append(ItemRecord(item_id=item.id, correct_option_id=right.id, wrong_option_id=wrong.id))
        return record

    async def strand_test_item(self, test: StrandTestRecord, *, correct: list[bool], question: str | None = None) -> tuple[int, list[int]]:
        """One more item on a test, with an option per entry of `correct`. Unlike
        strand_test() it can make a broken item: no correct option, or several.
        Returns (item id, option ids). The item is not added to test.items."""
        async with AsyncSessionLocal() as session, session.begin():
            item = StrandTestItem(test_id=test.id, question_text=question or f"Extra question {next(self._serial)}")
            session.add(item)
            await session.flush()
            options = [StrandTestItemOption(item_id=item.id, option_text=f"option {number}", is_correct=flag) for number, flag in enumerate(correct, 1)]
            session.add_all(options)
            await session.flush()
            result = (item.id, [option.id for option in options])
        return result

    async def lri_test(self, *, items: int = 3, title: str = "Learner Readiness Inventory") -> LriTestRecord:
        async with AsyncSessionLocal() as session, session.begin():
            test = LRITest(title=title, description="Readiness inventory")
            session.add(test)
            await session.flush()
            rows = [LRITestItem(test_id=test.id, question_text=f"Statement {number}") for number in range(1, items + 1)]
            session.add_all(rows)
            await session.flush()
            record = LriTestRecord(id=test.id, item_ids=[row.id for row in rows])
        return record

    async def intake(self, learner: UserRecord, *, age: int = 25, submitted_at: datetime | None = None, **overrides: Any) -> None:
        values: dict[str, Any] = {
            "age": age,
            "sex": Gender.FEMALE,
            "civil_status": "Single",
            "highest_educational_attainment": "Grade 10",
            "als_learning_strands": ["LS1-EN"],
            "als_enrollment_months": 6,
            "has_taken_ae_test": False,
            "ae_test_attempt_count": 0,
            "submitted_at": naive_utc(submitted_at or utc_now()),
        }
        values.update(overrides)
        await self._save(ParticipantIntake(user_id=learner.id, **values))

    async def lri_attempt(self, learner: UserRecord, test: LriTestRecord, *, score: float = 3.0, submitted_at: datetime | None = None) -> int:
        row = LRITestAttempt(test_id=test.id, learner_id=learner.learner_id, lri_score=score, submitted_at=naive_utc(submitted_at or utc_now()))
        await self._save(row)
        return row.id

    async def _has(self, model: Any, **filters: Any) -> bool:
        from sqlalchemy import select

        async with AsyncSessionLocal() as session:
            statement = select(model).filter_by(**filters).limit(1)
            return (await session.execute(statement)).first() is not None

    async def count(self, model: Any, **filters: Any) -> int:
        """How many rows of a model match, read straight from the test database.
        For facts the API does not expose, such as progress rows surviving an unassign."""
        from sqlalchemy import func, select

        async with AsyncSessionLocal() as session:
            statement = select(func.count()).select_from(model).filter_by(**filters)
            return (await session.execute(statement)).scalar_one()

    async def fetch(self, model: Any, **filters: Any) -> list[dict[str, Any]]:
        """Rows of a model as plain dicts, ordered by id, read straight from the test
        database. For comparing stored state exactly, e.g. before and after a refresh."""
        from sqlalchemy import select

        async with AsyncSessionLocal() as session:
            rows = (await session.execute(select(model).filter_by(**filters).order_by(model.id))).scalars().all()
            return [{column.name: getattr(row, column.name) for column in model.__table__.columns} for row in rows]

    async def ready_for_pretest(self, learner: UserRecord) -> None:
        """What the app requires before a pretest: an intake and an attempt at every LRI test."""
        from sqlalchemy import select

        if not await self._has(ParticipantIntake, user_id=learner.id):
            await self.intake(learner)
        async with AsyncSessionLocal() as session:
            test_ids = list((await session.execute(select(LRITest.id))).scalars())
        for test_id in test_ids:
            if not await self._has(LRITestAttempt, test_id=test_id, learner_id=learner.learner_id):
                await self.lri_attempt(learner, LriTestRecord(id=test_id, item_ids=[]))

    async def attempt(
        self,
        learner: UserRecord,
        test: StrandTestRecord,
        *,
        correct: int,
        through_api: bool = True,
        taken_at: datetime | None = None,
        item_count: int | None = None,
    ) -> int:
        """A strand test attempt with `correct` right answers out of the test's items.

        Through the API (the default) the app runs its own rules, including
        raising or resolving at-risk flags; the learner is given an intake and
        LRI attempts first when the test is a pretest. With through_api=False
        the rows are written directly, e.g. to date an attempt in the past.
        With through_api=False an `item_count` may also be given, to record a
        score out of any number of items (2999 of 4000); no answer rows are
        written then, since the test has no such items.
        """
        if through_api:
            assert taken_at is None and item_count is None, "taken_at and item_count need through_api=False"
            if test.type == StrandTestType.PRETEST.value:
                await self.ready_for_pretest(learner)
            response = await self._client.post(f"/api/learner/strand-tests/{test.id}/attempts", json=test.answers(correct), headers=bearer(learner))
            assert response.status_code == 201, f"attempt setup failed: {response.status_code} {response.text[:300]}"
            return response.json()["attempt_id"]

        async with AsyncSessionLocal() as session, session.begin():
            attempt = StrandTestAttempt(
                test_id=test.id,
                learner_id=learner.learner_id,
                total_score=correct,
                item_count=item_count if item_count is not None else len(test.items),
                taken_at=naive_utc(taken_at or utc_now()),
            )
            session.add(attempt)
            await session.flush()
            for index, item in enumerate(test.items if item_count is None else []):
                right = index < correct
                session.add(
                    StrandTestAttemptAnswer(
                        attempt_id=attempt.id,
                        item_id=item.item_id,
                        option_id=item.correct_option_id if right else item.wrong_option_id,
                        is_correct=right,
                    )
                )
            attempt_id = attempt.id
        return attempt_id

    # ── At-risk flags ──

    async def flag(
        self,
        learner: UserRecord,
        cohort: CohortRecord,
        *,
        reason: AtRiskReason | str = AtRiskReason.LOW_MPS,
        strand: StrandRecord | None = None,
        trigger_value: float | None = 50,
        status: AtRiskFlagStatus | str = AtRiskFlagStatus.OPEN,
        detected_at: datetime | None = None,
        resolved_at: datetime | None = None,
        reviewed_by: UserRecord | None = None,
        note: str | None = None,
    ) -> int:
        """A flag written directly, for states that are awkward to reach through the app."""
        row = AtRiskFlag(
            learner_id=learner.learner_id,
            cohort_id=cohort.id,
            reason=AtRiskReason(reason),
            strand_id=strand.id if strand else None,
            trigger_value=trigger_value,
            status=AtRiskFlagStatus(status),
            detected_at=naive_utc(detected_at or utc_now()),
            resolved_at=naive_utc(resolved_at),
            reviewed_by=reviewed_by.id if reviewed_by else None,
            reviewed_at=naive_utc(utc_now()) if reviewed_by else None,
            note=note,
        )
        await self._save(row)
        return row.id


# ── The Part A cast ──────────────────────────────────────────────────────────


@dataclass
class Cast:
    """The people, cohorts, curriculum and attempts of Part A of M05-test-cases.md."""

    adm: UserRecord
    fa: UserRecord
    fb: UserRecord
    fc: UserRecord
    l1: UserRecord
    l2: UserRecord
    l3: UserRecord
    l4: UserRecord
    l5: UserRecord
    l6: UserRecord
    l7: UserRecord
    s1: CohortRecord
    a1: CohortRecord
    a2: CohortRecord
    b1: CohortRecord
    u1: CohortRecord
    x1: CohortRecord
    strands: dict[str, StrandRecord]
    pretests: dict[str, StrandTestRecord]
    posttests: dict[str, StrandTestRecord]
    lri: LriTestRecord
    m_a: NodeRecord
    m_b: NodeRecord
    ls_1: NodeRecord
    ls_2: NodeRecord
    ls_3: NodeRecord
    c_fa_priv: NodeRecord
    c_fa_pub: NodeRecord
    c_fb_priv: NodeRecord
    c_fb_pub: NodeRecord


STRAND_CODES = ("LS1-EN", "LS1-FIL", "LS3")


async def build_cast(make: Factory) -> Cast:
    """Builds Part A. Tests have four items, so scores are 0, 25, 50, 75 or 100.

    - L1: pretest 50 and posttest 100 in all three strands.
    - L2: pretest 50 and posttest 50 in LS1-EN only, so the app flags L2 in S1.
    - L3: pretest 50 in LS1-EN only.
    - L4: nothing, and no sign-in on record.
    - L1, L2 and L3 each have a sign-in on record dated now.
    - No content is assigned to a cohort and no progress rows exist; tests add those.
    """
    adm = await make.admin("Adm", is_super_admin=True)
    make._system_admin = adm
    fa, fb, fc = [await make.facilitator(name) for name in ("FA", "FB", "FC")]
    learners = [await make.learner(f"L{number}") for number in range(1, 8)]
    l1, l2, l3, l4, l5, l6, l7 = learners

    s1 = await make.cohort("S1", school_year="2026-2027", status="active")
    a1 = await make.cohort("A1", school_year="2026-2027", status="active")
    a2 = await make.cohort("A2", school_year="2025-2026", status="completed")
    b1 = await make.cohort("B1", school_year="2026-2027", status="active")
    u1 = await make.cohort("U1", school_year="2026-2027", status="upcoming")
    x1 = await make.cohort("X1", school_year="2026-2027", status="archived")

    for cohort in (s1, a1, a2, u1, x1):
        await make.assign_facilitator(cohort, fa)
    for cohort in (s1, b1):
        await make.assign_facilitator(cohort, fb)

    for learner in (l1, l2, l3, l4):
        await make.assign_learner(s1, learner)
    await make.assign_learner(s1, l5, status="ended")
    await make.assign_learner(b1, l6)
    await make.assign_learner(a2, l7, status="ended")
    await make.assign_learner(a1, l7)

    strands = {code: await make.strand(code) for code in STRAND_CODES}
    pretests = {code: await make.strand_test(strands[code], "pretest") for code in STRAND_CODES}
    posttests = {code: await make.strand_test(strands[code], "posttest") for code in STRAND_CODES}
    lri = await make.lri_test()

    english = strands["LS1-EN"]
    m_a = await make.module(english, "Module M-A", order_index=1, created_by=fa)
    m_b = await make.module(english, "Module M-B", order_index=2, created_by=fa)
    ls_1 = await make.lesson(m_a, "LS-1", order_index=1, created_by=fa)
    ls_2 = await make.lesson(m_a, "LS-2", order_index=2, created_by=fa)
    ls_3 = await make.lesson(m_b, "LS-3", order_index=1, created_by=fa)

    c_fa_priv = await make.content(ls_1, "C-FA-PRIV", uploaded_by=fa, visibility="private")
    c_fa_pub = await make.content(ls_1, "C-FA-PUB", uploaded_by=fa, visibility="public")
    c_fb_priv = await make.content(ls_1, "C-FB-PRIV", uploaded_by=fb, visibility="private")
    c_fb_pub = await make.content(ls_1, "C-FB-PUB", uploaded_by=fb, visibility="public")

    for code in STRAND_CODES:
        await make.attempt(l1, pretests[code], correct=2)
        await make.attempt(l1, posttests[code], correct=4)
    await make.attempt(l2, pretests["LS1-EN"], correct=2)
    await make.attempt(l2, posttests["LS1-EN"], correct=2)
    await make.attempt(l3, pretests["LS1-EN"], correct=2)

    for learner in (l1, l2, l3):
        await make.refresh_token(learner)

    return Cast(
        adm=adm, fa=fa, fb=fb, fc=fc,
        l1=l1, l2=l2, l3=l3, l4=l4, l5=l5, l6=l6, l7=l7,
        s1=s1, a1=a1, a2=a2, b1=b1, u1=u1, x1=x1,
        strands=strands, pretests=pretests, posttests=posttests, lri=lri,
        m_a=m_a, m_b=m_b, ls_1=ls_1, ls_2=ls_2, ls_3=ls_3,
        c_fa_priv=c_fa_priv, c_fa_pub=c_fa_pub, c_fb_priv=c_fb_priv, c_fb_pub=c_fb_pub,
    )
