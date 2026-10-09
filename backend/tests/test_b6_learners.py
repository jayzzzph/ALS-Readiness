"""B6. Learners (API-LRN-01 to 14)."""

from __future__ import annotations

import json
from datetime import date, timedelta
from types import SimpleNamespace

import pytest

from tests.factories import utc_now

LEARNERS = "/api/facilitator/learners"


async def listing(client, headers, **params) -> dict:
    response = await client.get(LEARNERS, headers=headers, params={"page_size": 100, **params})
    assert response.status_code == 200, response.text[:200]
    return response.json()


def rows(body: dict) -> list[tuple[str, str, str]]:
    """(first name, cohort name, membership status) per row, sorted."""
    return sorted((row["first_name"], row["cohort_name"], row["membership_status"]) for row in body["items"])


@pytest.fixture
async def small(make) -> SimpleNamespace:
    """One facilitator with one active cohort. Tests add the learners they need."""
    fa = await make.facilitator("FA")
    cohort = await make.cohort("S1")
    await make.assign_facilitator(cohort, fa)
    return SimpleNamespace(fa=fa, cohort=cohort)


# ── List ─────────────────────────────────────────────────────────────────────


async def test_api_lrn_01_list_scope(client, cast, login):
    """API-LRN-01: without cohort_id, FA's list covers S1, A1 and A2 only; L6 (in B1) is never present."""
    headers = await login(cast.fa)

    default = await listing(client, headers)
    everyone = await listing(client, headers, membership_status="all")

    assert rows(default) == [("L1", "S1", "active"), ("L2", "S1", "active"), ("L3", "S1", "active"), ("L4", "S1", "active"), ("L7", "A1", "active")]
    assert default["total"] == 5
    assert {row["cohort_name"] for row in everyone["items"]} == {"S1", "A1", "A2"}
    for body in (default, everyone, await listing(client, headers, membership_status="ended"), await listing(client, headers, search="L6")):
        assert cast.l6.id_no not in {row["id_no"] for row in body["items"]}
        assert "B1" not in {row["cohort_name"] for row in body["items"]}


async def test_api_lrn_02_anothers_cohort(client, cast, login):
    """API-LRN-02: asking for another facilitator's cohort answers 403."""
    response = await client.get(LEARNERS, headers=await login(cast.fa), params={"cohort_id": cast.b1.id})

    assert response.status_code == 403
    assert response.json()["code"] == "COHORT_ACCESS_DENIED"
    assert "items" not in response.json()


async def test_api_lrn_03_one_row_per_membership(client, cast, login):
    """API-LRN-03: with membership_status=all a learner in two cohorts has two rows: L7 in A1 and in A2."""
    body = await listing(client, await login(cast.fa), membership_status="all")

    l7 = sorted((row["cohort_name"], row["membership_status"]) for row in body["items"] if row["id_no"] == cast.l7.id_no)
    assert l7 == [("A1", "active"), ("A2", "ended")]
    assert body["total"] == 7


async def test_api_lrn_04_membership_filter(client, cast, login):
    """API-LRN-04: L5 (ended in S1) is absent by default and present under ended and all."""
    headers = await login(cast.fa)

    default = await listing(client, headers, cohort_id=cast.s1.id)
    ended = await listing(client, headers, cohort_id=cast.s1.id, membership_status="ended")
    everyone = await listing(client, headers, cohort_id=cast.s1.id, membership_status="all")

    assert [name for name, _, _ in rows(default)] == ["L1", "L2", "L3", "L4"]
    assert rows(ended) == [("L5", "S1", "ended")]
    assert [name for name, _, _ in rows(everyone)] == ["L1", "L2", "L3", "L4", "L5"]
    assert (default["total"], ended["total"], everyone["total"]) == (4, 1, 5)
    # The explicit "active" is the default.
    assert rows(await listing(client, headers, cohort_id=cast.s1.id, membership_status="active")) == rows(default)


