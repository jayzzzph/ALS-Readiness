"""B8. Dashboard and reports (API-DSH-01 to 05, API-RPT-01 to 10).

Every expected figure is worked out here from the inputs the test seeds
(scores, item counts, lessons completed), with the two small formulas below,
and never read back from the API. The mastery and inactivity thresholds come
from app/core/constants.py. Dates are in Philippine time via ph(); the clock
fixture sets the app's "now".
"""

from __future__ import annotations

import csv
import io
import re
from datetime import date, datetime, timedelta, timezone
from types import SimpleNamespace

import pytest

from app.core.constants import AT_RISK_INACTIVITY_DAYS, AT_RISK_MPS_THRESHOLD, MANILA_UTC_OFFSET
from app.models.at_risk_flag import AtRiskFlag
from tests.factories import naive_utc

DASHBOARD = "/api/facilitator/dashboard"
REPORT = "/api/facilitator/reports/cohort-summary"
T = AT_RISK_MPS_THRESHOLD
N = AT_RISK_INACTIVITY_DAYS
PHILIPPINE_TIME = timezone(MANILA_UTC_OFFSET)
STRANDS = ("LS1-EN", "LS1-FIL")
REASON_LABELS = {"low_mps": "Low test score", "inactive": "Inactive", "low_readiness": "Low readiness"}


def ph(month: int, day: int, hour: int = 12, minute: int = 0) -> datetime:
    """A moment in 2026, in Philippine time."""
    return datetime(2026, month, day, hour, minute, tzinfo=PHILIPPINE_TIME)


def stored(moment: datetime | None) -> str | None:
    """How the API prints a moment: UTC, without a zone."""
    return None if moment is None else naive_utc(moment).isoformat()


# ── The two formulas, written out here so expectations do not come from the app ──


def mps(score: tuple[int, int] | None) -> float | None:
    """Mean Percentage Score: correct answers over items, as a percentage to two decimals."""
    return None if score is None else round(score[0] / score[1] * 100, 2)


def average(values) -> tuple[float | None, int]:
    """The mean of the values present, to two decimals, and how many there were."""
    present = [value for value in values if value is not None]
    return (round(sum(present) / len(present), 2), len(present)) if present else (None, 0)


def percent(done: int, total: int) -> float:
    return round(done / total * 100, 2) if total else 0.0


# ── The seeded inputs ────────────────────────────────────────────────────────

NOW = ph(3, 20, 12, 0)  # Fri 20 Mar 2026, 12:00 Philippine time
ASSIGNED = ph(2, 2, 9, 0)  # every member was assigned on Mon 2 Feb 2026

# Lessons that count in the cohort (each has assigned, active content).
TOTAL_LESSONS = {"LS1-EN": 2, "LS1-FIL": 1}

# (first name, last name): scores as (correct, items) per strand for (pretest, posttest);
# lessons completed per strand; LRI score; last sign-in; last content access; membership.
LEARNERS = {
    "Ana": dict(
        last_name="Abad", status="active",
        scores={"LS1-EN": ((40, 100), (T + 5, 100)), "LS1-FIL": ((50, 100), (T - 5, 100))},
        lessons_done={"LS1-EN": 2, "LS1-FIL": 1}, lri=3.25,
        signed_in=NOW, accessed=NOW - timedelta(hours=3),
    ),
    "Ben": dict(
        last_name="Bato", status="active",
        scores={"LS1-EN": ((60, 100), (T - 15, 100))},
        lessons_done={"LS1-EN": 0, "LS1-FIL": 0}, lri=None,  # one of two contents in a lesson: the lesson is not complete
        signed_in=NOW - timedelta(days=2), accessed=NOW - timedelta(days=1),
    ),
    "Carla": dict(
        last_name="Cruz", status="active",
        scores={"LS1-EN": ((3, 7), None)},  # pretest only: 42.86
        lessons_done={"LS1-EN": 1, "LS1-FIL": 0}, lri=None,
        signed_in=NOW, accessed=NOW - timedelta(hours=1),
    ),
    "Dan": dict(
        last_name="Dizon", status="active",
        scores={}, lessons_done={"LS1-EN": 0, "LS1-FIL": 0}, lri=None,
        signed_in=None, accessed=None,  # never active
    ),
    "Eva": dict(
        last_name="Enero", status="ended",
        scores={"LS1-EN": ((20, 100), (90, 100))},
        lessons_done={"LS1-EN": 0, "LS1-FIL": 0}, lri=None,
        signed_in=None, accessed=None,
    ),
}
ORDER = ["Ana", "Ben", "Carla", "Dan", "Eva"]  # by last name, then first name


def last_active(name: str) -> datetime | None:
    moments = [moment for moment in (LEARNERS[name]["signed_in"], LEARNERS[name]["accessed"]) if moment is not None]
    return max(moments) if moments else None


def score_of(name: str, strand: str, which: int) -> tuple[int, int] | None:
    pair = LEARNERS[name]["scores"].get(strand)
    return pair[which] if pair else None


