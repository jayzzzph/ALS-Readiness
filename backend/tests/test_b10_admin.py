"""B10. Admin cohorts and users (API-ADM-01 to 11)."""

from __future__ import annotations

import re

import pytest

VALID_COHORT = {"name": "Batch 1", "school_year": "2026-2027", "start_date": "2026-06-01", "end_date": "2027-03-31"}


async def roster_row(client, headers, cohort_id: int, learner_id: int) -> dict:
    members = (await client.get(f"/api/cohorts/{cohort_id}/members", headers=headers)).json()
    return next(row for row in members["learners"] if row["learner_id"] == learner_id)


async def test_api_adm_01_create_cohort(client, make, login):
    """API-ADM-01: a valid body creates the cohort (201) with a generated code."""
    admin = await make.admin("Adm")
    headers = await login(admin)

    response = await client.post("/api/cohorts", headers=headers, json=VALID_COHORT)

    assert response.status_code == 201
    body = response.json()
    assert (body["name"], body["school_year"], body["start_date"], body["end_date"]) == ("Batch 1", "2026-2027", "2026-06-01", "2027-03-31")
    assert body["status"] == "upcoming"
    assert body["created_by"] == admin.id
    # The code carries the school year and the cohort's id.
    assert re.fullmatch(rf"[A-Z]+-2026-2027-{body['id']:04d}", body["code"])
    # It is there for the next request (the commit happens before the response).
    listed = (await client.get("/api/cohorts", headers=headers)).json()["cohorts"]
    assert [(cohort["id"], cohort["code"]) for cohort in listed] == [(body["id"], body["code"])]


@pytest.mark.parametrize(
    "change",
    [
        pytest.param({"school_year": "2026-27"}, id="short school year"),
        pytest.param({"school_year": "2026-2028"}, id="years not consecutive"),
        pytest.param({"start_date": "2027-03-31", "end_date": "2027-03-31"}, id="start equals end"),
        pytest.param({"start_date": "2027-04-01", "end_date": "2027-03-31"}, id="start after end"),
    ],
)
async def test_api_adm_02_create_invalid(client, make, login, change):
    """API-ADM-02: a bad school year, or a start date on or after the end date, is refused with 422."""
    headers = await login(await make.admin("Adm"))

    response = await client.post("/api/cohorts", headers=headers, json={**VALID_COHORT, **change})

    assert response.status_code == 422
    assert response.json()["code"] == "REQUEST_VALIDATION"
    assert (await client.get("/api/cohorts", headers=headers)).json()["cohorts"] == []


async def test_api_adm_03_assignable_ids(client, make, login):
    """API-ADM-03: the users list carries learner_id for a learner and facilitator_id for a facilitator."""
    headers = await login(await make.admin("Adm"))
    learner = (await client.post("/api/admin/learners", headers=headers, json={"first_name": "Lina", "last_name": "Learner"})).json()
    facilitator = (await client.post("/api/admin/facilitators", headers=headers, json={"first_name": "Fe", "last_name": "Facilitator"})).json()

    response = await client.get("/api/admin/users", headers=headers)

    assert response.status_code == 200
    rows = {row["first_name"]: row for row in response.json()["items"]}
    assert (rows["Lina"]["role"], rows["Lina"]["facilitator_id"]) == ("learner", None)
    assert (rows["Fe"]["role"], rows["Fe"]["learner_id"]) == ("facilitator", None)
    assert (rows["Adm"]["learner_id"], rows["Adm"]["facilitator_id"]) == (None, None)
    assert isinstance(rows["Lina"]["learner_id"], int)
    assert isinstance(rows["Fe"]["facilitator_id"], int)

    # The ids are the ones the assign routes take.
    cohort = (await client.post("/api/cohorts", headers=headers, json=VALID_COHORT)).json()
    assigned_learner = await client.post(f"/api/cohorts/{cohort['id']}/learners", headers=headers, json={"learner_id": rows["Lina"]["learner_id"]})
    assigned_facilitator = await client.post(
        f"/api/cohorts/{cohort['id']}/facilitators", headers=headers, json={"facilitator_id": rows["Fe"]["facilitator_id"]}
    )
    assert (assigned_learner.status_code, assigned_facilitator.status_code) == (201, 201)
    members = (await client.get(f"/api/cohorts/{cohort['id']}/members", headers=headers)).json()
    assert [row["id_no"] for row in members["learners"]] == [learner["id_no"]]
    assert [row["id_no"] for row in members["facilitators"]] == [facilitator["id_no"]]


async def test_api_adm_04_assign_learner(client, make, login):
    """API-ADM-04: assigning a learner to an active cohort answers 201 with an active membership."""
    admin = await make.admin("Adm")
    learner = await make.learner("L1")
    cohort = await make.cohort("S1", status="active")

    response = await client.post(f"/api/cohorts/{cohort.id}/learners", headers=await login(admin), json={"learner_id": learner.learner_id})

    assert response.status_code == 201
    body = response.json()
    assert (body["cohort_id"], body["learner_id"], body["status"], body["assigned_by"]) == (cohort.id, learner.learner_id, "active", admin.id)


