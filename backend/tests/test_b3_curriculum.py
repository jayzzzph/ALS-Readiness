"""B3. Curriculum structure (API-CUR-01 to 15).

Each test builds only the structure it needs. Modules and lessons are created
through the API here, not the factory, so their order_index is the app's own.
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest

ERROR_KEYS = {"success", "code", "message", "details"}


async def post_module(client, headers, strand_id: int, title: str, **extra) -> dict:
    response = await client.post(f"/api/facilitator/strands/{strand_id}/modules", headers=headers, json={"title": title, **extra})
    assert response.status_code == 201, response.text[:200]
    return response.json()


async def post_lesson(client, headers, module_id: int, title: str, **extra) -> dict:
    response = await client.post(f"/api/facilitator/modules/{module_id}/lessons", headers=headers, json={"title": title, **extra})
    assert response.status_code == 201, response.text[:200]
    return response.json()


async def set_status(client, headers, kind: str, node_id: int, status: str):
    return await client.patch(f"/api/facilitator/{kind}/{node_id}", headers=headers, json={"status": status})


async def get_tree(client, headers, strand_id: int, **params) -> dict:
    response = await client.get(f"/api/curriculum/{strand_id}", headers=headers, params=params)
    assert response.status_code == 200, response.text[:200]
    return response.json()


def outline(tree: dict) -> list[tuple[str, list[str]]]:
    """[(module title, [lesson titles])] in the order the tree gives them."""
    return [(module["title"], [lesson["title"] for lesson in module["lessons"]]) for module in tree["modules"]]


@pytest.fixture
async def structure(client, make, login) -> SimpleNamespace:
    """A facilitator and the Part A structure in one strand: M-A (LS-1, LS-2) and M-B (LS-3)."""
    fa = await make.facilitator("FA")
    headers = await login(fa)
    strand = await make.strand("LS1-EN")
    m_a = await post_module(client, headers, strand.id, "M-A")
    m_b = await post_module(client, headers, strand.id, "M-B")
    ls_1 = await post_lesson(client, headers, m_a["id"], "LS-1")
    ls_2 = await post_lesson(client, headers, m_a["id"], "LS-2")
    ls_3 = await post_lesson(client, headers, m_b["id"], "LS-3")
    return SimpleNamespace(fa=fa, headers=headers, strand=strand, m_a=m_a, m_b=m_b, ls_1=ls_1, ls_2=ls_2, ls_3=ls_3)


async def test_api_cur_01_strands_list(client, make, login):
    """API-CUR-01: the three active strands, in order; an archived strand is not listed."""
    for code in ("LS1-EN", "LS1-FIL"):
        await make.strand(code)
    await make.strand("LS2", status="archived")
    await make.strand("LS3")

    response = await client.get("/api/facilitator/strands", headers=await login(await make.facilitator("FA")))

    assert response.status_code == 200
    body = response.json()
    assert [strand["code"] for strand in body["items"]] == ["LS1-EN", "LS1-FIL", "LS3"]
    assert body["total"] == 3


async def test_api_cur_02_add_module(client, structure):
    """API-CUR-02: a new module is created (201), placed last, with created_by set to the facilitator."""
    s = structure

    response = await client.post(f"/api/facilitator/strands/{s.strand.id}/modules", headers=s.headers, json={"title": "M-C", "description": "Third"})

    assert response.status_code == 201
    body = response.json()
    assert (body["title"], body["description"], body["status"], body["strand_id"]) == ("M-C", "Third", "active", s.strand.id)
    assert body["created_by"] == s.fa.id
    assert body["order_index"] == max(s.m_a["order_index"], s.m_b["order_index"]) + 1
    assert [title for title, _ in outline(await get_tree(client, s.headers, s.strand.id))] == ["M-A", "M-B", "M-C"]


async def test_api_cur_03_add_lesson(client, structure):
    """API-CUR-03: a new lesson is created (201) and placed last in its module."""
    s = structure

    response = await client.post(f"/api/facilitator/modules/{s.m_a['id']}/lessons", headers=s.headers, json={"title": "LS-NEW"})

    assert response.status_code == 201
    body = response.json()
    assert (body["title"], body["module_id"], body["status"], body["created_by"]) == ("LS-NEW", s.m_a["id"], "active", s.fa.id)
    assert body["order_index"] == max(s.ls_1["order_index"], s.ls_2["order_index"]) + 1
    assert outline(await get_tree(client, s.headers, s.strand.id))[0] == ("M-A", ["LS-1", "LS-2", "LS-NEW"])


@pytest.mark.parametrize("kind", ["module", "lesson"])
@pytest.mark.parametrize("title", ["", "   "], ids=["empty", "whitespace"])
async def test_api_cur_04_blank_title(client, structure, kind, title):
    """API-CUR-04: an empty or whitespace-only title is refused with 422, for a module and for a lesson."""
    s = structure
    path = f"/api/facilitator/strands/{s.strand.id}/modules" if kind == "module" else f"/api/facilitator/modules/{s.m_a['id']}/lessons"

    response = await client.post(path, headers=s.headers, json={"title": title})

    assert response.status_code == 422
    assert response.json()["code"] == "REQUEST_VALIDATION"
    assert outline(await get_tree(client, s.headers, s.strand.id)) == [("M-A", ["LS-1", "LS-2"]), ("M-B", ["LS-3"])]


async def test_api_cur_05_edit_module_and_lesson(client, structure):
    """API-CUR-05: PATCH changes the title and description (200) and moves updated_at forward."""
    s = structure

    module = await client.patch(f"/api/facilitator/modules/{s.m_a['id']}", headers=s.headers, json={"title": "M-A edited", "description": "New text"})
    lesson = await client.patch(f"/api/facilitator/lessons/{s.ls_1['id']}", headers=s.headers, json={"title": "LS-1 edited", "description": "More"})

    assert module.status_code == 200
    assert (module.json()["title"], module.json()["description"]) == ("M-A edited", "New text")
    assert module.json()["updated_at"] > s.m_a["updated_at"]
    assert module.json()["created_at"] == s.m_a["created_at"]
    assert lesson.status_code == 200
    assert (lesson.json()["title"], lesson.json()["description"]) == ("LS-1 edited", "More")
    assert lesson.json()["updated_at"] > s.ls_1["updated_at"]
    # Position and status are untouched by an edit.
    assert (module.json()["order_index"], module.json()["status"]) == (s.m_a["order_index"], "active")
    assert outline(await get_tree(client, s.headers, s.strand.id))[0] == ("M-A edited", ["LS-1 edited", "LS-2"])


async def test_api_cur_06_archive_hides_from_tree(client, structure):
    """API-CUR-06: after archiving M-B, the default tree has neither M-B nor its lesson LS-3."""
    s = structure

    archived = await set_status(client, s.headers, "modules", s.m_b["id"], "archived")

    assert (archived.status_code, archived.json()["status"]) == (200, "archived")
    assert outline(await get_tree(client, s.headers, s.strand.id)) == [("M-A", ["LS-1", "LS-2"])]


async def test_api_cur_07_include_archived(client, structure):
    """API-CUR-07: with include_archived=true the tree shows M-B as archived, with LS-3 under it."""
    s = structure
    await set_status(client, s.headers, "modules", s.m_b["id"], "archived")

    tree = await get_tree(client, s.headers, s.strand.id, include_archived="true")

    assert outline(tree) == [("M-A", ["LS-1", "LS-2"]), ("M-B", ["LS-3"])]
    statuses = {module["title"]: module["status"] for module in tree["modules"]}
    assert statuses == {"M-A": "active", "M-B": "archived"}


@pytest.mark.parametrize("kind", ["modules", "lessons"])
async def test_api_cur_08_deleted_status_refused(client, structure, kind):
    """API-CUR-08: status "deleted" cannot be set through the API (422), for a module or a lesson."""
    s = structure
    node = s.m_b if kind == "modules" else s.ls_3

    response = await set_status(client, s.headers, kind, node["id"], "deleted")

    assert response.status_code == 422
    assert response.json()["code"] == "REQUEST_VALIDATION"
    assert outline(await get_tree(client, s.headers, s.strand.id)) == [("M-A", ["LS-1", "LS-2"]), ("M-B", ["LS-3"])]


async def test_api_cur_09_restore_module(client, structure):
    """API-CUR-09: restoring an archived module (200) brings it back, placed last."""
    s = structure
    # M-A is the one archived, so "placed last" is a real move: it was first.
    await set_status(client, s.headers, "modules", s.m_a["id"], "archived")

    restored = await set_status(client, s.headers, "modules", s.m_a["id"], "active")

    assert (restored.status_code, restored.json()["status"]) == (200, "active")
    tree = await get_tree(client, s.headers, s.strand.id)
    assert outline(tree) == [("M-B", ["LS-3"]), ("M-A", ["LS-1", "LS-2"])]
    assert restored.json()["order_index"] > s.m_b["order_index"]


async def test_api_cur_10_restore_lesson_under_archived_module(client, structure):
    """API-CUR-10: a lesson cannot be restored while its module is archived (409 MODULE_NOT_ACTIVE)."""
    s = structure
    await set_status(client, s.headers, "lessons", s.ls_3["id"], "archived")
    await set_status(client, s.headers, "modules", s.m_b["id"], "archived")

    response = await set_status(client, s.headers, "lessons", s.ls_3["id"], "active")

    assert response.status_code == 409
    assert response.json()["code"] == "MODULE_NOT_ACTIVE"
    tree = await get_tree(client, s.headers, s.strand.id, include_archived="true")
    lesson = tree["modules"][1]["lessons"][0]
    assert (lesson["title"], lesson["status"]) == ("LS-3", "archived")


async def test_api_cur_11_add_lesson_under_archived_module(client, structure):
    """API-CUR-11: a lesson cannot be added to an archived module (409 MODULE_NOT_ACTIVE)."""
    s = structure
    await set_status(client, s.headers, "modules", s.m_b["id"], "archived")

    response = await client.post(f"/api/facilitator/modules/{s.m_b['id']}/lessons", headers=s.headers, json={"title": "LS-4"})

    assert response.status_code == 409
    assert response.json()["code"] == "MODULE_NOT_ACTIVE"
    tree = await get_tree(client, s.headers, s.strand.id, include_archived="true")
    assert outline(tree)[1] == ("M-B", ["LS-3"])


async def test_api_cur_12_reorder_modules(client, structure):
    """API-CUR-12: PUT order with every active module id reversed answers 200 and numbers them 1..n in the new order."""
    s = structure
    m_c = await post_module(client, s.headers, s.strand.id, "M-C")
    reversed_ids = [m_c["id"], s.m_b["id"], s.m_a["id"]]

    response = await client.put(f"/api/facilitator/strands/{s.strand.id}/modules/order", headers=s.headers, json={"ids": reversed_ids})

    assert response.status_code == 200
    assert [(item["id"], item["order_index"]) for item in response.json()["items"]] == [(reversed_ids[0], 1), (reversed_ids[1], 2), (reversed_ids[2], 3)]
    tree = await get_tree(client, s.headers, s.strand.id)
    assert [(module["title"], module["order_index"]) for module in tree["modules"]] == [("M-C", 1), ("M-B", 2), ("M-A", 3)]


@pytest.mark.parametrize("problem", ["missing id", "extra id", "duplicate id", "archived id"])
async def test_api_cur_13_reorder_with_wrong_ids(client, structure, problem):
    """API-CUR-13: a list that is not exactly the active module ids is refused with 400 INVALID_ORDER."""
    s = structure
    m_c = await post_module(client, s.headers, s.strand.id, "M-C")
    archived = await post_module(client, s.headers, s.strand.id, "M-OLD")
    await set_status(client, s.headers, "modules", archived["id"], "archived")
    a, b, c = s.m_a["id"], s.m_b["id"], m_c["id"]
    ids = {
        "missing id": [c, b],
        "extra id": [c, b, a, 999999],
        "duplicate id": [c, b, a, a],
        "archived id": [c, b, a, archived["id"]],
    }[problem]

    response = await client.put(f"/api/facilitator/strands/{s.strand.id}/modules/order", headers=s.headers, json={"ids": ids})

    assert response.status_code == 400
    assert response.json()["code"] == "INVALID_ORDER"
    tree = await get_tree(client, s.headers, s.strand.id)
    assert [module["title"] for module in tree["modules"]] == ["M-A", "M-B", "M-C"]


async def test_api_cur_14_not_found(client, structure):
    """API-CUR-14: a missing module, lesson or strand answers 404 in the project's error shape."""
    s = structure

    module = await client.patch("/api/facilitator/modules/999999", headers=s.headers, json={"title": "x"})
    lesson = await client.patch("/api/facilitator/lessons/999999", headers=s.headers, json={"title": "x"})
    tree = await client.get("/api/curriculum/999999", headers=s.headers)

    for response, code in ((module, "MODULE_NOT_FOUND"), (lesson, "LESSON_NOT_FOUND"), (tree, "LEARNING_STRAND_NOT_FOUND")):
        assert response.status_code == 404
        body = response.json()
        assert set(body) == ERROR_KEYS
        assert (body["success"], body["code"], body["details"]) == (False, code, None)
        assert body["message"]