def expected_strand(name: str, strand: str) -> dict:
    pre, post = mps(score_of(name, strand, 0)), mps(score_of(name, strand, 1))
    done, total = LEARNERS[name]["lessons_done"][strand], TOTAL_LESSONS[strand]
    return {
        "strand_code": strand,
        "progress_percent": percent(done, total),
        "completed_lessons": done,
        "total_lessons": total,
        "pretest_mps": pre,
        "posttest_mps": post,
        "gain": round(post - pre, 2) if pre is not None and post is not None else None,
        "mastered": None if post is None else post >= T,
    }


def expected_overall(name: str) -> float:
    return percent(sum(LEARNERS[name]["lessons_done"].values()), sum(TOTAL_LESSONS.values()))


def expected_reasons(name: str) -> list[str]:
    """Which rules hold for an ACTIVE member at NOW, in the order low_mps, inactive."""
    if LEARNERS[name]["status"] != "active":
        return []
    reasons = []
    if any(mps(score_of(name, strand, 1)) is not None and mps(score_of(name, strand, 1)) < T for strand in STRANDS):
        reasons.append("low_mps")
    since = (last_active(name) or ASSIGNED).astimezone(PHILIPPINE_TIME).date()
    since = max(since, ASSIGNED.astimezone(PHILIPPINE_TIME).date())
    if (NOW.astimezone(PHILIPPINE_TIME).date() - since).days >= N:
        reasons.append("inactive")
    return reasons


def names_with(status: str) -> list[str]:
    return [name for name in ORDER if status == "all" or LEARNERS[name]["status"] == status]


@pytest.fixture
async def report_world(make, login, clock) -> SimpleNamespace:
    """Seeds the LEARNERS table above into one active cohort and sets the clock to NOW.

    LS1-EN has lesson LA (contents a1, a2) and lesson LB (content b1); LS1-FIL has lesson LF
    (content f1). All four contents are assigned to the cohort; a1 and f1 are evaluated.
    """
    clock.set(NOW)
    fa = await make.facilitator("FA")
    cohort = await make.cohort("S1", start_date=date(2026, 1, 5), end_date=date(2026, 12, 18))
    await make.assign_facilitator(cohort, fa)
    strands = {code: await make.strand(code) for code in STRANDS}
    tests = {code: (await make.strand_test(strands[code], "pretest"), await make.strand_test(strands[code], "posttest")) for code in STRANDS}
    lri = await make.lri_test()

    english_module = await make.module(strands["LS1-EN"], "M-EN", order_index=1)
    la = await make.lesson(english_module, "LA", order_index=1)
    lb = await make.lesson(english_module, "LB", order_index=2)
    lf = await make.lesson(await make.module(strands["LS1-FIL"], "M-FIL", order_index=1), "LF", order_index=1)
    a1 = await make.content(la, "a1", uploaded_by=fa)
    a2 = await make.content(la, "a2", uploaded_by=fa)
    b1 = await make.content(lb, "b1", uploaded_by=fa)
    f1 = await make.content(lf, "f1", uploaded_by=fa)
    for content in (a1, a2, b1, f1):
        await make.assign_content(cohort, content, assigned_by=fa)
    await make.evaluation(a1)
    await make.evaluation(f1)

    # Which contents each learner completed, giving the lessons_done figures in LEARNERS.
    completed = {"Ana": [a1, a2, b1, f1], "Ben": [a1], "Carla": [b1], "Dan": [], "Eva": []}
    people = {}
    for name in ORDER:
        spec = LEARNERS[name]
        learner = await make.learner(name, last_name=spec["last_name"])
        people[name] = learner
        await make.assign_learner(cohort, learner, status=spec["status"], assigned_at=ASSIGNED, ended_at=ph(3, 1) if spec["status"] == "ended" else None)
        for strand, (pre, post) in spec["scores"].items():
            await make.attempt(learner, tests[strand][0], correct=pre[0], item_count=pre[1], through_api=False)
            if post is not None:
                await make.attempt(learner, tests[strand][1], correct=post[0], item_count=post[1], through_api=False)
        for content in completed[name]:
            await make.progress(learner, content, status="completed", last_accessed_at=spec["accessed"])
        if spec["signed_in"] is not None:
            await make.refresh_token(learner, created_at=spec["signed_in"])
        if spec["lri"] is not None:
            await make.lri_attempt(learner, lri, score=spec["lri"])

    return SimpleNamespace(fa=fa, headers=await login(fa), cohort=cohort, strands=strands, tests=tests, people=people, lessons=SimpleNamespace(la=la, lb=lb, lf=lf))


async def get_report(client, world, **params) -> dict:
    response = await client.get(REPORT, headers=world.headers, params={"cohort_id": world.cohort.id, **params})
    assert response.status_code == 200, response.text[:300]
    return response.json()


async def get_csv(client, world, **params):
    response = await client.get(REPORT, headers=world.headers, params={"cohort_id": world.cohort.id, "format": "csv", **params})
    assert response.status_code == 200, response.text[:300]
    return response


def parse_csv(response) -> tuple[list[str], list[dict[str, str]]]:
    """The header and the rows (as dicts), parsed with the csv module after the byte order mark."""
    text = response.content.decode("utf-8-sig")
    table = list(csv.reader(io.StringIO(text, newline="")))
    header, rows = table[0], table[1:]
    assert all(len(row) == len(header) for row in rows)
    return header, [dict(zip(header, row)) for row in rows]