async def test_api_adm_05_one_active_cohort(client, cast, login):
    """API-ADM-05: a learner active in one cohort cannot be assigned to a second (409)."""
    headers = await login(cast.adm)

    response = await client.post(f"/api/cohorts/{cast.a1.id}/learners", headers=headers, json={"learner_id": cast.l1.learner_id})

    assert response.status_code == 409
    assert response.json()["code"] == "LEARNER_ALREADY_IN_ACTIVE_COHORT"
    members = (await client.get(f"/api/cohorts/{cast.a1.id}/members", headers=headers)).json()
    assert [row["id_no"] for row in members["learners"]] == [cast.l7.id_no]


@pytest.mark.parametrize("cohort_key", ["a2", "x1"])
async def test_api_adm_06_assign_to_completed_or_archived(client, cast, make, login, cohort_key):
    """API-ADM-06: no one can be assigned to a completed (A2) or archived (X1) cohort: 400 INVALID_COHORT_STATUS."""
    headers = await login(cast.adm)
    cohort = getattr(cast, cohort_key)
    unassigned_learner = await make.learner("New")

    as_learner = await client.post(f"/api/cohorts/{cohort.id}/learners", headers=headers, json={"learner_id": unassigned_learner.learner_id})
    as_facilitator = await client.post(f"/api/cohorts/{cohort.id}/facilitators", headers=headers, json={"facilitator_id": cast.fc.facilitator_id})

    assert (as_learner.status_code, as_learner.json()["code"]) == (400, "INVALID_COHORT_STATUS")
    assert (as_facilitator.status_code, as_facilitator.json()["code"]) == (400, "INVALID_COHORT_STATUS")


async def test_api_adm_07_end_and_reactivate(client, cast, login):
    """API-ADM-07: ending a membership sets ended_at; reactivating it clears ended_at."""
    headers = await login(cast.adm)
    before = await roster_row(client, headers, cast.s1.id, cast.l1.learner_id)
    assert (before["status"], before["ended_at"]) == ("active", None)

    ended = await client.patch(f"/api/cohort-learners/{before['id']}/status", headers=headers, json={"status": "ended"})
    assert (ended.status_code, ended.json()["status"]) == (200, "ended")
    after_end = await roster_row(client, headers, cast.s1.id, cast.l1.learner_id)
    assert after_end["status"] == "ended"
    assert after_end["ended_at"] is not None

    reactivated = await client.patch(f"/api/cohort-learners/{before['id']}/status", headers=headers, json={"status": "active"})
    assert (reactivated.status_code, reactivated.json()["status"]) == (200, "active")
    after_reactivate = await roster_row(client, headers, cast.s1.id, cast.l1.learner_id)
    assert (after_reactivate["status"], after_reactivate["ended_at"]) == ("active", None)


async def test_api_adm_08_reactivate_while_active_elsewhere(client, cast, login):
    """API-ADM-08: a membership ended in S1 cannot be reactivated while the learner is active in A1 (409)."""
    headers = await login(cast.adm)
    in_s1 = await roster_row(client, headers, cast.s1.id, cast.l1.learner_id)
    ended = await client.patch(f"/api/cohort-learners/{in_s1['id']}/status", headers=headers, json={"status": "ended"})
    assert ended.status_code == 200
    moved = await client.post(f"/api/cohorts/{cast.a1.id}/learners", headers=headers, json={"learner_id": cast.l1.learner_id})
    assert moved.status_code == 201

    response = await client.patch(f"/api/cohort-learners/{in_s1['id']}/status", headers=headers, json={"status": "active"})

    assert response.status_code == 409
    assert response.json()["code"] == "LEARNER_ALREADY_IN_ACTIVE_COHORT"
    still = await roster_row(client, headers, cast.s1.id, cast.l1.learner_id)
    assert still["status"] == "ended"
    assert still["ended_at"] is not None


async def test_api_adm_09_roster(client, cast, login):
    """API-ADM-09: every roster row, learner and facilitator, carries id_no and ended_at."""
    response = await client.get(f"/api/cohorts/{cast.s1.id}/members", headers=await login(cast.adm))

    assert response.status_code == 200
    body = response.json()
    learners = {row["id_no"]: row for row in body["learners"]}
    assert set(learners) == {cast.l1.id_no, cast.l2.id_no, cast.l3.id_no, cast.l4.id_no, cast.l5.id_no}
    for row in body["learners"] + body["facilitators"]:
        assert "id_no" in row and "ended_at" in row
        assert row["id_no"]
    assert learners[cast.l1.id_no]["ended_at"] is None
    assert learners[cast.l5.id_no]["status"] == "ended"
    assert learners[cast.l5.id_no]["ended_at"] is not None
    assert sorted(row["id_no"] for row in body["facilitators"]) == sorted([cast.fa.id_no, cast.fb.id_no])
    assert all(row["ended_at"] is None for row in body["facilitators"])


