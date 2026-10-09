"""B7. At-risk flags (API-RSK-01 to 20).

Flags are brought up to date whenever they are read (there is no scheduler),
so every test reads them through GET /api/facilitator/at-risk and moves the
app's clock with the `clock` fixture. No test depends on the real date.

The thresholds come from app/core/constants.py, so the tests keep holding if
the ALS coordinator changes them:
    T = AT_RISK_MPS_THRESHOLD     a posttest MPS strictly below T is flagged
    N = AT_RISK_INACTIVITY_DAYS   N whole days without activity, or more, is flagged
Days are counted on the Philippine calendar (UTC+8). Every date below is
written in Philippine time with ph(); the database stores UTC.
"""

from __future__ import annotations

import asyncio
from collections import Counter
from datetime import date, datetime, timedelta, timezone
from types import SimpleNamespace

import pytest

from app.core.constants import (
    AT_RISK_INACTIVITY_DAYS,
    AT_RISK_MPS_THRESHOLD,
    AT_RISK_READINESS_ENABLED,
    MANILA_UTC_OFFSET,
)
from app.models.at_risk_flag import AtRiskFlag
from app.services.scoring import compute_mps
from tests.factories import naive_utc

AT_RISK = "/api/facilitator/at-risk"
T = AT_RISK_MPS_THRESHOLD
N = AT_RISK_INACTIVITY_DAYS
PHILIPPINE_TIME = timezone(MANILA_UTC_OFFSET)

# A score out of 100 that is below the threshold, and one that is not.
LOW = (T - 25, 100)
FINE = (T + 5, 100)


def ph(month: int, day: int, hour: int = 12, minute: int = 0) -> datetime:
    """A moment in 2026, in Philippine time."""
    return datetime(2026, month, day, hour, minute, tzinfo=PHILIPPINE_TIME)


def stored(moment: datetime) -> str:
    """How the API prints a moment: UTC, without a zone."""
    return naive_utc(moment).isoformat()


async def flags(client, headers, **params) -> list[dict]:
    """Reads the flags, which also refreshes them. Every status unless one is asked for."""
    response = await client.get(AT_RISK, headers=headers, params={"status": "all", "page_size": 100, **params})
    assert response.status_code == 200, response.text[:300]
    body = response.json()
    assert body["total"] == len(body["items"])
    return body["items"]


def brief(items: list[dict]) -> list[tuple]:
    """(learner first name, reason, strand code, status, trigger value), sorted."""
    return sorted((item["learner"]["first_name"], item["reason"], item["strand_code"] or "", item["status"], item["trigger_value"]) for item in items)


@pytest.fixture
async def risk(make, login) -> SimpleNamespace:
    """A facilitator with one active cohort (started 5 Jan 2026) and two strands with a posttest each.

    `member(name)` adds a learner assigned on 2 Feb 2026 unless told otherwise.
    `low_posttest` / `fine_posttest` record a posttest score directly.
    """
    fa = await make.facilitator("FA")
    cohort = await make.cohort("S1", start_date=date(2026, 1, 5), end_date=date(2026, 12, 18))
    await make.assign_facilitator(cohort, fa)
    english = await make.strand("LS1-EN")
    filipino = await make.strand("LS1-FIL")
    posttests = {"LS1-EN": await make.strand_test(english, "posttest"), "LS1-FIL": await make.strand_test(filipino, "posttest")}
    pretests = {"LS1-EN": await make.strand_test(english, "pretest")}

    async def member(name: str, *, assigned_at: datetime | None = None, cohort_=None):
        learner = await make.learner(name)
        await make.assign_learner(cohort_ or cohort, learner, assigned_at=assigned_at or ph(2, 2))
        return learner

    async def posttest(learner, score: tuple[int, int], strand: str = "LS1-EN"):
        return await make.attempt(learner, posttests[strand], correct=score[0], item_count=score[1], through_api=False)

    return SimpleNamespace(
        fa=fa, headers=await login(fa), cohort=cohort, english=english, filipino=filipino,
        posttests=posttests, pretests=pretests, member=member, posttest=posttest,
    )