# ── Dashboard ────────────────────────────────────────────────────────────────


async def test_api_dsh_01_numbers(client, report_world):
    """API-DSH-01: the learner count, the averages with their counts and the mastery count equal the hand-computed values."""
    w = report_world
    active = names_with("active")

    response = await client.get(DASHBOARD, headers=w.headers, params={"cohort_id": w.cohort.id})

    assert response.status_code == 200
    body = response.json()
    assert body["cohort"] == {"id": w.cohort.id, "name": "S1", "code": w.cohort.code, "school_year": "2026-2027", "status": "active"}
    assert body["learner_count"] == len(active) == 4
    assert body["readiness_distribution"] is None
    assert body["average_progress"] == average(expected_overall(name) for name in active)[0] == 33.33
    assert body["evaluation_coverage"] == {"evaluated": 2, "total": 4}
    assert body["generated_at"] == stored(NOW)

    assert [strand["strand_code"] for strand in body["progress_by_strand"]] == list(STRANDS)
    for seen in body["progress_by_strand"]:
        code = seen["strand_code"]
        figures = [expected_strand(name, code) for name in active]
        pre_average, pre_count = average(figure["pretest_mps"] for figure in figures)
        post_average, post_count = average(figure["posttest_mps"] for figure in figures)
        assert seen["total_lessons"] == TOTAL_LESSONS[code]
        assert seen["average_percent"] == average(figure["progress_percent"] for figure in figures)[0]
        assert seen["completed_count"] == sum(1 for figure in figures if figure["progress_percent"] == 100)
        assert seen["pretest"] == {"average_mps": pre_average, "count": pre_count}
        assert seen["posttest"] == {"average_mps": post_average, "count": post_count, "mastery_count": sum(1 for figure in figures if figure["mastered"])}
    # The same, as plain numbers, so a slip in the helpers above cannot hide.
    english, filipino = body["progress_by_strand"]
    assert (english["average_percent"], english["completed_count"], english["pretest"]["count"], english["posttest"]["count"]) == (37.5, 1, 3, 2)
    assert english["pretest"]["average_mps"] == round((40 + 60 + 42.86) / 3, 2)
    assert english["posttest"] == {"average_mps": round(((T + 5) + (T - 15)) / 2, 2), "count": 2, "mastery_count": 1}
    assert (filipino["average_percent"], filipino["completed_count"]) == (25.0, 1)
    assert filipino["posttest"] == {"average_mps": float(T - 5), "count": 1, "mastery_count": 0}

    # At risk: Ana (low in LS1-FIL), Ben (low in LS1-EN), Dan (never active). Dan, never active, comes first.
    flagged = {name: expected_reasons(name) for name in active if expected_reasons(name)}
    assert flagged == {"Ana": ["low_mps"], "Ben": ["low_mps"], "Dan": ["inactive"]}
    assert (body["at_risk"]["learner_count"], body["at_risk"]["flag_count"]) == (3, 3)
    assert [learner["first_name"] for learner in body["at_risk"]["learners"]] == ["Dan", "Ben", "Ana"]
    days_inactive = (NOW.date() - ASSIGNED.date()).days
    seen_flags = {learner["first_name"]: [(flag["reason"], flag["strand_code"], flag["trigger_value"], flag["status"]) for flag in learner["flags"]] for learner in body["at_risk"]["learners"]}
    assert seen_flags == {
        "Dan": [("inactive", None, float(days_inactive), "open")],
        "Ben": [("low_mps", "LS1-EN", float(T - 15), "open")],
        "Ana": [("low_mps", "LS1-FIL", float(T - 5), "open")],
    }


