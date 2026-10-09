"""B1. Authentication and role guard (API-AUTH-01 to 06)."""

from __future__ import annotations

import re

from app.main import app

FACILITATOR_PREFIX = "/api/facilitator/"
# The strand test viewer is open to admins as well (API-AUTH-04); everything else is facilitator-only.
SHARED_WITH_ADMIN_PREFIX = "/api/facilitator/strand-tests"


def facilitator_routes() -> list[tuple[str, str]]:
    """Every (METHOD, path) under /api/facilitator/, read from the app itself so a
    new route is covered without editing this file. Path parameters become 1."""
    routes = []
    for path, operations in app.openapi()["paths"].items():
        if not path.startswith(FACILITATOR_PREFIX):
            continue
        for method in operations:
            routes.append((method.upper(), re.sub(r"\{[^}]+\}", "1", path)))
    return sorted(routes)


async def statuses(client, routes, headers=None) -> dict[str, int]:
    """Calls each route with no body and returns {"METHOD path": status}. The
    role check runs before the body or query is validated, so none is needed."""
    seen = {}
    for method, path in routes:
        response = await client.request(method, path, headers=headers)
        seen[f"{method} {path}"] = response.status_code
    return seen


def other_than(expected: int, seen: dict[str, int]) -> dict[str, int]:
    return {route: status for route, status in seen.items() if status != expected}


async def test_api_auth_01_no_token_on_facilitator_routes(client):
    """API-AUTH-01: every /api/facilitator/* route answers 401 without a token."""
    routes = facilitator_routes()
    assert len(routes) >= 20, "the facilitator routes were not found in the app"

    seen = await statuses(client, routes)

    assert other_than(401, seen) == {}


async def test_api_auth_02_learner_on_facilitator_routes(client, make, login):
    """API-AUTH-02: every /api/facilitator/* route answers 403 to a learner."""
    learner = await make.learner("L1")
    headers = await login(learner)

    seen = await statuses(client, facilitator_routes(), headers)

    assert other_than(403, seen) == {}


async def test_api_auth_03_admin_on_facilitator_only_routes(client, make, login):
    """API-AUTH-03: the facilitator-only routes answer 403 to an admin."""
    admin = await make.admin("Adm")
    headers = await login(admin)
    facilitator_only = [route for route in facilitator_routes() if not route[1].startswith(SHARED_WITH_ADMIN_PREFIX)]
    assert len(facilitator_only) >= 20

    seen = await statuses(client, facilitator_only, headers)

    assert other_than(403, seen) == {}


async def test_api_auth_04_admin_on_strand_test_viewer(client, make, login):
    """API-AUTH-04: an admin can list the strand tests and open one."""
    admin = await make.admin("Adm")
    strand = await make.strand("LS1-EN")
    test = await make.strand_test(strand, "pretest")
    headers = await login(admin)

    listing = await client.get("/api/facilitator/strand-tests", headers=headers)
    detail = await client.get(f"/api/facilitator/strand-tests/{test.id}", headers=headers)

    assert listing.status_code == 200
    assert [item["id"] for item in listing.json()["items"]] == [test.id]
    assert detail.status_code == 200
    assert detail.json()["id"] == test.id
    assert len(detail.json()["items"]) == len(test.items)


async def test_api_auth_05_facilitator_on_admin_routes(client, make, login):
    """API-AUTH-05: cohort create, status, assign, roster and admin users answer 403 to a facilitator."""
    facilitator = await make.facilitator("FA")
    other_facilitator = await make.facilitator("FB")
    learner = await make.learner("L1")
    cohort = await make.cohort("S1")
    membership = await make.assign_learner(cohort, learner)
    assignment = await make.assign_facilitator(cohort, facilitator)
    headers = await login(facilitator)

    # Each request is valid as an admin would send it, so only the role can refuse it.
    new_cohort = {"name": "Not allowed", "school_year": "2026-2027", "start_date": "2026-06-01", "end_date": "2027-03-31"}
    calls = [
        ("POST", "/api/cohorts", new_cohort),
        ("GET", "/api/cohorts", None),
        ("PATCH", f"/api/cohorts/{cohort.id}/status", {"status": "completed"}),
        ("POST", f"/api/cohorts/{cohort.id}/facilitators", {"facilitator_id": other_facilitator.facilitator_id}),
        ("POST", f"/api/cohorts/{cohort.id}/learners", {"learner_id": learner.learner_id}),
        ("GET", f"/api/cohorts/{cohort.id}/members", None),
        ("PATCH", f"/api/cohort-learners/{membership}/status", {"status": "ended"}),
        ("PATCH", f"/api/cohort-facilitators/{assignment}/status", {"status": "ended"}),
        ("GET", "/api/admin/users", None),
        ("POST", "/api/admin/learners", {"first_name": "Not", "last_name": "Allowed"}),
        ("PATCH", f"/api/admin/users/{learner.id}/deactivate", None),
    ]

    seen = {}
    for method, path, body in calls:
        response = await client.request(method, path, json=body, headers=headers)
        seen[f"{method} {path}"] = response.status_code

    assert other_than(403, seen) == {}
    # Nothing was changed by the refused calls.
    admin_headers = await login(await make.system_admin())
    roster = (await client.get(f"/api/cohorts/{cohort.id}/members", headers=admin_headers)).json()
    assert roster["status"] == "active"
    assert [member["status"] for member in roster["learners"]] == ["active"]
    assert len(roster["facilitators"]) == 1


async def test_api_auth_06_deactivated_facilitator(client, make, login):
    """API-AUTH-06: a deactivated facilitator's old token is rejected (401 or 403)."""
    admin = await make.admin("Adm", is_super_admin=True)
    facilitator = await make.facilitator("FA")
    old_token = await login(facilitator)
    before = await client.get("/api/facilitator/cohorts", headers=old_token)
    assert before.status_code == 200

    deactivated = await client.patch(f"/api/admin/users/{facilitator.id}/deactivate", headers=await login(admin))
    assert deactivated.status_code == 200

    after = await client.get("/api/facilitator/cohorts", headers=old_token)
    assert after.status_code in (401, 403)
    # And the account can no longer sign in.
    signin = await client.post("/api/auth/login", data={"username": facilitator.id_no, "password": facilitator.password})
    assert signin.status_code in (401, 403)