# ── Low MPS ──────────────────────────────────────────────────────────────────


async def test_api_rsk_01_low_mps_boundary(client, make, risk, clock):
    """API-RSK-01: a posttest MPS just under the threshold is flagged; one exactly at the threshold is not."""
    clock.set(ph(3, 20))
    under = await risk.member("Under")
    exactly = await risk.member("Exactly")
    for learner in (under, exactly):
        await make.refresh_token(learner, created_at=clock.now)  # signed in today, so only the score can flag them
    under_score = (T * 40 - 1, 4000)  # 2999 of 4000 when T is 75: MPS 74.98
    at_score = (T, 100)  # 75 of 100: MPS 75 exactly
    under_mps = compute_mps(*under_score)
    assert T - 0.05 < under_mps < T == compute_mps(*at_score)
    await risk.posttest(under, under_score)
    await risk.posttest(exactly, at_score)

    items = await flags(client, risk.headers)

    assert brief(items) == [("Under", "low_mps", "LS1-EN", "open", under_mps)]
    assert items[0]["detected_at"] == stored(clock.now)
    assert items[0]["resolved_at"] is None


async def test_api_rsk_02_pretest_never_flags(client, make, risk, clock):
    """API-RSK-02: a low pretest with no posttest raises no flag."""
    clock.set(ph(3, 20))
    learner = await risk.member("L3")
    await make.refresh_token(learner, created_at=clock.now)
    await make.attempt(learner, risk.pretests["LS1-EN"], correct=T - 35, item_count=100, through_api=False)

    assert await flags(client, risk.headers) == []
    assert await make.count(AtRiskFlag) == 0


async def test_api_rsk_03_per_strand(client, make, risk, clock):
    """API-RSK-03: a learner low in two strands gets two flags, one per strand."""
    clock.set(ph(3, 20))
    learner = await risk.member("L2")
    await make.refresh_token(learner, created_at=clock.now)
    await risk.posttest(learner, LOW, "LS1-EN")
    await risk.posttest(learner, (T - 10, 100), "LS1-FIL")

    items = await flags(client, risk.headers)

    assert brief(items) == [
        ("L2", "low_mps", "LS1-EN", "open", float(T - 25)),
        ("L2", "low_mps", "LS1-FIL", "open", float(T - 10)),
    ]
    assert {item["strand_id"] for item in items} == {risk.english.id, risk.filipino.id}


# ── Inactivity ───────────────────────────────────────────────────────────────


async def test_api_rsk_04_inactive_boundary(client, make, risk, clock):
    """API-RSK-04: N-1 days without activity is not flagged; N days is, with trigger_value N."""
    # Last sign-in:  Tue 10 Mar 2026, 09:00 Philippine time.
    # First check:   10 Mar + (N-1) days, 09:00 Philippine time (Sat 14 Mar when N is 5) -> N-1 days -> no flag.
    # Second check:  10 Mar + N days, 09:00 Philippine time (Sun 15 Mar when N is 5)     -> N days   -> flagged, value N.
    learner = await risk.member("L1")
    await make.refresh_token(learner, created_at=ph(3, 10, 9, 0))

    clock.set(ph(3, 10, 9, 0) + timedelta(days=N - 1))
    assert await flags(client, risk.headers) == []

    clock.set(ph(3, 10, 9, 0) + timedelta(days=N))
    items = await flags(client, risk.headers)
    assert brief(items) == [("L1", "inactive", "", "open", float(N))]
    assert items[0]["strand_id"] is None

    # One more day: the same flag, now counting N+1.
    clock.advance(days=1)
    later = await flags(client, risk.headers)
    assert [(item["id"], item["trigger_value"]) for item in later] == [(items[0]["id"], float(N + 1))]