async def test_api_cur_15_learner_tree_excludes_archived(client, make, login, structure):
    """API-CUR-15: content assigned under a lesson that is then archived is absent from the learner's tree."""
    s = structure
    learner = await make.learner("L1")
    cohort = await make.cohort("S1")
    await make.assign_facilitator(cohort, s.fa)
    await make.assign_learner(cohort, learner)
    from tests.factories import NodeRecord

    kept = await make.content(NodeRecord(id=s.ls_1["id"], title="LS-1"), "Kept", uploaded_by=s.fa)
    hidden = await make.content(NodeRecord(id=s.ls_2["id"], title="LS-2"), "Under archived lesson", uploaded_by=s.fa)
    for content in (kept, hidden):
        assigned = await client.post(f"/api/facilitator/cohorts/{cohort.id}/contents", headers=s.headers, json={"content_id": content.id})
        assert assigned.status_code == 201
    learner_headers = await login(learner)

    def content_titles(tree: dict) -> list[str]:
        return [content["title"] for module in tree["modules"] for lesson in module["lessons"] for content in lesson["contents"]]

    before = (await client.get(f"/api/me/curriculum/{s.strand.id}", headers=learner_headers)).json()
    assert sorted(content_titles(before)) == ["Kept", "Under archived lesson"]

    archived = await set_status(client, s.headers, "lessons", s.ls_2["id"], "archived")
    assert archived.status_code == 200

    response = await client.get(f"/api/me/curriculum/{s.strand.id}", headers=learner_headers)
    assert response.status_code == 200
    tree = response.json()
    assert content_titles(tree) == ["Kept"]
    assert [lesson["title"] for module in tree["modules"] for lesson in module["lessons"]] == ["LS-1", "LS-3"]