async def test_api_lrn_05_search(client, make, small, login):
    """API-LRN-05: search matches first name, last name, either order of both, and the ID number; % is a literal character."""
    ana = await make.learner("Ana", last_name="Santos")
    ben = await make.learner("Ben", last_name="Santos")
    carla = await make.learner("Carla", last_name="Reyes")
    percent = await make.learner("Dan", last_name="100% Sure")
    underscore = await make.learner("Eva", last_name="De_Leon")
    for learner in (ana, ben, carla, percent, underscore):
        await make.assign_learner(small.cohort, learner)
    headers = await login(small.fa)

    async def found(text: str) -> tuple[list[str], int]:
        body = await listing(client, headers, search=text)
        return sorted(row["first_name"] for row in body["items"]), body["total"]

    assert await found("Ana") == (["Ana"], 1)
    assert await found("santos") == (["Ana", "Ben"], 2)
    assert await found("Ana Santos") == (["Ana"], 1)
    assert await found("Santos Ana") == (["Ana"], 1)
    assert await found(ben.id_no) == (["Ben"], 1)
    assert await found("Carla Santos") == ([], 0)
    # Wildcard characters are searched for as themselves.
    assert await found("%") == (["Dan"], 1)
    assert await found("_") == (["Eva"], 1)


async def test_api_lrn_06_last_active(client, make, small, login):
    """API-LRN-06: last_active_at is the later of the last sign-in and the last content access; null with neither."""
    strand = await make.strand("LS1-EN")
    lesson = await make.lesson(await make.module(strand, "M-A", order_index=1), "LS-1", order_index=1)
    content = await make.content(lesson, "C1", uploaded_by=small.fa)
    await make.assign_content(small.cohort, content, assigned_by=small.fa)
    now = utc_now().replace(microsecond=0)
    three_days, two_days, one_day = now - timedelta(days=3), now - timedelta(days=2), now - timedelta(days=1)

    token_only = await make.learner("TokenOnly")
    progress_only = await make.learner("ProgressOnly")
    token_newer = await make.learner("TokenNewer")
    progress_newer = await make.learner("ProgressNewer")
    neither = await make.learner("Neither")
    for learner in (token_only, progress_only, token_newer, progress_newer, neither):
        await make.assign_learner(small.cohort, learner)
    await make.refresh_token(token_only, created_at=three_days)
    await make.refresh_token(token_only, created_at=two_days)  # the later of two sign-ins counts
    await make.progress(progress_only, content, status="in_progress", last_accessed_at=one_day)
    await make.refresh_token(token_newer, created_at=one_day)
    await make.progress(token_newer, content, status="in_progress", last_accessed_at=three_days)
    await make.refresh_token(progress_newer, created_at=three_days)
    await make.progress(progress_newer, content, status="in_progress", last_accessed_at=two_days)
    headers = await login(small.fa)

    body = await listing(client, headers, cohort_id=small.cohort.id)

    def stamp(moment) -> str:
        return moment.replace(tzinfo=None).isoformat()

    seen = {row["first_name"]: row["last_active_at"] for row in body["items"]}
    assert seen == {
        "TokenOnly": stamp(two_days),
        "ProgressOnly": stamp(one_day),
        "TokenNewer": stamp(one_day),
        "ProgressNewer": stamp(two_days),
        "Neither": None,
    }
    # The detail page agrees with the list.
    detail = (await client.get(f"{LEARNERS}/{progress_newer.learner_id}", headers=headers)).json()
    assert detail["last_active_at"] == stamp(two_days)
    assert (await client.get(f"{LEARNERS}/{neither.learner_id}", headers=headers)).json()["last_active_at"] is None


# ── Progress ─────────────────────────────────────────────────────────────────