async def test_api_rsk_05_never_logged_in(client, risk, clock):
    """API-RSK-05: a learner who never signed in is counted from the day they were assigned."""
    # Assigned:      Tue 10 Mar 2026, 14:00 Philippine time. No sign-in, no content access, ever.
    # First check:   10 Mar + (N-1) days, 08:00 Philippine time -> N-1 days since assignment -> no flag.
    # Second check:  10 Mar + N days, 08:00 Philippine time     -> N days since assignment   -> flagged, value N.
    # (The cohort started on 5 Jan, so the start date is not what the count runs from.)
    await risk.member("L4", assigned_at=ph(3, 10, 14, 0))

    clock.set(ph(3, 10, 8, 0) + timedelta(days=N - 1))
    assert await flags(client, risk.headers) == []

    clock.set(ph(3, 10, 8, 0) + timedelta(days=N))
    assert brief(await flags(client, risk.headers)) == [("L4", "inactive", "", "open", float(N))]


async def test_api_rsk_06_activity_before_joining(client, make, risk, clock):
    """API-RSK-06: a sign-in from before the learner joined does not count against them."""
    # Last sign-in:  Tue 10 Mar 2026, 10:00 Philippine time (before joining this cohort).
    # Assigned:      Fri 20 Mar 2026, 08:00 Philippine time (10 days after that sign-in).
    # First check:   Fri 20 Mar 2026, 12:00 Philippine time -> 0 days since assignment -> no flag.
    # Second check:  20 Mar + N days, 12:00 Philippine time -> N days since assignment -> flagged, value N (not N + 10).
    learner = await risk.member("L7", assigned_at=ph(3, 20, 8, 0))
    await make.refresh_token(learner, created_at=ph(3, 10, 10, 0))

    clock.set(ph(3, 20, 12, 0))
    assert await flags(client, risk.headers) == []

    clock.set(ph(3, 20, 12, 0) + timedelta(days=N))
    assert brief(await flags(client, risk.headers)) == [("L7", "inactive", "", "open", float(N))]


async def test_api_rsk_07_cohort_start_date_later(client, make, risk, clock):
    """API-RSK-07: when the cohort starts after the learner was assigned, the count runs from the start date."""
    # Assigned:      Sun 1 Mar 2026, 12:00 Philippine time. Never signed in.
    # Cohort starts: Tue 10 Mar 2026.
    # First check:   10 Mar + (N-1) days, 12:00 Philippine time -> N-1 days since the start -> no flag
    #                (it is already N + 8 days since the assignment).
    # Second check:  10 Mar + N days, 12:00 Philippine time     -> N days since the start   -> flagged, value N.
    late_cohort = await make.cohort("Starts later", start_date=date(2026, 3, 10), end_date=date(2026, 12, 18))
    await make.assign_facilitator(late_cohort, risk.fa)
    await risk.member("Early", assigned_at=ph(3, 1), cohort_=late_cohort)

    clock.set(ph(3, 10) + timedelta(days=N - 1))
    assert await flags(client, risk.headers, cohort_id=late_cohort.id) == []

    clock.set(ph(3, 10) + timedelta(days=N))
    assert brief(await flags(client, risk.headers, cohort_id=late_cohort.id)) == [("Early", "inactive", "", "open", float(N))]