async def test_api_dsh_02_consistency(client, report_world):
    """API-DSH-02: the dashboard shows the same progress, last active time and flags as the learners list and the at-risk list for the cohort."""
    w = report_world
    params = {"cohort_id": w.cohort.id}

    dashboard = (await client.get(DASHBOARD, headers=w.headers, params=params)).json()
    learners = (await client.get("/api/facilitator/learners", headers=w.headers, params={**params, "page_size": 100})).json()["items"]
    at_risk = (await client.get("/api/facilitator/at-risk", headers=w.headers, params={**params, "status": "active", "page_size": 100})).json()["items"]

    listed = {row["learner_id"]: row for row in learners}
    assert dashboard["learner_count"] == len(learners) == 4

    # Per strand: the dashboard's average is the mean of the list's figures, and its lesson count is theirs.
    for index, strand in enumerate(dashboard["progress_by_strand"]):
        from_list = [row["progress"][index] for row in learners]
        assert {entry["strand_code"] for entry in from_list} == {strand["strand_code"]}
        assert strand["average_percent"] == average(entry["percent"] for entry in from_list)[0]
        assert {entry["total_lessons"] for entry in from_list} == {strand["total_lessons"]}
        assert strand["completed_count"] == sum(1 for entry in from_list if entry["percent"] == 100)

    # Per flagged learner: identity, overall progress and last active match the list row.
    flags_by_learner: dict[int, list[dict]] = {}
    for flag in at_risk:
        flags_by_learner.setdefault(flag["learner"]["learner_id"], []).append(flag)
    assert {learner["learner_id"] for learner in dashboard["at_risk"]["learners"]} == set(flags_by_learner)
    assert dashboard["at_risk"]["flag_count"] == len(at_risk)
    assert dashboard["at_risk"]["learner_count"] == len(flags_by_learner) == sum(1 for row in learners if row["at_risk_reasons"])
    for learner in dashboard["at_risk"]["learners"]:
        row = listed[learner["learner_id"]]
        assert (learner["id_no"], learner["first_name"], learner["last_name"]) == (row["id_no"], row["first_name"], row["last_name"])
        assert learner["last_active_at"] == row["last_active_at"]
        completed = sum(entry["completed_lessons"] for entry in row["progress"])
        total = sum(entry["total_lessons"] for entry in row["progress"])
        assert learner["overall_progress"] == percent(completed, total)
        # Flag by flag, every field the dashboard carries equals the at-risk list's.
        theirs = {flag["id"]: flag for flag in flags_by_learner[learner["learner_id"]]}
        assert {flag["id"] for flag in learner["flags"]} == set(theirs)
        for flag in learner["flags"]:
            for field in ("reason", "strand_code", "trigger_value", "status", "detected_at"):
                assert flag[field] == theirs[flag["id"]][field], field
        assert sorted({flag["reason"] for flag in learner["flags"]}) == sorted(row["at_risk_reasons"])
    # And the list flags nobody the dashboard leaves out.
    assert {row["learner_id"] for row in learners if row["at_risk_reasons"]} == set(flags_by_learner)


async def test_api_dsh_03_coverage(client, make, login):
    """API-DSH-03: archived content, and content under an archived lesson, are left out of evaluation_coverage even when assigned and evaluated."""
    fa = await make.facilitator("FA")
    cohort = await make.cohort("S1")
    await make.assign_facilitator(cohort, fa)
    strand = await make.strand("LS1-EN")
    module = await make.module(strand, "M-A", order_index=1)
    live_lesson = await make.lesson(module, "Live", order_index=1)
    archived_lesson = await make.lesson(module, "Archived lesson", order_index=2, status="archived")
    evaluated = await make.content(live_lesson, "Counted, evaluated", uploaded_by=fa)
    plain = await make.content(live_lesson, "Counted, not evaluated", uploaded_by=fa)
    archived_content = await make.content(live_lesson, "Archived content", uploaded_by=fa, status="archived")
    under_archived_lesson = await make.content(archived_lesson, "Under archived lesson", uploaded_by=fa)
    unassigned = await make.content(live_lesson, "Not assigned", uploaded_by=fa)
    for content in (evaluated, plain, archived_content, under_archived_lesson):
        await make.assign_content(cohort, content, assigned_by=fa)
    for content in (evaluated, archived_content, under_archived_lesson, unassigned):
        await make.evaluation(content)

    response = await client.get(DASHBOARD, headers=await login(fa), params={"cohort_id": cohort.id})

    assert response.status_code == 200
    # Only the two active contents in the active lesson that are assigned to the cohort count; one of them is evaluated.
    assert response.json()["evaluation_coverage"] == {"evaluated": 1, "total": 2}
    assert response.json()["progress_by_strand"][0]["total_lessons"] == 1


async def test_api_dsh_04_empty_cohort(client, make, login):
    """API-DSH-04: a cohort with no learners gives zeros and nulls, not an error."""
    fa = await make.facilitator("FA")
    cohort = await make.cohort("U1", status="upcoming")
    await make.assign_facilitator(cohort, fa)
    await make.strand("LS1-EN")
    await make.strand("LS1-FIL")

    response = await client.get(DASHBOARD, headers=await login(fa), params={"cohort_id": cohort.id})

    assert response.status_code == 200
    body = response.json()
    assert (body["learner_count"], body["average_progress"], body["readiness_distribution"]) == (0, None, None)
    assert body["cohort"]["status"] == "upcoming"
    assert body["evaluation_coverage"] == {"evaluated": 0, "total": 0}
    assert body["at_risk"] == {"learner_count": 0, "flag_count": 0, "learners": []}
    assert len(body["progress_by_strand"]) == 2
    for strand in body["progress_by_strand"]:
        assert (strand["total_lessons"], strand["average_percent"], strand["completed_count"]) == (0, None, 0)
        assert strand["pretest"] == {"average_mps": None, "count": 0}
        assert strand["posttest"] == {"average_mps": None, "count": 0, "mastery_count": 0}


async def test_api_dsh_05_access(client, cast, login):
    """API-DSH-05: no cohort_id is 422; another facilitator's cohort and an archived cohort are 403."""
    headers = await login(cast.fa)

    missing = await client.get(DASHBOARD, headers=headers)
    anothers = await client.get(DASHBOARD, headers=headers, params={"cohort_id": cast.b1.id})
    archived = await client.get(DASHBOARD, headers=headers, params={"cohort_id": cast.x1.id})

    assert (missing.status_code, missing.json()["code"]) == (422, "REQUEST_VALIDATION")
    assert (anothers.status_code, anothers.json()["code"]) == (403, "COHORT_ACCESS_DENIED")
    assert (archived.status_code, archived.json()["code"]) == (403, "COHORT_ACCESS_DENIED")
    assert anothers.content == archived.content
    assert (await client.get(DASHBOARD, headers=headers, params={"cohort_id": cast.s1.id})).status_code == 200