@pytest.fixture
async def progress_world(make, small) -> SimpleNamespace:
    """One learner and the three situations of API-LRN-07, with progress rows seeded directly
    (nothing in the app writes them yet).

    LS1-EN, lesson "Half": two assigned contents, one completed        -> not complete.
    LS1-EN, lesson "Rest archived": one completed, one never opened but archived -> complete.
    LS1-FIL: a lesson with content, none of it assigned                -> 0 of 0.
    """
    learner = await make.learner("L1")
    await make.assign_learner(small.cohort, learner)
    english = await make.strand("LS1-EN")
    filipino = await make.strand("LS1-FIL")
    module = await make.module(english, "M-A", order_index=1)
    half = await make.lesson(module, "Half", order_index=1)
    rest_archived = await make.lesson(module, "Rest archived", order_index=2)

    done_1 = await make.content(half, "Done 1", uploaded_by=small.fa)
    not_done = await make.content(half, "Not done", uploaded_by=small.fa)
    done_2 = await make.content(rest_archived, "Done 2", uploaded_by=small.fa)
    archived = await make.content(rest_archived, "Archived, never opened", uploaded_by=small.fa, status="archived")
    for content in (done_1, not_done, done_2, archived):
        await make.assign_content(small.cohort, content, assigned_by=small.fa)
    await make.progress(learner, done_1, status="completed")
    await make.progress(learner, not_done, status="in_progress")
    await make.progress(learner, done_2, status="completed")

    unassigned_lesson = await make.lesson(await make.module(filipino, "M-F", order_index=1), "Unassigned", order_index=1)
    await make.content(unassigned_lesson, "Not assigned", uploaded_by=small.fa)
    return SimpleNamespace(fa=small.fa, cohort=small.cohort, learner=learner, english=english, filipino=filipino)


async def test_api_lrn_07_progress_math(client, progress_world, login):
    """API-LRN-07: a lesson counts as complete only when every assigned, active content is completed;
    archived content is ignored; a strand with nothing assigned is 0 of 0."""
    w = progress_world
    headers = await login(w.fa)

    row = (await listing(client, headers, cohort_id=w.cohort.id))["items"][0]
    by_strand = {entry["strand_code"]: entry for entry in row["progress"]}

    # "Half" is not complete, "Rest archived" is: one of two lessons.
    assert (by_strand["LS1-EN"]["completed_lessons"], by_strand["LS1-EN"]["total_lessons"], by_strand["LS1-EN"]["percent"]) == (1, 2, 50.0)
    assert (by_strand["LS1-FIL"]["completed_lessons"], by_strand["LS1-FIL"]["total_lessons"], by_strand["LS1-FIL"]["percent"]) == (0, 0, 0.0)
    # The detail page gives the same numbers.
    detail = (await client.get(f"{LEARNERS}/{w.learner.learner_id}", headers=headers)).json()
    detail_by_strand = {strand["strand_code"]: strand["progress"] for strand in detail["strands"]}
    assert detail_by_strand["LS1-EN"] == {"completed_lessons": 1, "total_lessons": 2, "percent": 50.0}
    assert detail_by_strand["LS1-FIL"] == {"completed_lessons": 0, "total_lessons": 0, "percent": 0.0}


async def test_api_lrn_08_progress_matches_learner_view(client, progress_world, login):
    """API-LRN-08: the facilitator's progress figures for a learner equal the learner's own /api/me/strands."""
    w = progress_world

    own = (await client.get("/api/me/strands", headers=await login(w.learner))).json()
    row = (await listing(client, await login(w.fa), cohort_id=w.cohort.id))["items"][0]

    # The learner's view gives the two lesson counts and no percentage.
    seen_by_facilitator = {entry["strand_code"]: (entry["completed_lessons"], entry["total_lessons"]) for entry in row["progress"]}
    seen_by_learner = {strand["code"]: (strand["completed_lessons"], strand["total_lessons"]) for strand in own}
    assert seen_by_learner, "the learner's own view lists no strand"
    assert seen_by_learner["LS1-EN"] == (1, 2)
    for code, figures in seen_by_learner.items():
        assert seen_by_facilitator[code] == figures, code
    # A strand the learner's view leaves out is 0 of 0 for the facilitator.
    for code in set(seen_by_facilitator) - set(seen_by_learner):
        assert seen_by_facilitator[code] == (0, 0), code


# ── Detail ───────────────────────────────────────────────────────────────────


