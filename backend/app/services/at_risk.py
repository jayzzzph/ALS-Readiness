from collections.abc import Collection, Iterable
from dataclasses import dataclass
from datetime import date, datetime, timezone

from sqlalchemy import Row

from app.core.constants import (
    AT_RISK_INACTIVITY_DAYS,
    AT_RISK_MPS_THRESHOLD,
    AT_RISK_READINESS_ENABLED,
    MANILA_UTC_OFFSET,
)
from app.core.exceptions import (
    AtRiskFlagClosedError,
    CohortAccessDeniedError,
    InvalidAtRiskFlagTransitionError,
)
from app.enums.at_risk import ACTIVE_FLAG_STATUSES, AtRiskFlagStatus, AtRiskReason
from app.models.cohort import Cohort, CohortLearner
from app.models.strand_test_attempt import StrandTestAttempt
from app.models.user import User
from app.repositories.at_risk_flag import AtRiskFlagRepository
from app.repositories.cohort_learner import CohortLearnerRepository
from app.repositories.learner import LearnerRepository
from app.schemas.at_risk import (
    AtRiskCohort,
    AtRiskFlagItem,
    AtRiskFlagListResponse,
    AtRiskFlagSummary,
    AtRiskFlagUpdate,
    AtRiskLearner,
    AtRiskStatusFilter,
)
from app.services.facilitator_scope import FacilitatorScopeService
from app.services.scoring import compute_mps

# An active membership in an active cohort: the only kind the rules look at.
Member = tuple[CohortLearner, Cohort]
# What a flag is about: (learner_id, cohort_id, reason, strand_id).
FlagKey = tuple[int, int, AtRiskReason, int | None]

# The statuses each list filter shows. None means every status.
STATUS_FILTERS: dict[str, tuple[AtRiskFlagStatus, ...] | None] = {
    "active": ACTIVE_FLAG_STATUSES,
    "open": (AtRiskFlagStatus.OPEN,),
    "reviewed": (AtRiskFlagStatus.REVIEWED,),
    "dismissed": (AtRiskFlagStatus.DISMISSED,),
    "resolved": (AtRiskFlagStatus.RESOLVED,),
    "all": None,
}


@dataclass(frozen=True)
class AtRiskCondition:
    """A rule that holds for a learner right now."""

    learner_id: int
    cohort_id: int
    reason: AtRiskReason
    strand_id: int | None
    trigger_value: float

    @property
    def key(self) -> FlagKey:
        return (self.learner_id, self.cohort_id, self.reason, self.strand_id)


# ================ Time ================
# Stored timestamps are naive and hold UTC. The current time is handed in by
# the caller, never read here.

def to_naive_utc(value: datetime) -> datetime:
    if value.tzinfo is not None:
        return value.astimezone(timezone.utc).replace(tzinfo=None)

    return value


def manila_date(value: datetime) -> date:
    """The calendar date in Manila at the given naive UTC time."""
    return (value + MANILA_UTC_OFFSET).date()


# ================ Rules ================

def low_mps_conditions(
    members: Iterable[Member],
    posttests: Iterable[tuple[StrandTestAttempt, int]],
) -> list[AtRiskCondition]:
    """Per active strand: the learner's latest posttest has an MPS below the
    threshold. Pretests never count (D6), and neither does an attempt with no
    items.

    `posttests` are (attempt, strand id) rows for posttests in active strands
    only, oldest first.
    """
    latest_posttest: dict[tuple[int, int], StrandTestAttempt] = {}
    for attempt, strand_id in posttests:
        latest_posttest[(attempt.learner_id, strand_id)] = attempt

    cohort_by_learner = {membership.learner_id: cohort.id for membership, cohort in members}

    conditions = []
    for (learner_id, strand_id), attempt in latest_posttest.items():
        mps = compute_mps(attempt.total_score, attempt.item_count)
        if learner_id in cohort_by_learner and mps is not None and mps < AT_RISK_MPS_THRESHOLD:
            conditions.append(
                AtRiskCondition(
                    learner_id=learner_id,
                    cohort_id=cohort_by_learner[learner_id],
                    reason=AtRiskReason.LOW_MPS,
                    strand_id=strand_id,
                    trigger_value=mps,
                )
            )
    return conditions