async def test_api_rsk_08_manila_midnight(client, make, risk, clock):
    """API-RSK-08: a sign-in counts on its Philippine calendar day, on either side of midnight."""
    # "Before" signed in:  Tue 10 Mar 2026, 23:59 Philippine time  (15:59 UTC on 10 Mar) -> counts on 10 Mar.
    # "After" signed in:   Wed 11 Mar 2026, 00:01 Philippine time  (16:01 UTC on 10 Mar) -> counts on 11 Mar.
    # The two are two minutes apart and fall on the SAME date in UTC, so only Philippine-time counting separates them.
    before_login, after_login = ph(3, 10, 23, 59), ph(3, 11, 0, 1)
    assert naive_utc(before_login).date() == naive_utc(after_login).date()
    before = await risk.member("Before")
    after = await risk.member("After")
    await make.refresh_token(before, created_at=before_login)
    await make.refresh_token(after, created_at=after_login)

    # Check at 10 Mar + N days, 23:59 Philippine time (still that calendar day):
    #   Before: N days since 10 Mar -> flagged, value N.     After: N-1 days since 11 Mar -> no flag.
    clock.set(ph(3, 10, 23, 59) + timedelta(days=N))
    assert brief(await flags(client, risk.headers)) == [("Before", "inactive", "", "open", float(N))]

    # Check two minutes later, 11 Mar + N days, 00:01 Philippine time (the next calendar day):
    #   Before: N+1 days -> value N+1.                      After: N days -> flagged, value N.
    clock.set(ph(3, 11, 0, 1) + timedelta(days=N))
    assert brief(await flags(client, risk.headers)) == [
        ("After", "inactive", "", "open", float(N)),
        ("Before", "inactive", "", "open", float(N + 1)),
    ]


# ── The life of a flag ───────────────────────────────────────────────────────


async def test_api_rsk_09_auto_resolve(client, make, risk, clock):
    """API-RSK-09: when the learner becomes active again, the flag is resolved and resolved_at is set."""
    learner = await risk.member("L1")
    await make.refresh_token(learner, created_at=ph(3, 10))
    clock.set(ph(3, 10) + timedelta(days=N))
    [flag] = await flags(client, risk.headers)
    assert (flag["status"], flag["resolved_at"]) == ("open", None)

    # The learner signs in; an hour later the flags are read again.
    await make.refresh_token(learner, created_at=clock.now)
    clock.advance(hours=1)
    [resolved] = await flags(client, risk.headers)

    assert resolved["id"] == flag["id"]
    assert resolved["status"] == "resolved"
    assert resolved["resolved_at"] == stored(clock.now)
    assert resolved["trigger_value"] == float(N)
    assert await flags(client, risk.headers, status="active") == []


async def test_api_rsk_10_recurrence(client, make, risk, clock):
    """API-RSK-10: when the condition comes back after a resolution, a new flag is opened and the old one is left as it was."""
    learner = await risk.member("L1")
    await make.refresh_token(learner, created_at=ph(3, 10))
    clock.set(ph(3, 10) + timedelta(days=N))
    [first] = await flags(client, risk.headers)
    await make.refresh_token(learner, created_at=clock.now)
    clock.advance(hours=1)
    [first_resolved] = await flags(client, risk.headers)
    assert first_resolved["status"] == "resolved"

    # N more days without activity.
    clock.advance(days=N)
    items = await flags(client, risk.headers)

    assert len(items) == 2
    by_id = {item["id"]: item for item in items}
    assert by_id[first["id"]] == first_resolved  # untouched
    [second] = [item for item in items if item["id"] != first["id"]]
    assert (second["status"], second["reason"], second["trigger_value"], second["resolved_at"]) == ("open", "inactive", float(N), None)
    assert second["detected_at"] == stored(clock.now)


async def test_api_rsk_11_dismissed_stays_dismissed(client, make, risk, clock):
    """API-RSK-11: a dismissed flag is not reopened, and no second flag is made, while its condition still holds."""
    learner = await risk.member("L1")
    await make.refresh_token(learner, created_at=ph(3, 10))
    clock.set(ph(3, 10) + timedelta(days=N))
    [flag] = await flags(client, risk.headers)
    dismissed = await client.patch(f"{AT_RISK}/{flag['id']}", headers=risk.headers, json={"status": "dismissed", "note": "On approved leave"})
    assert dismissed.status_code == 200

    for _ in range(2):
        clock.advance(days=1)
        items = await flags(client, risk.headers)
        assert [(item["id"], item["status"], item["resolved_at"]) for item in items] == [(flag["id"], "dismissed", None)]

    assert await flags(client, risk.headers, status="active") == []
    assert await make.count(AtRiskFlag) == 1