async def test_api_lrn_09_detail(client, cast, login):
    """API-LRN-09: L1's detail has a pretest and a posttest per strand with MPS, the LRI, the intake, and a null readiness."""
    response = await client.get(f"{LEARNERS}/{cast.l1.learner_id}", headers=await login(cast.fa))

    assert response.status_code == 200
    body = response.json()
    assert body["learner"] == {"learner_id": cast.l1.learner_id, "id_no": cast.l1.id_no, "first_name": "L1", "last_name": "Tester"}
    assert (body["cohort"]["id"], body["cohort"]["name"], body["cohort"]["membership_status"]) == (cast.s1.id, "S1", "active")
    assert body["readiness"] is None
    assert [strand["strand_code"] for strand in body["strands"]] == ["LS1-EN", "LS1-FIL", "LS3"]
    for strand in body["strands"]:
        assert (strand["pretest"]["score"], strand["pretest"]["total_items"], strand["pretest"]["mps"]) == (2, 4, 50.0)
        assert (strand["posttest"]["score"], strand["posttest"]["total_items"], strand["posttest"]["mps"]) == (4, 4, 100.0)
        assert strand["pretest"]["submitted_at"] and strand["posttest"]["submitted_at"]
    assert body["lri"]["score"] == 3.0
    assert body["lri"]["submitted_at"]
    assert (body["intake"]["highest_educational_attainment"], body["intake"]["als_enrollment_months"]) == ("Grade 10", 6)
    assert body["intake"]["submitted_at"]
    assert body["at_risk_flags"] == []


async def test_api_lrn_10_detail_pretest_only(client, cast, login):
    """API-LRN-10: L3 took only the LS1-EN pretest, so every posttest is null."""
    response = await client.get(f"{LEARNERS}/{cast.l3.learner_id}", headers=await login(cast.fa))

    assert response.status_code == 200
    strands = {strand["strand_code"]: strand for strand in response.json()["strands"]}
    assert strands["LS1-EN"]["pretest"]["mps"] == 50.0
    assert strands["LS1-EN"]["posttest"] is None
    for code in ("LS1-FIL", "LS3"):
        assert strands[code]["pretest"] is None
        assert strands[code]["posttest"] is None


async def test_api_lrn_11_detail_not_own_learner(client, cast, login):
    """API-LRN-11: a learner in none of FA's cohorts (L6) answers 403."""
    response = await client.get(f"{LEARNERS}/{cast.l6.learner_id}", headers=await login(cast.fa))

    assert response.status_code == 403
    assert response.json()["code"] == "COHORT_ACCESS_DENIED"
    assert "learner" not in response.json()


async def test_api_lrn_12_detail_missing_learner(client, cast, login):
    """API-LRN-12: a learner id that does not exist answers 403 with a response identical to API-LRN-11."""
    headers = await login(cast.fa)

    missing = await client.get(f"{LEARNERS}/999999", headers=headers)
    not_own = await client.get(f"{LEARNERS}/{cast.l6.learner_id}", headers=headers)

    assert missing.status_code == 403
    assert not_own.status_code == 403
    assert missing.content == not_own.content


async def test_api_lrn_13_mps_matches_learner_view(client, make, small, login):
    """API-LRN-13: the MPS on the facilitator's detail equals the MPS the learner's own result endpoint
    gives for the same attempt. Three items are used so the figure needs rounding (66.67, 33.33)."""
    learner = await make.learner("L1")
    await make.assign_learner(small.cohort, learner)
    strand = await make.strand("LS1-EN")
    await make.lri_test()
    pretest = await make.strand_test(strand, "pretest", items=3)
    posttest = await make.strand_test(strand, "posttest", items=3)
    pre_attempt = await make.attempt(learner, pretest, correct=2)
    post_attempt = await make.attempt(learner, posttest, correct=1)
    learner_headers = await login(learner)

    own_pre = (await client.get(f"/api/learner/strand-tests/{pretest.id}/attempts", headers=learner_headers)).json()
    own_post = (await client.get(f"/api/learner/strand-tests/{posttest.id}/attempts", headers=learner_headers)).json()
    detail = (await client.get(f"{LEARNERS}/{learner.learner_id}", headers=await login(small.fa))).json()

    # The same attempts on both sides.
    assert (own_pre["attempt_id"], own_post["attempt_id"]) == (pre_attempt, post_attempt)
    seen = detail["strands"][0]
    assert seen["pretest"]["mps"] == own_pre["mps"]
    assert seen["posttest"]["mps"] == own_post["mps"]
    assert (seen["pretest"]["score"], seen["pretest"]["total_items"]) == (own_pre["total_score"], own_pre["item_count"]) == (2, 3)
    assert (seen["posttest"]["score"], seen["posttest"]["total_items"]) == (own_post["total_score"], own_post["item_count"]) == (1, 3)
    # And they are the real figures, not two matching blanks.
    assert own_pre["mps"] == pytest.approx(66.67, abs=0.01)
    assert own_post["mps"] == pytest.approx(33.33, abs=0.01)