def inactive_conditions(
    members: Iterable[Member],
    last_active: dict[int, datetime],
    today: date,
) -> list[AtRiskCondition]:
    """The learner has gone the threshold number of days, or more, without
    activity. `today` is the current date in Manila.

    Days are counted from the latest of three Manila dates: when the learner
    was last active (D5), when they were assigned to the cohort, and the
    cohort's start date if it has one. So activity from before the learner
    joined never counts against them, and a learner who was never active is
    counted from their assignment or the cohort's start.
    """
    conditions = []
    for membership, cohort in members:
        since = manila_date(membership.assigned_at)
        if membership.learner_id in last_active:
            since = max(since, manila_date(last_active[membership.learner_id]))
        if cohort.start_date is not None:
            since = max(since, cohort.start_date)

        days = (today - since).days
        if days >= AT_RISK_INACTIVITY_DAYS:
            conditions.append(
                AtRiskCondition(
                    learner_id=membership.learner_id,
                    cohort_id=cohort.id,
                    reason=AtRiskReason.INACTIVE,
                    strand_id=None,
                    trigger_value=float(days),
                )
            )
    return conditions


def low_readiness_conditions(members: Iterable[Member]) -> list[AtRiskCondition]:
    """Switched off until M03 provides readiness (D1). It reads no readiness
    data and flags nobody."""
    if not AT_RISK_READINESS_ENABLED:
        return []

    # Phase 9 adds the rule here, once M03 says where readiness is stored.
    return []


# ================ Service ================

