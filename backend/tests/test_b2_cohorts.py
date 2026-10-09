"""B2. Cohort scope and school years (API-COH-01 to 13)."""

from __future__ import annotations

import pytest

COHORTS = "/api/facilitator/cohorts"
SCHOOL_YEARS = "/api/facilitator/school-years"


def names(response) -> list[str]:
    return [cohort["name"] for cohort in response.json()["items"]]


async def test_api_coh_01_own_cohorts_only(client, cast, login):
    """API-COH-01: FA's list has S1, A1, A2 and U1; B1 (another's) and X1 (archived) are absent."""
    response = await client.get(COHORTS, headers=await login(cast.fa))

    assert response.status_code == 200
    assert sorted(names(response)) == ["A1", "A2", "S1", "U1"]
    assert response.json()["total"] == 4


async def test_api_coh_02_school_year_filter(client, cast, login):
    """API-COH-02: school_year=2025-2026 returns only A2."""
    response = await client.get(COHORTS, headers=await login(cast.fa), params={"school_year": "2025-2026"})

    assert response.status_code == 200
    assert names(response) == ["A2"]
    assert response.json()["total"] == 1


@pytest.mark.parametrize("school_year", ["2026-27", "2026-2028", "abc"])
async def test_api_coh_03_bad_school_year_format(client, make, login, school_year):
    """API-COH-03: a school year that is not two consecutive years as YYYY-YYYY is refused with 422."""
    facilitator = await make.facilitator("FA")

    response = await client.get(COHORTS, headers=await login(facilitator), params={"school_year": school_year})

    assert response.status_code == 422
    assert response.json()["code"] == "REQUEST_VALIDATION"


async def test_api_coh_04_school_years_list(client, cast, make, login):
    """API-COH-04: both years, newest first; `current` is the newest year with an active cohort."""
    headers = await login(cast.fa)

    response = await client.get(SCHOOL_YEARS, headers=headers)

    assert response.status_code == 200
    assert response.json() == {"school_years": ["2026-2027", "2025-2026"], "current": "2026-2027"}

    # A newer year with only an upcoming cohort is listed first but is not `current`.
    upcoming = await make.cohort("Next year", school_year="2027-2028", status="upcoming")
    await make.assign_facilitator(upcoming, cast.fa)
    response = await client.get(SCHOOL_YEARS, headers=headers)
    assert response.json() == {"school_years": ["2027-2028", "2026-2027", "2025-2026"], "current": "2026-2027"}


async def test_api_coh_05_school_years_no_cohorts(client, cast, login):
    """API-COH-05: a facilitator with no cohorts gets an empty list and a null `current`."""
    response = await client.get(SCHOOL_YEARS, headers=await login(cast.fc))

    assert response.status_code == 200
    assert response.json() == {"school_years": [], "current": None}
    cohorts = await client.get(COHORTS, headers=await login(cast.fc))
    assert cohorts.json() == {"items": [], "total": 0}


async def test_api_coh_06_cohort_ordering(client, make, login):
    """API-COH-06: active first, then upcoming, then completed; by name within a status."""
    facilitator = await make.facilitator("FA")
    # Created in an order that matches neither the status nor the name order.
    for name, status in [
        ("Zeta", "completed"),
        ("Beta", "upcoming"),
        ("Delta", "active"),
        ("Alpha", "completed"),
        ("Gamma", "upcoming"),
        ("Charlie", "active"),
        ("Hidden", "archived"),
    ]:
        cohort = await make.cohort(name, school_year="2026-2027", status=status)
        await make.assign_facilitator(cohort, facilitator)

    response = await client.get(COHORTS, headers=await login(facilitator), params={"school_year": "2026-2027"})

    assert response.status_code == 200
    assert [(cohort["name"], cohort["status"]) for cohort in response.json()["items"]] == [
        ("Charlie", "active"),
        ("Delta", "active"),
        ("Beta", "upcoming"),
        ("Gamma", "upcoming"),
        ("Alpha", "completed"),
        ("Zeta", "completed"),
    ]


async def test_api_coh_07_learner_count(client, cast, login):
    """API-COH-07: learner_count counts active members only, so L5 (ended) is not in S1's count."""
    response = await client.get(COHORTS, headers=await login(cast.fa))

    counts = {cohort["name"]: cohort["learner_count"] for cohort in response.json()["items"]}
    assert counts == {"S1": 4, "A1": 1, "A2": 0, "U1": 0}