# ── Cohort summary, JSON ─────────────────────────────────────────────────────


def expected_totals(names: list[str]) -> dict:
    reasons = {name: expected_reasons(name) for name in names}
    strands = []
    for code in STRANDS:
        figures = [expected_strand(name, code) for name in names]
        pre_average, pre_count = average(figure["pretest_mps"] for figure in figures)
        post_average, post_count = average(figure["posttest_mps"] for figure in figures)
        gain_average, gain_count = average(figure["gain"] for figure in figures)
        strands.append(
            {
                "strand_code": code,
                "average_progress": average(figure["progress_percent"] for figure in figures)[0],
                "pretest": {"average_mps": pre_average, "count": pre_count},
                "posttest": {"average_mps": post_average, "count": post_count},
                "gain": {"average": gain_average, "count": gain_count},
                "mastery_count": sum(1 for figure in figures if figure["mastered"]),
            }
        )
    return {
        "learner_count": len(names),
        "average_progress": average(expected_overall(name) for name in names)[0],
        "at_risk": {
            "learner_count": sum(1 for name in names if reasons[name]),
            "by_reason": {reason: sum(1 for name in names if reason in reasons[name]) for reason in ("low_mps", "inactive", "low_readiness")},
        },
        "strands": strands,
    }


def expected_learner(name: str, world) -> dict:
    return {
        "learner_id": world.people[name].learner_id,
        "id_no": world.people[name].id_no,
        "first_name": name,
        "last_name": LEARNERS[name]["last_name"],
        "membership_status": LEARNERS[name]["status"],
        "overall_progress": expected_overall(name),
        "last_active_at": stored(last_active(name)),
        "lri_score": LEARNERS[name]["lri"],
        "at_risk_reasons": expected_reasons(name),
        "strands": [expected_strand(name, code) for code in STRANDS],
    }


async def test_api_rpt_01_json_values(client, report_world):
    """API-RPT-01: every learner's figures and the totals equal the hand-computed values; gain exists only
    with both tests; mastered is null without a posttest."""
    w = report_world
    active = names_with("active")

    body = await get_report(client, w)

    assert body["cohort"] == {"id": w.cohort.id, "name": "S1", "code": w.cohort.code, "school_year": "2026-2027", "status": "active"}
    assert body["generated_at"] == stored(NOW)
    assert body["thresholds"] == {"mps_mastery": T, "inactivity_days": N}
    assert body["learners"] == [expected_learner(name, w) for name in active]
    assert body["totals"] == expected_totals(active)

    # The points the case names, as plain values.
    by_name = {learner["first_name"]: {strand["strand_code"]: strand for strand in learner["strands"]} for learner in body["learners"]}
    assert by_name["Ana"]["LS1-EN"]["gain"] == float(T + 5 - 40)  # both tests: posttest minus pretest
    assert by_name["Ana"]["LS1-EN"]["mastered"] is True
    assert by_name["Ana"]["LS1-FIL"]["mastered"] is False
    assert by_name["Ben"]["LS1-EN"]["gain"] == float(T - 15 - 60)
    assert (by_name["Carla"]["LS1-EN"]["pretest_mps"], by_name["Carla"]["LS1-EN"]["posttest_mps"]) == (42.86, None)
    assert by_name["Carla"]["LS1-EN"]["gain"] is None  # pretest only
    assert by_name["Carla"]["LS1-EN"]["mastered"] is None  # no posttest
    assert by_name["Dan"]["LS1-EN"] == {
        "strand_code": "LS1-EN", "progress_percent": 0.0, "completed_lessons": 0, "total_lessons": 2,
        "pretest_mps": None, "posttest_mps": None, "gain": None, "mastered": None,
    }
    english = body["totals"]["strands"][0]
    assert english["gain"] == {"average": round(((T + 5 - 40) + (T - 15 - 60)) / 2, 2), "count": 2}
    assert (english["mastery_count"], english["pretest"]["count"], english["posttest"]["count"]) == (1, 3, 2)
    assert body["totals"]["at_risk"] == {"learner_count": 3, "by_reason": {"low_mps": 2, "inactive": 1, "low_readiness": 0}}
    assert (body["totals"]["learner_count"], body["totals"]["average_progress"]) == (4, 33.33)


@pytest.mark.parametrize("membership_status", ["active", "ended", "all"])
async def test_api_rpt_02_membership_filter(client, report_world, membership_status):
    """API-RPT-02: the ended member (Eva) appears only under ended and all, and the totals follow the filter."""
    w = report_world
    names = names_with(membership_status)

    body = await get_report(client, w, membership_status=membership_status)

    assert [learner["first_name"] for learner in body["learners"]] == names
    assert ("Eva" in names) == (membership_status in ("ended", "all"))
    assert body["learners"] == [expected_learner(name, w) for name in names]
    assert body["totals"] == expected_totals(names)
    assert body["totals"]["learner_count"] == {"active": 4, "ended": 1, "all": 5}[membership_status]
    # Eva's own scores (20 and 90) move the English averages only when she is listed.
    english = body["totals"]["strands"][0]
    assert english["pretest"]["count"] == {"active": 3, "ended": 1, "all": 4}[membership_status]
    assert english["mastery_count"] == {"active": 1, "ended": 1, "all": 2}[membership_status]