class AtRiskService:
    """At-risk flags: the refresh that opens and resolves them, and the
    facilitator's review of them.

    There is no scheduler (D5). Flags are brought up to date by `refresh`,
    which the read endpoints call before they read. Every method that needs
    the current time takes it as `now`.
    """

    def __init__(
        self,
        flag_repo: AtRiskFlagRepository,
        cohort_learner_repo: CohortLearnerRepository,
        learner_repo: LearnerRepository,
        facilitator_scope_service: FacilitatorScopeService,
    ):
        self._flag_repo = flag_repo
        self._cohort_learner_repo = cohort_learner_repo
        self._learner_repo = learner_repo
        self._facilitator_scope_service = facilitator_scope_service

    async def refresh(self, cohort_ids: Collection[int], now: datetime) -> None:
        """Bring the flags of the given cohorts up to date, in a fixed number of
        queries however many learners there are.

        Only active cohorts are looked at; the flags of any other cohort are
        left exactly as they are. Within an active cohort the rules hold only
        for active memberships, so the flags of a learner whose membership
        has ended are closed like any other whose condition has cleared.

        Running it again with nothing changed writes nothing.
        """
        now = to_naive_utc(now)

        members = await self._cohort_learner_repo.get_active_in_active_cohorts(cohort_ids)
        learner_ids = {membership.learner_id for membership, _ in members}
        posttests = await self._flag_repo.get_posttests_in_active_strands(learner_ids)
        last_active = await self._learner_repo.get_last_active_by_ids(learner_ids)

        conditions = {
            condition.key: condition
            for condition in (
                *low_mps_conditions(members, posttests),
                *inactive_conditions(members, last_active, manila_date(now)),
                *low_readiness_conditions(members),
            )
        }

        # Not limited to the members above: an active cohort can hold flags of
        # learners who have since left it, and may have no active member at all.
        flags = await self._flag_repo.get_unresolved_in_active_cohorts(cohort_ids)

        changes = []
        # Conditions that already have a flag in a running episode. A dismissed
        # one counts, which is what keeps it from being reopened.
        flagged: set[FlagKey] = set()
        for flag in flags:
            key = (flag.learner_id, flag.cohort_id, flag.reason, flag.strand_id)
            condition = conditions.get(key)
            is_active = flag.status in ACTIVE_FLAG_STATUSES

            if condition is None:
                # The condition cleared, the learner left the cohort, or the
                # strand was archived. Each ends the episode, and a later
                # recurrence opens a new flag.
                fields = {"resolved_at": now}
                if is_active:
                    fields["status"] = AtRiskFlagStatus.RESOLVED
                changes.append((flag, fields))
                continue

            flagged.add(key)
            if is_active and flag.trigger_value != condition.trigger_value:
                changes.append((flag, {"trigger_value": condition.trigger_value}))

        new_conditions = sorted(
            (condition for key, condition in conditions.items() if key not in flagged),
            key=lambda c: (c.learner_id, c.cohort_id, c.reason.value, c.strand_id or 0),
        )

        await self._flag_repo.update_many(changes)
        await self._flag_repo.create_many(
            [
                {
                    "learner_id": condition.learner_id,
                    "cohort_id": condition.cohort_id,
                    "reason": condition.reason,
                    "strand_id": condition.strand_id,
                    "trigger_value": condition.trigger_value,
                    "status": AtRiskFlagStatus.OPEN,
                    "detected_at": now,
                }
                for condition in new_conditions
            ]
        )

    async def get_list(
        self,
        user: User,
        now: datetime,
        *,
        cohort_id: int | None,
        school_year: str | None,
        status: AtRiskStatusFilter,
        reason: AtRiskReason | None,
        page: int,
        page_size: int,
    ) -> AtRiskFlagListResponse:
        if cohort_id is not None:
            await self._facilitator_scope_service.assert_cohort_access(user, cohort_id)
            cohort_ids = [cohort_id]
        else:
            cohorts = await self._facilitator_scope_service.get_visible_cohorts(user)
            cohort_ids = [
                cohort.id
                for cohort in cohorts
                if school_year is None or cohort.school_year == school_year
            ]

        await self.refresh(cohort_ids, now)

        statuses = STATUS_FILTERS[status]
        rows = await self._flag_repo.get_page(
            cohort_ids, statuses, reason, offset=(page - 1) * page_size, limit=page_size
        )
        total = await self._flag_repo.count(cohort_ids, statuses, reason)

        return AtRiskFlagListResponse(
            items=[self._to_item(row) for row in rows],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def update(
        self,
        user: User,
        flag_id: int,
        data: AtRiskFlagUpdate,
        now: datetime,
    ) -> AtRiskFlagItem:
        flag = await self._flag_repo.get_by_id(flag_id)
        # A flag that does not exist and one in a cohort the caller cannot see
        # are denied alike.
        if flag is None:
            raise CohortAccessDeniedError()
        await self._facilitator_scope_service.assert_cohort_access(user, flag.cohort_id)

        # Once the condition has cleared the episode is over, for a resolved
        # flag and a dismissed one alike.
        if flag.status == AtRiskFlagStatus.RESOLVED or flag.resolved_at is not None:
            raise AtRiskFlagClosedError()

        # Open, reviewed, and dismissed may each move to either of the others.
        # Sending the status the flag already has is allowed only to edit the
        # note.
        status = AtRiskFlagStatus(data.status)
        if status == flag.status and "note" not in data.model_fields_set:
            raise InvalidAtRiskFlagTransitionError()

        fields = {"status": status}
        if status == AtRiskFlagStatus.OPEN:
            fields["reviewed_by"] = None
            fields["reviewed_at"] = None
        else:
            fields["reviewed_by"] = user.id
            fields["reviewed_at"] = to_naive_utc(now)
        if "note" in data.model_fields_set:
            fields["note"] = data.note

        await self._flag_repo.update(flag, fields)

        return self._to_item(await self._flag_repo.get_row(flag_id))

    async def get_active_reasons(
        self,
        memberships: Collection[tuple[int, int]],
    ) -> dict[tuple[int, int], list[AtRiskReason]]:
        """The reasons with an active flag for each (learner_id, cohort_id), in
        one query. Each reason appears once, in the order the enum lists them.
        Memberships with none are absent."""
        reasons = await self._flag_repo.get_active_reasons(
            {learner_id for learner_id, _ in memberships},
            {cohort_id for _, cohort_id in memberships},
        )
        return {
            key: [reason for reason in AtRiskReason if reason in found]
            for key, found in reasons.items()
        }

    async def get_active_flags(self, cohort_id: int) -> list[AtRiskFlagItem]:
        """Every active (open or reviewed) flag of the cohort, in one query, in
        the order the list endpoint shows them. Does not refresh."""
        rows = await self._flag_repo.get_page(
            [cohort_id], ACTIVE_FLAG_STATUSES, None, offset=0, limit=None
        )
        return [self._to_item(row) for row in rows]

    async def get_learner_flags(self, learner_id: int, cohort_id: int) -> list[AtRiskFlagSummary]:
        """Every flag of the learner in the cohort, newest first."""
        rows = await self._flag_repo.get_rows_by_learner_and_cohort(learner_id, cohort_id)
        return [AtRiskFlagSummary(**self._summary_fields(row)) for row in rows]

    @staticmethod
    def _summary_fields(row: Row) -> dict:
        flag, _, _, _, cohort_name, strand_code, reviewer_first_name, reviewer_last_name = row

        return {
            "id": flag.id,
            "cohort": AtRiskCohort(id=flag.cohort_id, name=cohort_name),
            "reason": flag.reason,
            "strand_id": flag.strand_id,
            "strand_code": strand_code,
            "trigger_value": flag.trigger_value,
            "status": flag.status,
            "detected_at": flag.detected_at,
            "resolved_at": flag.resolved_at,
            # Null when nobody reviewed it, or the reviewer has no profile.
            "reviewed_by_name": (
                " ".join(filter(None, (reviewer_first_name, reviewer_last_name))) or None
            ),
            "reviewed_at": flag.reviewed_at,
            "note": flag.note,
        }

    @classmethod
    def _to_item(cls, row: Row) -> AtRiskFlagItem:
        flag, id_no, first_name, last_name, *_ = row

        return AtRiskFlagItem(
            **cls._summary_fields(row),
            learner=AtRiskLearner(
                learner_id=flag.learner_id,
                id_no=id_no,
                first_name=first_name,
                last_name=last_name,
            ),
        )