# ── Privacy ──────────────────────────────────────────────────────────────────

FORBIDDEN_KEYS = {"birthdate", "birth_date", "address", "contact_number", "contact_email", "email", "sex", "gender", "civil_status"}
PRIVATE_VALUES = {
    "birthdate": "1999-04-17",
    "address": "PRIVATE-ADDRESS 42 Mabini St",
    "contact_number": "PRIV-0917-5550142",
    "contact_email": "private.l1@example.test",
    "civil_status": "PRIVATE-Widowed",
}


def all_keys(value) -> set[str]:
    if isinstance(value, dict):
        return set(value) | {key for item in value.values() for key in all_keys(item)}
    if isinstance(value, list):
        return {key for item in value for key in all_keys(item)}
    return set()


async def test_api_lrn_14_privacy(client, make, cast, login):
    """API-LRN-14: no learner list or detail body carries a birthdate, address, contact number, email, sex or civil status."""
    # L1's profile and intake hold recognisable personal values, so a leak shows as a value as well as a key.
    await make.profile_details(
        cast.l1,
        birthdate=date(1999, 4, 17),
        gender="female",
        civil_status=PRIVATE_VALUES["civil_status"],
        address=PRIVATE_VALUES["address"],
        contact_number=PRIVATE_VALUES["contact_number"],
        contact_email=PRIVATE_VALUES["contact_email"],
    )
    intake = await client.put(
        "/api/learner/participant-intake",
        headers=await login(cast.l1),
        json={
            "age": 27, "sex": "female", "civil_status": PRIVATE_VALUES["civil_status"], "highest_educational_attainment": "Grade 10",
            "als_learning_strands": ["LS1-EN"], "als_enrollment_months": 6, "has_taken_ae_test": False, "ae_test_attempt_count": 0,
        },
    )
    assert intake.status_code == 200
    headers = await login(cast.fa)

    requests = {
        "learners, default": (LEARNERS, {}),
        "learners, one cohort": (LEARNERS, {"cohort_id": cast.s1.id}),
        "learners, all memberships": (LEARNERS, {"membership_status": "all"}),
        "learners, search": (LEARNERS, {"search": "L1"}),
        "learners, at risk": (LEARNERS, {"at_risk": "true"}),
        "learner detail, L1": (f"{LEARNERS}/{cast.l1.learner_id}", {}),
        "learner detail, L1 in S1": (f"{LEARNERS}/{cast.l1.learner_id}", {"cohort_id": cast.s1.id}),
        "learner detail, L2 (flagged)": (f"{LEARNERS}/{cast.l2.learner_id}", {}),
        "learner detail, L7 (two cohorts)": (f"{LEARNERS}/{cast.l7.learner_id}", {}),
        "cohort roster": (f"/api/facilitator/cohorts/{cast.s1.id}", {}),
    }
    problems = []
    for label, (path, params) in requests.items():
        response = await client.get(path, headers=headers, params=params)
        assert response.status_code == 200, (label, response.status_code)
        leaked_keys = all_keys(response.json()) & FORBIDDEN_KEYS
        leaked_values = [name for name, value in PRIVATE_VALUES.items() if value in response.text]
        if leaked_keys or leaked_values:
            problems.append((label, sorted(leaked_keys), leaked_values))

    assert problems == []
    # The check is not vacuous: L1 is in these bodies, and the intake it reads from does hold the values.
    detail = (await client.get(f"{LEARNERS}/{cast.l1.learner_id}", headers=headers)).json()
    assert detail["learner"]["id_no"] == cast.l1.id_no
    assert detail["intake"]["age"] == 27
    own_intake = (await client.get("/api/learner/participant-intake", headers=await login(cast.l1))).json()
    assert json.dumps(own_intake).count(PRIVATE_VALUES["civil_status"]) == 1