# ── Cohort summary, CSV ──────────────────────────────────────────────────────


def expected_header() -> list[str]:
    header = ["ID Number", "Last Name", "First Name", "Membership Status", "Overall Progress (%)"]
    for code in STRANDS:
        header += [f"{code} Progress (%)", f"{code} Pretest MPS", f"{code} Posttest MPS", f"{code} Gain", f"{code} Mastered"]
    return header + ["LRI Score", "Last Active (PHT)", "At-Risk Reasons"]


async def test_api_rpt_03_csv_shape(client, report_world):
    """API-RPT-03: the CSV has the byte order mark, the specified header, and one row per learner in the JSON's order,
    and it parses with the csv module."""
    w = report_world

    response = await get_csv(client, w, membership_status="all")
    in_json = await get_report(client, w, membership_status="all")

    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    assert response.content.startswith(b"\xef\xbb\xbf")
    assert not response.content[3:].startswith(b"\xef\xbb\xbf")  # one mark only
    header, rows = parse_csv(response)
    assert header == expected_header()
    assert len(rows) == len(in_json["learners"]) == 5
    assert [row["ID Number"] for row in rows] == [learner["id_no"] for learner in in_json["learners"]]
    assert [row["Last Name"] for row in rows] == ["Abad", "Bato", "Cruz", "Dizon", "Enero"]
    # No totals row, and lines end as CSV lines do.
    assert response.content.decode("utf-8-sig").count("\r\n") == 6
    assert "total" not in response.text.lower().replace("total_", "")


def cell_number(cell: str) -> float | None:
    return None if cell == "" else float(cell)


@pytest.mark.parametrize("membership_status", ["active", "all"])
async def test_api_rpt_04_csv_equals_json(client, report_world, membership_status):
    """API-RPT-04: every CSV value equals the JSON for the same cohort and filter, and at-risk reasons are readable labels."""
    w = report_world

    in_json = await get_report(client, w, membership_status=membership_status)
    header, rows = parse_csv(await get_csv(client, w, membership_status=membership_status))

    assert len(rows) == len(in_json["learners"])
    for row, learner in zip(rows, in_json["learners"]):
        assert row["ID Number"] == learner["id_no"]
        assert row["Last Name"] == learner["last_name"]
        assert row["First Name"] == learner["first_name"]
        assert row["Membership Status"] == learner["membership_status"]
        assert cell_number(row["Overall Progress (%)"]) == learner["overall_progress"]
        for strand in learner["strands"]:
            code = strand["strand_code"]
            assert cell_number(row[f"{code} Progress (%)"]) == strand["progress_percent"]
            assert cell_number(row[f"{code} Pretest MPS"]) == strand["pretest_mps"]
            assert cell_number(row[f"{code} Posttest MPS"]) == strand["posttest_mps"]
            assert cell_number(row[f"{code} Gain"]) == strand["gain"]
            assert row[f"{code} Mastered"] == {True: "Yes", False: "No", None: ""}[strand["mastered"]]
        assert cell_number(row["LRI Score"]) == learner["lri_score"]
        if learner["last_active_at"] is None:
            assert row["Last Active (PHT)"] == ""
        else:
            in_manila = datetime.fromisoformat(learner["last_active_at"]) + MANILA_UTC_OFFSET
            assert row["Last Active (PHT)"] == in_manila.strftime("%Y-%m-%d %H:%M")
        assert row["At-Risk Reasons"] == "; ".join(REASON_LABELS[reason] for reason in learner["at_risk_reasons"])
        # Every column was compared: none is left unaccounted for.
        assert set(row) == set(expected_header())

    by_name = {row["First Name"]: row for row in rows}
    assert by_name["Ana"]["At-Risk Reasons"] == "Low test score"
    assert by_name["Dan"]["At-Risk Reasons"] == "Inactive"
    assert by_name["Carla"]["At-Risk Reasons"] == ""
    assert "low_mps" not in " ".join(row["At-Risk Reasons"] for row in rows)