async def test_api_adm_10_user_search(client, make, login):
    """API-ADM-10: search matches a name in either order and the ID number, respects the role filter, and `total` follows."""
    admin = await make.admin("Adm", last_name="Root")
    ana = await make.learner("Ana", last_name="Santos")
    ben = await make.learner("Ben", last_name="Santos")
    ana_facilitator = await make.facilitator("Ana", last_name="Reyes")
    await make.learner("Carla", last_name="Dizon")
    headers = await login(admin)

    async def search(**params) -> tuple[list[str], int]:
        response = await client.get("/api/admin/users", headers=headers, params=params)
        assert response.status_code == 200
        body = response.json()
        return sorted(row["id_no"] for row in body["items"]), body["total"]

    assert await search(search="Ana") == (sorted([ana.id_no, ana_facilitator.id_no]), 2)
    assert await search(search="Santos") == (sorted([ana.id_no, ben.id_no]), 2)
    assert await search(search="Ana Santos") == ([ana.id_no], 1)
    assert await search(search="Santos Ana") == ([ana.id_no], 1)
    assert await search(search=ben.id_no) == ([ben.id_no], 1)
    assert await search(search="Ana", role="learner") == ([ana.id_no], 1)
    assert await search(search="Ana", role="facilitator") == ([ana_facilitator.id_no], 1)
    assert await search(search="nobody-by-this-name") == ([], 0)
    assert await search(role="learner") == (sorted([ana.id_no, ben.id_no, (await search(search="Carla"))[0][0]]), 3)
    # `total` counts every match, not just the page returned.
    page = await client.get("/api/admin/users", headers=headers, params={"search": "Santos", "page_size": 1})
    assert (len(page.json()["items"]), page.json()["total"]) == (1, 2)


async def test_api_adm_11_status_change_effects(client, cast, login):
    """API-ADM-11: archiving S1 removes it from FA's cohorts; setting it back to active restores it."""
    admin = await login(cast.adm)
    fa = await login(cast.fa)

    def cohort_names(response) -> list[str]:
        return sorted(cohort["name"] for cohort in response.json()["items"])

    assert "S1" in cohort_names(await client.get("/api/facilitator/cohorts", headers=fa))

    archived = await client.patch(f"/api/cohorts/{cast.s1.id}/status", headers=admin, json={"status": "archived"})
    assert (archived.status_code, archived.json()["status"]) == (200, "archived")
    assert cohort_names(await client.get("/api/facilitator/cohorts", headers=fa)) == ["A1", "A2", "U1"]
    assert (await client.get(f"/api/facilitator/cohorts/{cast.s1.id}", headers=fa)).status_code == 403

    restored = await client.patch(f"/api/cohorts/{cast.s1.id}/status", headers=admin, json={"status": "active"})
    assert (restored.status_code, restored.json()["status"]) == (200, "active")
    assert cohort_names(await client.get("/api/facilitator/cohorts", headers=fa)) == ["A1", "A2", "S1", "U1"]
    detail = await client.get(f"/api/facilitator/cohorts/{cast.s1.id}", headers=fa)
    assert (detail.status_code, detail.json()["learner_count"]) == (200, 4)


PRIVATE_PROFILE = {
    "address": "PRIVATE-ADDRESS 42 Mabini St",
    "contact_number": "PRIV-0917-5550142",
    "contact_email": "private.member@example.com",
    "civil_status": "PRIVATE-Widowed",
}
PRIVATE_KEYS = {"birthdate", "birth_date", "address", "contact_number", "contact_email", "email", "gender", "sex", "civil_status"}


def all_keys(value) -> set[str]:
    if isinstance(value, dict):
        return set(value) | {key for item in value.values() for key in all_keys(item)}
    if isinstance(value, list):
        return {key for item in value for key in all_keys(item)}
    return set()


async def test_api_adm_12_roster_privacy(client, cast, make, login):
    """API-ADM-12: the admin roster carries no birthdate, address, contact number, email, gender or civil status,
    as a field or as a value; a member's profile is the name only."""
    from datetime import date

    for person in (cast.l1, cast.l5, cast.fa):
        await make.profile_details(person, birthdate=date(1999, 4, 17), gender="female", **PRIVATE_PROFILE)

    response = await client.get(f"/api/cohorts/{cast.s1.id}/members", headers=await login(cast.adm))

    assert response.status_code == 200
    body = response.json()
    assert all_keys(body) & PRIVATE_KEYS == set()
    for value in (*PRIVATE_PROFILE.values(), "1999-04-17"):
        assert value not in response.text
    members = body["learners"] + body["facilitators"]
    assert len(members) == 7
    for member in members:
        assert set(member["profile"]) == {"first_name", "last_name"}
    # What the admin Cohorts page reads is still there.
    first = next(row for row in body["learners"] if row["learner_id"] == cast.l1.learner_id)
    assert first["profile"] == {"first_name": "L1", "last_name": "Tester"}
    assert (first["id_no"], first["status"], first["ended_at"]) == (cast.l1.id_no, "active", None)
    assert first["assigned_at"]
    facilitator = next(row for row in body["facilitators"] if row["facilitator_id"] == cast.fa.facilitator_id)
    assert facilitator["profile"] == {"first_name": "FA", "last_name": "Tester"}