async def test_api_rsk_12_idempotent(client, make, risk, clock):
    """API-RSK-12: refreshing a second time with nothing changed changes nothing."""
    inactive = await risk.member("Inactive")
    await make.refresh_token(inactive, created_at=ph(3, 10))
    low = await risk.member("Low")
    await risk.posttest(low, LOW)
    clock.set(ph(3, 10) + timedelta(days=N))
    await make.refresh_token(low, created_at=clock.now)

    first = await flags(client, risk.headers)
    stored_after_first = await make.fetch(AtRiskFlag)
    second = await flags(client, risk.headers)
    stored_after_second = await make.fetch(AtRiskFlag)

    assert brief(first) == [("Inactive", "inactive", "", "open", float(N)), ("Low", "low_mps", "LS1-EN", "open", float(T - 25))]
    assert second == first
    # Every column of every row is the same, updated_at included.
    assert stored_after_second == stored_after_first
    assert len(stored_after_first) == 2


async def test_api_rsk_13_only_active_cohorts(client, make, risk, clock):
    """API-RSK-13: members of a completed or an upcoming cohort are never flagged, whatever their scores or activity."""
    completed = await make.cohort("A2", school_year="2025-2026", status="completed")
    upcoming = await make.cohort("U1", status="upcoming")
    for cohort in (completed, upcoming):
        await make.assign_facilitator(cohort, risk.fa)
    in_completed = await risk.member("InCompleted", cohort_=completed)
    in_upcoming = await risk.member("InUpcoming", cohort_=upcoming)
    in_active = await risk.member("InActive")
    for learner in (in_completed, in_upcoming, in_active):
        await risk.posttest(learner, LOW)  # low score, and never signed in
    clock.set(ph(3, 20))

    everything = await flags(client, risk.headers)
    for cohort in (completed, upcoming):
        assert await flags(client, risk.headers, cohort_id=cohort.id) == []

    # The same data in the active cohort does raise both flags, so the rules were in force.
    assert {(item["learner"]["first_name"], item["reason"]) for item in everything} == {("InActive", "low_mps"), ("InActive", "inactive")}
    assert await make.count(AtRiskFlag, cohort_id=completed.id) == 0
    assert await make.count(AtRiskFlag, cohort_id=upcoming.id) == 0


async def test_api_rsk_14_ended_member(client, make, risk, clock, login):
    """API-RSK-14: ending the membership of a learner with an open flag resolves the flag."""
    clock.set(ph(3, 20))
    learner = await risk.member("L2")
    await make.refresh_token(learner, created_at=clock.now)
    await risk.posttest(learner, LOW)
    [flag] = await flags(client, risk.headers)
    assert flag["status"] == "open"
    admin = await login(await make.system_admin())
    roster = (await client.get(f"/api/cohorts/{risk.cohort.id}/members", headers=admin)).json()
    membership = next(row for row in roster["learners"] if row["learner_id"] == learner.learner_id)

    ended = await client.patch(f"/api/cohort-learners/{membership['id']}/status", headers=admin, json={"status": "ended"})
    assert ended.status_code == 200
    clock.advance(minutes=5)
    [after] = await flags(client, risk.headers)

    assert (after["id"], after["status"]) == (flag["id"], "resolved")
    assert after["resolved_at"] == stored(clock.now)


# ── Review ───────────────────────────────────────────────────────────────────


@pytest.fixture
async def open_flag(client, make, risk, clock) -> dict:
    """One open low-MPS flag in the facilitator's cohort, with the clock at 20 Mar 2026, 12:00 Philippine time."""
    clock.set(ph(3, 20))
    learner = await risk.member("L2")
    await make.refresh_token(learner, created_at=clock.now)
    await risk.posttest(learner, LOW)
    [flag] = await flags(client, risk.headers)
    return flag