async def test_api_rpt_05_csv_formula_safety(client, make, report_world):
    """API-RPT-05: a name that a spreadsheet would run as a formula is written with a leading single quote."""
    w = report_world
    equals = await make.learner("=HYPERLINK(\"http://evil.example\",\"x\")", last_name="=1+1")
    plus = await make.learner("+SUM(A1:A9)", last_name="Plus")
    at_sign = await make.learner("@cmd", last_name="-2+3")
    for learner in (equals, plus, at_sign):
        await make.assign_learner(w.cohort, learner, assigned_at=NOW)

    in_json = await get_report(client, w)
    header, rows = parse_csv(await get_csv(client, w))

    by_id = {row["ID Number"]: row for row in rows}
    assert by_id[equals.id_no]["First Name"] == "'" + equals.first_name
    assert by_id[equals.id_no]["Last Name"] == "'=1+1"
    assert by_id[plus.id_no]["First Name"] == "'+SUM(A1:A9)"
    assert by_id[plus.id_no]["Last Name"] == "Plus"  # an ordinary name is left alone
    assert by_id[at_sign.id_no]["First Name"] == "'@cmd"
    assert by_id[at_sign.id_no]["Last Name"] == "'-2+3"
    # No text cell in the whole file starts with a character a spreadsheet treats as a formula.
    text_columns = ["ID Number", "Last Name", "First Name", "Membership Status", "Last Active (PHT)", "At-Risk Reasons"] + [f"{code} Mastered" for code in STRANDS]
    for row in rows:
        for column in text_columns:
            assert not row[column].startswith(("=", "+", "-", "@", "\t", "\r")), (column, row[column])
    assert not any(cell.startswith(("=", "+", "@")) for cell in header)
    # The JSON keeps the names exactly as they are.
    names = {learner["id_no"]: (learner["first_name"], learner["last_name"]) for learner in in_json["learners"]}
    assert names[equals.id_no] == (equals.first_name, "=1+1")
    assert names[plus.id_no] == ("+SUM(A1:A9)", "Plus")


async def test_api_rpt_06_csv_time(client, make, login, clock):
    """API-RPT-06: Last Active is in Philippine time as YYYY-MM-DD HH:MM, on the right side of midnight."""
    # "Late" signed in:   Thu 19 Mar 2026, 23:50 Philippine time (15:50 UTC on 19 Mar).
    # "Early" signed in:  Fri 20 Mar 2026, 00:10 Philippine time (16:10 UTC on 19 Mar: the same UTC date).
    # The report is read on Fri 20 Mar 2026, 08:00 Philippine time.
    clock.set(ph(3, 20, 8, 0))
    fa = await make.facilitator("FA")
    cohort = await make.cohort("S1", start_date=date(2026, 1, 5))
    await make.assign_facilitator(cohort, fa)
    late = await make.learner("Late", last_name="A")
    early = await make.learner("Early", last_name="B")
    never = await make.learner("Never", last_name="C")
    for learner in (late, early, never):
        await make.assign_learner(cohort, learner, assigned_at=ph(3, 19, 8, 0))
    await make.refresh_token(late, created_at=ph(3, 19, 23, 50))
    await make.refresh_token(early, created_at=ph(3, 20, 0, 10))

    response = await client.get(REPORT, headers=await login(fa), params={"cohort_id": cohort.id, "format": "csv"})

    assert response.status_code == 200
    _, rows = parse_csv(response)
    seen = {row["First Name"]: row["Last Active (PHT)"] for row in rows}
    assert seen == {"Late": "2026-03-19 23:50", "Early": "2026-03-20 00:10", "Never": ""}
    for value in (seen["Late"], seen["Early"]):
        assert re.fullmatch(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}", value)


async def test_api_rpt_07_csv_headers(client, make, login, clock):
    """API-RPT-07: the CSV is sent as an attachment with a filename, and a browser on another origin may read that header."""
    # Read on Sat 21 Mar 2026, 01:00 Philippine time, which is still 20 Mar in UTC: the filename uses the Philippine date.
    clock.set(ph(3, 21, 1, 0))
    fa = await make.facilitator("FA")
    cohort = await make.cohort("S1")
    await make.assign_facilitator(cohort, fa)
    headers = {**await login(fa), "Origin": "http://localhost:5173"}

    response = await client.get(REPORT, headers=headers, params={"cohort_id": cohort.id, "format": "csv"})

    assert response.status_code == 200
    assert response.headers["content-disposition"] == f'attachment; filename="cohort-summary_{cohort.code}_2026-03-21.csv"'
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    exposed = [name.strip().lower() for name in response.headers["access-control-expose-headers"].split(",")]
    assert "content-disposition" in exposed
    # The JSON form is not an attachment.
    as_json = await client.get(REPORT, headers=headers, params={"cohort_id": cohort.id})
    assert "content-disposition" not in as_json.headers


async def test_api_rpt_08_completed_cohort(client, make, login, clock):
    """API-RPT-08: the report of a completed cohort answers 200 and neither creates nor changes any flag."""
    clock.set(NOW)
    fa = await make.facilitator("FA")
    cohort = await make.cohort("A2", school_year="2025-2026", status="completed")
    await make.assign_facilitator(cohort, fa)
    strand = await make.strand("LS1-EN")
    posttest = await make.strand_test(strand, "posttest")
    still_listed = await make.learner("Still", last_name="Listed")
    left = await make.learner("Left", last_name="Earlier")
    await make.assign_learner(cohort, still_listed, assigned_at=ph(1, 5))  # never signed in, and a low posttest
    await make.assign_learner(cohort, left, status="ended", assigned_at=ph(1, 5), ended_at=ph(2, 1))
    await make.attempt(still_listed, posttest, correct=T - 30, item_count=100, through_api=False)
    # A flag from when the cohort was active. In an active cohort the next read would touch it.
    await make.flag(left, cohort, reason="inactive", trigger_value=9, status="open", detected_at=ph(1, 20))
    before = await make.fetch(AtRiskFlag)
    headers = await login(fa)

    responses = [
        await client.get(REPORT, headers=headers, params={"cohort_id": cohort.id, "membership_status": "all"}),
        await client.get(REPORT, headers=headers, params={"cohort_id": cohort.id, "membership_status": "all", "format": "csv"}),
        await client.get(DASHBOARD, headers=headers, params={"cohort_id": cohort.id}),
    ]

    assert [response.status_code for response in responses] == [200, 200, 200]
    body = responses[0].json()
    assert body["cohort"]["status"] == "completed"
    assert [learner["first_name"] for learner in body["learners"]] == ["Left", "Still"]
    assert body["learners"][1]["strands"][0]["posttest_mps"] == float(T - 30)
    # No flag was created for the low score or the inactivity, and the old one is exactly as it was.
    assert await make.fetch(AtRiskFlag) == before
    assert len(before) == 1


