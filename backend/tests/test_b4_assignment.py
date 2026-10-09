"""B4. Content assignment and visibility (API-ASG-01 to 13).

These cases need two facilitators, their cohorts and their content, but no
learners' test attempts, so they use a lighter world than the full cast.
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.models.learner_content_progress import LearnerContentProgress


@pytest.fixture
async def world(make) -> SimpleNamespace:
    """FA (S1, A1, A2 completed, U1 upcoming) and FB (S1, B1), one strand with
    lesson LS-1, and the four Part A content items in it. Nothing is assigned."""
    fa = await make.facilitator("FA")
    fb = await make.facilitator("FB")
    s1 = await make.cohort("S1", status="active")
    a1 = await make.cohort("A1", status="active")
    a2 = await make.cohort("A2", school_year="2025-2026", status="completed")
    u1 = await make.cohort("U1", status="upcoming")
    b1 = await make.cohort("B1", status="active")
    for cohort in (s1, a1, a2, u1):
        await make.assign_facilitator(cohort, fa)
    for cohort in (s1, b1):
        await make.assign_facilitator(cohort, fb)
    strand = await make.strand("LS1-EN")
    module = await make.module(strand, "M-A", order_index=1, created_by=fa)
    ls_1 = await make.lesson(module, "LS-1", order_index=1, created_by=fa)
    return SimpleNamespace(
        fa=fa, fb=fb, s1=s1, a1=a1, a2=a2, u1=u1, b1=b1, strand=strand, module=module, ls_1=ls_1,
        c_fa_priv=await make.content(ls_1, "C-FA-PRIV", uploaded_by=fa, visibility="private"),
        c_fa_pub=await make.content(ls_1, "C-FA-PUB", uploaded_by=fa, visibility="public"),
        c_fb_priv=await make.content(ls_1, "C-FB-PRIV", uploaded_by=fb, visibility="private"),
        c_fb_pub=await make.content(ls_1, "C-FB-PUB", uploaded_by=fb, visibility="public"),
    )


async def assign(client, headers, cohort, content_id: int):
    return await client.post(f"/api/facilitator/cohorts/{cohort.id}/contents", headers=headers, json={"content_id": content_id})


async def lesson_view(client, headers, world, cohort) -> SimpleNamespace:
    """LS-1 as the facilitator's tree shows it for a cohort: titles under `contents` and under `available_contents`."""
    response = await client.get(f"/api/curriculum/{world.strand.id}", headers=headers, params={"cohort_id": cohort.id})
    assert response.status_code == 200, response.text[:200]
    lesson = response.json()["modules"][0]["lessons"][0]
    return SimpleNamespace(
        contents=sorted(item["title"] for item in lesson["contents"]),
        available=sorted(item["title"] for item in lesson["available_contents"]),
        by_title={item["title"]: item for item in lesson["contents"] + lesson["available_contents"]},
    )


async def test_api_asg_01_assign_own_content(client, world, login):
    """API-ASG-01: FA assigns C-FA-PRIV to S1 (201) and it appears under `contents` for S1."""
    headers = await login(world.fa)
    before = await lesson_view(client, headers, world, world.s1)
    assert (before.contents, "C-FA-PRIV" in before.available) == ([], True)

    response = await assign(client, headers, world.s1, world.c_fa_priv.id)

    assert response.status_code == 201
    body = response.json()
    assert (body["cohort_id"], body["content_id"], body["assigned_by"]) == (world.s1.id, world.c_fa_priv.id, world.fa.id)
    after = await lesson_view(client, headers, world, world.s1)
    assert after.contents == ["C-FA-PRIV"]
    assert "C-FA-PRIV" not in after.available
    assert after.by_title["C-FA-PRIV"]["is_own"] is True