async def test_api_rsk_15_transitions_allowed(client, risk, clock, open_flag):
    """API-RSK-15: open to reviewed, reviewed to open, reviewed to dismissed and dismissed to open each answer 200,
    setting the reviewer fields on a review or dismissal and clearing them on reopening."""
    path = f"{AT_RISK}/{open_flag['id']}"

    async def move(status: str) -> dict:
        clock.advance(minutes=10)
        response = await client.patch(path, headers=risk.headers, json={"status": status})
        assert response.status_code == 200, (status, response.text[:200])
        return response.json()

    reviewed = await move("reviewed")
    assert (reviewed["status"], reviewed["reviewed_by_name"], reviewed["reviewed_at"]) == ("reviewed", "FA Tester", stored(clock.now))

    reopened = await move("open")
    assert (reopened["status"], reopened["reviewed_by_name"], reopened["reviewed_at"]) == ("open", None, None)

    await move("reviewed")
    dismissed = await move("dismissed")
    assert (dismissed["status"], dismissed["reviewed_by_name"], dismissed["reviewed_at"]) == ("dismissed", "FA Tester", stored(clock.now))

    reopened_again = await move("open")
    assert (reopened_again["status"], reopened_again["reviewed_by_name"], reopened_again["reviewed_at"]) == ("open", None, None)
    # Through it all the flag itself is the same one, never resolved.
    assert (reopened_again["id"], reopened_again["resolved_at"], reopened_again["detected_at"]) == (open_flag["id"], None, open_flag["detected_at"])


async def test_api_rsk_16_transitions_refused(client, make, risk, clock, open_flag):
    """API-RSK-16: "resolved" cannot be set by hand (422), and a resolved flag cannot be changed (409 AT_RISK_FLAG_CLOSED)."""
    path = f"{AT_RISK}/{open_flag['id']}"

    by_hand = await client.patch(path, headers=risk.headers, json={"status": "resolved"})
    assert by_hand.status_code == 422
    assert by_hand.json()["code"] == "REQUEST_VALIDATION"

    # The condition clears: a later posttest in the same strand, at the threshold. (A learner has one
    # attempt per test, so it is a second posttest of the strand.) The next read resolves the flag.
    retake = await make.strand_test(risk.english, "posttest", title="LS1-EN posttest, second form")
    learner = SimpleNamespace(learner_id=open_flag["learner"]["learner_id"])
    await make.attempt(learner, retake, correct=T, item_count=100, through_api=False)
    clock.advance(hours=1)
    [resolved] = await flags(client, risk.headers)
    assert resolved["status"] == "resolved"

    for status in ("reviewed", "dismissed", "open"):
        response = await client.patch(path, headers=risk.headers, json={"status": status, "note": "too late"})
        assert response.status_code == 409, status
        assert response.json()["code"] == "AT_RISK_FLAG_CLOSED"
    [unchanged] = await flags(client, risk.headers)
    assert unchanged == resolved


async def test_api_rsk_17_note(client, risk, open_flag):
    """API-RSK-17: sending the current status with a note saves the note (200); a note over 500 characters is refused (422)."""
    path = f"{AT_RISK}/{open_flag['id']}"

    noted = await client.patch(path, headers=risk.headers, json={"status": "open", "note": "Called the learner on Friday"})
    assert noted.status_code == 200
    assert (noted.json()["status"], noted.json()["note"]) == ("open", "Called the learner on Friday")
    assert (noted.json()["reviewed_by_name"], noted.json()["reviewed_at"]) == (None, None)

    too_long = await client.patch(path, headers=risk.headers, json={"status": "open", "note": "x" * 501})
    assert too_long.status_code == 422
    assert too_long.json()["code"] == "REQUEST_VALIDATION"

    longest = await client.patch(path, headers=risk.headers, json={"status": "open", "note": "y" * 500})
    assert longest.status_code == 200
    [saved] = await flags(client, risk.headers)
    assert saved["note"] == "y" * 500