FORBIDDEN_KEYS = {"birthdate", "birth_date", "address", "contact_number", "contact_email", "email", "sex", "gender", "civil_status", "age"}
PRIVATE_VALUES = {
    "birthdate": "1999-04-17",
    "address": "PRIVATE-ADDRESS 42 Mabini St",
    "contact_number": "PRIV-0917-5550142",
    "contact_email": "private.ana@example.test",
    "civil_status": "PRIVATE-Widowed",
}


def all_keys(value) -> set[str]:
    if isinstance(value, dict):
        return set(value) | {key for item in value.values() for key in all_keys(item)}
    if isinstance(value, list):
        return {key for item in value for key in all_keys(item)}
    return set()


async def test_api_rpt_09_privacy(client, make, report_world):
    """API-RPT-09: neither the JSON nor the CSV carries a birthdate, address, contact number, email, sex or civil status:
    not as a field, a column, or a value."""
    w = report_world
    ana = w.people["Ana"]
    await make.profile_details(
        ana, birthdate=date(1999, 4, 17), gender="female", civil_status=PRIVATE_VALUES["civil_status"],
        address=PRIVATE_VALUES["address"], contact_number=PRIVATE_VALUES["contact_number"], contact_email=PRIVATE_VALUES["contact_email"],
    )
    await make.intake(ana, age=27, civil_status=PRIVATE_VALUES["civil_status"])

    problems = []
    for membership_status in ("active", "all"):
        in_json = await client.get(REPORT, headers=w.headers, params={"cohort_id": w.cohort.id, "membership_status": membership_status})
        as_csv = await get_csv(client, w, membership_status=membership_status)
        assert in_json.status_code == 200
        header, rows = parse_csv(as_csv)
        leaked_keys = all_keys(in_json.json()) & FORBIDDEN_KEYS
        leaked_columns = [column for column in header if re.search(r"birth|address|contact|email|\bsex\b|gender|civil|\bage\b", column, re.I)]
        leaked_values = [name for name, value in PRIVATE_VALUES.items() if value in in_json.text or value in as_csv.text]
        if leaked_keys or leaked_columns or leaked_values:
            problems.append((membership_status, sorted(leaked_keys), leaked_columns, leaked_values))
        # What identifies a learner is the ID number and the name, nothing more.
        for learner in in_json.json()["learners"]:
            assert set(learner) == {
                "learner_id", "id_no", "first_name", "last_name", "membership_status", "overall_progress",
                "last_active_at", "lri_score", "at_risk_reasons", "strands",
            }
        assert header == expected_header()

    assert problems == []
    # Not vacuous: Ana is in both, and her profile does hold the values.
    assert any(row["ID Number"] == ana.id_no for row in rows)
    own_intake = (await client.get("/api/learner/participant-intake", headers={"Authorization": w.headers["Authorization"]}))
    assert own_intake.status_code == 403  # the facilitator cannot read the intake directly either


async def test_api_rpt_10_access(client, cast, login):
    """API-RPT-10: another facilitator's cohort and an archived cohort are 403; an unknown format is 422."""
    headers = await login(cast.fa)

    anothers = await client.get(REPORT, headers=headers, params={"cohort_id": cast.b1.id})
    archived = await client.get(REPORT, headers=headers, params={"cohort_id": cast.x1.id})
    as_csv = await client.get(REPORT, headers=headers, params={"cohort_id": cast.b1.id, "format": "csv"})
    bad_format = await client.get(REPORT, headers=headers, params={"cohort_id": cast.s1.id, "format": "xlsx"})
    bad_filter = await client.get(REPORT, headers=headers, params={"cohort_id": cast.s1.id, "membership_status": "everyone"})
    missing_cohort = await client.get(REPORT, headers=headers)

    assert (anothers.status_code, anothers.json()["code"]) == (403, "COHORT_ACCESS_DENIED")
    assert (archived.status_code, archived.json()["code"]) == (403, "COHORT_ACCESS_DENIED")
    assert anothers.content == archived.content
    assert as_csv.status_code == 403
    assert "text/csv" not in as_csv.headers["content-type"]  # a refusal is not sent as a file
    assert (bad_format.status_code, bad_format.json()["code"]) == (422, "REQUEST_VALIDATION")
    assert bad_filter.status_code == 422
    assert missing_cohort.status_code == 422
    assert (await client.get(REPORT, headers=headers, params={"cohort_id": cast.s1.id})).status_code == 200