async def test_api_asg_02_duplicate_assign(client, world, login):
    """API-ASG-02: assigning the same content to the same cohort again answers 409 CONTENT_ALREADY_ASSIGNED."""
    headers = await login(world.fa)
    assert (await assign(client, headers, world.s1, world.c_fa_priv.id)).status_code == 201

    response = await assign(client, headers, world.s1, world.c_fa_priv.id)

    assert response.status_code == 409
    assert response.json()["code"] == "CONTENT_ALREADY_ASSIGNED"
    assert (await lesson_view(client, headers, world, world.s1)).contents == ["C-FA-PRIV"]


async def test_api_asg_03_unassign(client, make, world, login):
    """API-ASG-03: DELETE answers 204, the content moves back to `available_contents`, and progress rows are untouched."""
    headers = await login(world.fa)
    learner = await make.learner("L1")
    await make.assign_learner(world.s1, learner)
    assert (await assign(client, headers, world.s1, world.c_fa_priv.id)).status_code == 201
    await make.progress(learner, world.c_fa_priv, status="completed")

    response = await client.delete(f"/api/facilitator/cohorts/{world.s1.id}/contents/{world.c_fa_priv.id}", headers=headers)

    assert response.status_code == 204
    assert response.content == b""
    view = await lesson_view(client, headers, world, world.s1)
    assert view.contents == []
    assert "C-FA-PRIV" in view.available
    assert await make.count(LearnerContentProgress, learner_id=learner.learner_id, content_id=world.c_fa_priv.id) == 1
    # Assigning it again brings the learner's progress back with it.
    assert (await assign(client, headers, world.s1, world.c_fa_priv.id)).status_code == 201
    tree = (await client.get(f"/api/me/curriculum/{world.strand.id}", headers=await login(learner))).json()
    # The learner tree reports progress as two times; a set completed_at means completed.
    assert [content["completed_at"] is not None for content in tree["modules"][0]["lessons"][0]["contents"]] == [True]


async def test_api_asg_04_unassign_not_assigned(client, world, login):
    """API-ASG-04: unassigning content that is not assigned answers 404 CONTENT_NOT_ASSIGNED."""
    headers = await login(world.fa)
    assert (await assign(client, headers, world.s1, world.c_fa_priv.id)).status_code == 201
    path = f"/api/facilitator/cohorts/{world.s1.id}/contents/{world.c_fa_priv.id}"
    assert (await client.delete(path, headers=headers)).status_code == 204

    response = await client.delete(path, headers=headers)

    assert response.status_code == 404
    assert response.json()["code"] == "CONTENT_NOT_ASSIGNED"


async def test_api_asg_05_assign_in_completed_cohort(client, world, login):
    """API-ASG-05: content cannot be assigned in a completed cohort (409 COHORT_NOT_ACTIVE)."""
    headers = await login(world.fa)

    response = await assign(client, headers, world.a2, world.c_fa_priv.id)

    assert response.status_code == 409
    assert response.json()["code"] == "COHORT_NOT_ACTIVE"
    assert (await lesson_view(client, headers, world, world.a2)).contents == []


async def test_api_asg_06_assign_in_upcoming_cohort(client, world, login):
    """API-ASG-06: content cannot be assigned in an upcoming cohort (409 COHORT_NOT_ACTIVE)."""
    headers = await login(world.fa)

    response = await assign(client, headers, world.u1, world.c_fa_priv.id)

    assert response.status_code == 409
    assert response.json()["code"] == "COHORT_NOT_ACTIVE"
    assert (await lesson_view(client, headers, world, world.u1)).contents == []


async def test_api_asg_07_assign_in_anothers_cohort(client, world, login):
    """API-ASG-07: FA cannot assign in B1, which is not FA's cohort (403 COHORT_ACCESS_DENIED)."""
    response = await assign(client, await login(world.fa), world.b1, world.c_fa_priv.id)

    assert response.status_code == 403
    assert response.json()["code"] == "COHORT_ACCESS_DENIED"
    assert (await lesson_view(client, await login(world.fb), world, world.b1)).contents == []