async def test_api_coh_08_detail_of_own_cohort(client, cast, login):
    """API-COH-08: 200, and a roster row holds only learner id, ID number, names, status and assigned date."""
    response = await client.get(f"{COHORTS}/{cast.s1.id}", headers=await login(cast.fa))

    assert response.status_code == 200
    body = response.json()
    assert (body["id"], body["name"], body["code"], body["status"], body["learner_count"]) == (cast.s1.id, "S1", cast.s1.code, "active", 4)
    roster = body["roster"]
    assert {row["id_no"]: row["status"] for row in roster} == {
        cast.l1.id_no: "active",
        cast.l2.id_no: "active",
        cast.l3.id_no: "active",
        cast.l4.id_no: "active",
        cast.l5.id_no: "ended",
    }
    for row in roster:
        assert set(row) == {"learner_id", "id_no", "first_name", "last_name", "status", "assigned_at"}
    first = next(row for row in roster if row["id_no"] == cast.l1.id_no)
    assert (first["learner_id"], first["first_name"], first["last_name"]) == (cast.l1.learner_id, "L1", "Tester")
    assert first["assigned_at"]


async def test_api_coh_09_detail_of_anothers_cohort(client, cast, login):
    """API-COH-09: another facilitator's cohort answers 403 COHORT_ACCESS_DENIED."""
    response = await client.get(f"{COHORTS}/{cast.b1.id}", headers=await login(cast.fa))

    assert response.status_code == 403
    assert response.json()["code"] == "COHORT_ACCESS_DENIED"
    assert "roster" not in response.json()


async def test_api_coh_10_detail_of_archived_cohort(client, cast, login):
    """API-COH-10: an archived cohort answers 403 COHORT_ACCESS_DENIED even to its own facilitator."""
    response = await client.get(f"{COHORTS}/{cast.x1.id}", headers=await login(cast.fa))

    assert response.status_code == 403
    assert response.json()["code"] == "COHORT_ACCESS_DENIED"


async def test_api_coh_11_detail_of_missing_cohort(client, cast, login):
    """API-COH-11: a cohort that does not exist answers 403 with the same body as another's cohort."""
    headers = await login(cast.fa)

    missing = await client.get(f"{COHORTS}/999999", headers=headers)
    anothers = await client.get(f"{COHORTS}/{cast.b1.id}", headers=headers)

    assert missing.status_code == 403
    assert anothers.status_code == 403
    # Identical, so the answer does not reveal which cohort ids exist.
    assert missing.json() == anothers.json()


async def test_api_coh_12_ended_assignment_loses_access(client, cast, login):
    """API-COH-12: once an admin ends FA's assignment to A1, FA gets 403 for A1 and A1 leaves FA's list."""
    fa = await login(cast.fa)
    assert (await client.get(f"{COHORTS}/{cast.a1.id}", headers=fa)).status_code == 200
    admin = await login(cast.adm)
    members = (await client.get(f"/api/cohorts/{cast.a1.id}/members", headers=admin)).json()
    assignment = next(row for row in members["facilitators"] if row["facilitator_id"] == cast.fa.facilitator_id)

    ended = await client.patch(f"/api/cohort-facilitators/{assignment['id']}/status", headers=admin, json={"status": "ended"})
    assert ended.status_code == 200

    detail = await client.get(f"{COHORTS}/{cast.a1.id}", headers=fa)
    listing = await client.get(COHORTS, headers=fa)
    assert detail.status_code == 403
    assert detail.json()["code"] == "COHORT_ACCESS_DENIED"
    assert sorted(names(listing)) == ["A2", "S1", "U1"]


async def test_api_coh_13_completed_cohort_stays_visible(client, cast, login):
    """API-COH-13: a completed cohort still opens for its facilitator, with its ended members."""
    response = await client.get(f"{COHORTS}/{cast.a2.id}", headers=await login(cast.fa))

    assert response.status_code == 200
    body = response.json()
    assert (body["name"], body["status"], body["school_year"]) == ("A2", "completed", "2025-2026")
    assert [(row["id_no"], row["status"]) for row in body["roster"]] == [(cast.l7.id_no, "ended")]