async def test_api_rsk_18_anothers_flag(client, make, risk, clock, login):
    """API-RSK-18: a flag in another facilitator's cohort and a flag id that does not exist both answer 403, identically."""
    clock.set(ph(3, 20))
    fb = await make.facilitator("FB")
    b1 = await make.cohort("B1", start_date=date(2026, 1, 5))
    await make.assign_facilitator(b1, fb)
    learner = await risk.member("L6", cohort_=b1)
    await make.refresh_token(learner, created_at=clock.now)
    await risk.posttest(learner, LOW)
    fb_headers = await login(fb)
    [theirs] = await flags(client, fb_headers)

    anothers = await client.patch(f"{AT_RISK}/{theirs['id']}", headers=risk.headers, json={"status": "dismissed", "note": "not mine"})
    missing = await client.patch(f"{AT_RISK}/999999", headers=risk.headers, json={"status": "dismissed", "note": "not mine"})

    assert anothers.status_code == 403
    assert missing.status_code == 403
    assert anothers.content == missing.content
    assert anothers.json()["code"] == "COHORT_ACCESS_DENIED"
    # Listing that cohort is refused too, and the flag is as it was.
    assert (await client.get(AT_RISK, headers=risk.headers, params={"cohort_id": b1.id})).status_code == 403
    [after] = await flags(client, fb_headers)
    assert after == theirs


# ── Concurrency and the switched-off rule ────────────────────────────────────


async def test_api_rsk_19_no_duplicates_under_race(client, make, risk, clock):
    """API-RSK-19: two refreshes at the same moment both succeed and leave exactly one active flag per learner, reason and strand."""
    learners = [await risk.member(f"Racer{number:02d}") for number in range(1, 13)]
    for learner in learners:
        await risk.posttest(learner, LOW, "LS1-EN")
        await risk.posttest(learner, LOW, "LS1-FIL")
    clock.set(ph(3, 20))  # nobody ever signed in: each learner is inactive and low in two strands
    expected = len(learners) * 3
    assert await make.count(AtRiskFlag) == 0

    first, second = await asyncio.gather(
        client.get(AT_RISK, headers=risk.headers, params={"page_size": 100}),
        client.get(AT_RISK, headers=risk.headers, params={"page_size": 100}),
    )

    assert (first.status_code, second.status_code) == (200, 200)
    rows = await make.fetch(AtRiskFlag)
    active = [row for row in rows if row["status"] in ("open", "reviewed")]
    per_key = Counter((row["learner_id"], row["cohort_id"], str(row["reason"]), row["strand_id"]) for row in active)
    assert max(per_key.values()) == 1, [key for key, count in per_key.items() if count > 1]
    assert len(per_key) == expected
    assert len(rows) == expected  # and no stray rows in any other status
    # A read afterwards shows the same single set.
    after = await client.get(AT_RISK, headers=risk.headers, params={"page_size": 100})
    assert after.json()["total"] == expected
    assert await make.count(AtRiskFlag) == expected


async def test_api_rsk_20_low_readiness_off(client, make, risk, clock):
    """API-RSK-20: while the readiness rule is switched off, no low_readiness flag is ever raised."""
    if AT_RISK_READINESS_ENABLED:
        pytest.skip("the readiness rule has been switched on; this case covers it only while it is off")
    clock.set(ph(3, 20))
    lri = await make.lri_test()
    await risk.member("NeverProfiled")
    scored = await risk.member("Scored")
    await make.intake(scored)
    await make.lri_attempt(scored, lri, score=1.0)  # the lowest readiness score there is
    await risk.posttest(scored, LOW)

    everything = await flags(client, risk.headers)
    only_readiness = await flags(client, risk.headers, reason="low_readiness")

    assert only_readiness == []
    assert "low_readiness" not in {item["reason"] for item in everything}
    assert {item["reason"] for item in everything} == {"inactive", "low_mps"}  # the other rules did run
    assert await make.count(AtRiskFlag, reason="low_readiness") == 0