async def test_api_asg_08_assign_anothers_private_content(client, world, login):
    """API-ASG-08: assigning FB's private content answers 404, with the same body as a content id that does not exist."""
    headers = await login(world.fa)

    private = await assign(client, headers, world.a1, world.c_fb_priv.id)
    missing = await assign(client, headers, world.a1, 999999)

    assert private.status_code == 404
    assert missing.status_code == 404
    # Identical, so the answer does not reveal that the private item exists.
    assert private.json() == missing.json()
    assert (await lesson_view(client, headers, world, world.a1)).contents == []


async def test_api_asg_09_assign_anothers_public_content(client, world, login):
    """API-ASG-09: FA can assign FB's public content to FA's own cohort (201)."""
    headers = await login(world.fa)

    response = await assign(client, headers, world.a1, world.c_fb_pub.id)

    assert response.status_code == 201
    view = await lesson_view(client, headers, world, world.a1)
    assert view.contents == ["C-FB-PUB"]
    assert view.by_title["C-FB-PUB"]["is_own"] is False


async def test_api_asg_10_shared_cohort_visibility(client, world, login):
    """API-ASG-10: once FB assigns C-FB-PRIV to the shared cohort S1, FA sees it under `contents` for S1 with is_own false."""
    fa = await login(world.fa)
    assert "C-FB-PRIV" not in (await lesson_view(client, fa, world, world.s1)).by_title

    assert (await assign(client, await login(world.fb), world.s1, world.c_fb_priv.id)).status_code == 201

    view = await lesson_view(client, fa, world, world.s1)
    assert view.contents == ["C-FB-PRIV"]
    assert view.by_title["C-FB-PRIV"]["is_own"] is False
    assert view.by_title["C-FB-PRIV"]["visibility"] == "private"


async def test_api_asg_11_shared_item_not_assignable_elsewhere(client, world, login):
    """API-ASG-11: seeing FB's private item through S1 does not let FA assign it to A1 (404), nor list it as available there."""
    fa = await login(world.fa)
    assert (await assign(client, await login(world.fb), world.s1, world.c_fb_priv.id)).status_code == 201

    response = await assign(client, fa, world.a1, world.c_fb_priv.id)

    assert response.status_code == 404
    assert response.json() == (await assign(client, fa, world.a1, 999999)).json()
    view = await lesson_view(client, fa, world, world.a1)
    assert view.contents == []
    assert "C-FB-PRIV" not in view.available
    assert view.available == ["C-FA-PRIV", "C-FA-PUB", "C-FB-PUB"]


async def test_api_asg_12_cohorts_are_independent(client, world, login):
    """API-ASG-12: assigning in S1 leaves A1's `contents` as they were."""
    headers = await login(world.fa)
    assert (await assign(client, headers, world.a1, world.c_fa_pub.id)).status_code == 201
    a1_before = await lesson_view(client, headers, world, world.a1)

    assert (await assign(client, headers, world.s1, world.c_fa_priv.id)).status_code == 201

    a1_after = await lesson_view(client, headers, world, world.a1)
    assert a1_after.contents == a1_before.contents == ["C-FA-PUB"]
    assert a1_after.available == a1_before.available
    assert "C-FA-PRIV" in a1_after.available
    assert (await lesson_view(client, headers, world, world.s1)).contents == ["C-FA-PRIV"]


async def test_api_asg_13_assign_under_archived_lesson(client, world, login):
    """API-ASG-13: content of an archived lesson cannot be assigned (409 LESSON_NOT_ACTIVE)."""
    headers = await login(world.fa)
    archived = await client.patch(f"/api/facilitator/lessons/{world.ls_1.id}", headers=headers, json={"status": "archived"})
    assert archived.status_code == 200

    response = await assign(client, headers, world.s1, world.c_fa_priv.id)

    assert response.status_code == 409
    assert response.json()["code"] == "LESSON_NOT_ACTIVE"
