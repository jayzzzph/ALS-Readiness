"""B9. Strand tests (API-TST-01 to 07): the read-only viewer and what learners can see."""

from __future__ import annotations

from types import SimpleNamespace

import pytest
from sqlalchemy import update

from app.db.session import AsyncSessionLocal
from app.models.strand_test import StrandTestItem, StrandTestItemOption

VIEWER = "/api/facilitator/strand-tests"


@pytest.fixture
async def tests_world(make) -> SimpleNamespace:
    """A facilitator, two strands, and three tests with different numbers of attempts:
    the LS1-EN pretest (4 items) taken by two learners, the LS1-EN posttest (4 items)
    by one, and the LS3 pretest (3 items) by nobody."""
    fa = await make.facilitator("FA")
    english = await make.strand("LS1-EN")
    math = await make.strand("LS3")
    await make.lri_test()
    en_pre = await make.strand_test(english, "pretest", items=4)
    en_post = await make.strand_test(english, "posttest", items=4)
    math_pre = await make.strand_test(math, "pretest", items=3)
    first = await make.learner("L1")
    second = await make.learner("L2")
    await make.attempt(first, en_pre, correct=3)
    await make.attempt(second, en_pre, correct=1)
    await make.attempt(first, en_post, correct=4)
    return SimpleNamespace(fa=fa, english=english, math=math, en_pre=en_pre, en_post=en_post, math_pre=math_pre, first=first, second=second)


async def test_api_tst_01_list(client, tests_world, login):
    """API-TST-01: every test is listed with its item count and attempt count, and is_locked is true only where attempts exist."""
    w = tests_world

    response = await client.get(VIEWER, headers=await login(w.fa))

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 3
    listed = {item["id"]: (item["strand_code"], item["type"], item["item_count"], item["attempt_count"], item["is_locked"]) for item in body["items"]}
    assert listed == {
        w.en_pre.id: ("LS1-EN", "pretest", 4, 2, True),
        w.en_post.id: ("LS1-EN", "posttest", 4, 1, True),
        w.math_pre.id: ("LS3", "pretest", 3, 0, False),
    }


async def test_api_tst_02_filters(client, tests_world, login):
    """API-TST-02: strand_id and type each narrow the list, alone and together."""
    w = tests_world
    headers = await login(w.fa)

    async def ids(**params) -> list[int]:
        response = await client.get(VIEWER, headers=headers, params=params)
        assert response.status_code == 200
        assert response.json()["total"] == len(response.json()["items"])
        return sorted(item["id"] for item in response.json()["items"])

    assert await ids(strand_id=w.english.id) == sorted([w.en_pre.id, w.en_post.id])
    assert await ids(strand_id=w.math.id) == [w.math_pre.id]
    assert await ids(type="pretest") == sorted([w.en_pre.id, w.math_pre.id])
    assert await ids(type="posttest") == [w.en_post.id]
    assert await ids(strand_id=w.math.id, type="posttest") == []
    assert await ids(strand_id=w.english.id, type="posttest") == [w.en_post.id]


async def test_api_tst_03_detail(client, tests_world, login):
    """API-TST-03: the detail lists items and options in id order, and each option's is_correct is what was seeded."""
    w = tests_world

    response = await client.get(f"{VIEWER}/{w.en_pre.id}", headers=await login(w.fa))

    assert response.status_code == 200
    body = response.json()
    assert (body["id"], body["type"], body["item_count"], body["attempt_count"], body["is_locked"]) == (w.en_pre.id, "pretest", 4, 2, True)
    item_ids = [item["id"] for item in body["items"]]
    assert item_ids == sorted(item_ids) == [item.item_id for item in w.en_pre.items]
    for seen, seeded in zip(body["items"], w.en_pre.items):
        option_ids = [option["id"] for option in seen["options"]]
        assert option_ids == sorted(option_ids)
        assert {option["id"]: option["is_correct"] for option in seen["options"]} == {seeded.correct_option_id: True, seeded.wrong_option_id: False}
        assert seen["question_text"]


async def test_api_tst_04_integrity_summary(client, make, tests_world, login):
    """API-TST-04: an item with no correct option and one with two are each reported by id."""
    w = tests_world
    headers = await login(w.fa)
    clean = (await client.get(f"{VIEWER}/{w.math_pre.id}", headers=headers)).json()["integrity"]
    assert clean == {"items_without_correct_option": {"count": 0, "item_ids": []}, "items_with_multiple_correct_options": {"count": 0, "item_ids": []}}

    none_correct, _ = await make.strand_test_item(w.math_pre, correct=[False, False, False])
    two_correct, _ = await make.strand_test_item(w.math_pre, correct=[True, False, True])
    also_none, _ = await make.strand_test_item(w.math_pre, correct=[False])

    response = await client.get(f"{VIEWER}/{w.math_pre.id}", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["item_count"] == 6
    assert body["integrity"]["items_without_correct_option"]["count"] == 2
    assert sorted(body["integrity"]["items_without_correct_option"]["item_ids"]) == sorted([none_correct, also_none])
    assert body["integrity"]["items_with_multiple_correct_options"] == {"count": 1, "item_ids": [two_correct]}
    # Another test is not affected.
    other = (await client.get(f"{VIEWER}/{w.en_pre.id}", headers=headers)).json()["integrity"]
    assert (other["items_without_correct_option"]["count"], other["items_with_multiple_correct_options"]["count"]) == (0, 0)


@pytest.mark.parametrize("method", ["POST", "PUT", "PATCH", "DELETE"])
async def test_api_tst_05_read_only(client, tests_world, login, method):
    """API-TST-05: the viewer has no write methods: POST, PUT, PATCH and DELETE answer 405 on the list and on a test."""
    w = tests_world
    headers = await login(w.fa)
    body = {"title": "Changed", "type": "posttest", "strand_id": w.math.id}

    on_list = await client.request(method, VIEWER, headers=headers, json=body)
    on_test = await client.request(method, f"{VIEWER}/{w.en_pre.id}", headers=headers, json=body)

    assert on_list.status_code == 405
    assert on_test.status_code == 405
    unchanged = (await client.get(f"{VIEWER}/{w.en_pre.id}", headers=headers)).json()
    assert (unchanged["title"], unchanged["type"], unchanged["item_count"]) == (w.en_pre.title, "pretest", 4)


def keys_and_texts(value) -> tuple[set[str], list[str]]:
    """Every key in a JSON body, however deep, and every string value."""
    if isinstance(value, dict):
        keys, texts = set(value), []
        for item in value.values():
            more_keys, more_texts = keys_and_texts(item)
            keys |= more_keys
            texts += more_texts
        return keys, texts
    if isinstance(value, list):
        keys, texts = set(), []
        for item in value:
            more_keys, more_texts = keys_and_texts(item)
            keys |= more_keys
            texts += more_texts
        return keys, texts
    return set(), [value] if isinstance(value, str) else []


# Every learner-facing test endpoint. API-TST-06 calls each one and inspects the body.
LEARNER_TEST_ENDPOINTS = [
    "GET /api/learner/strand-tests?test_type=pretest",
    "GET /api/learner/strand-tests?test_type=posttest",
    "GET /api/learner/strand-tests/{test_id}",
    "GET /api/learner/strand-tests/{test_id}?include_items=true (before attempting)",
    "POST /api/learner/strand-tests/{test_id}/attempts",
    "GET /api/learner/strand-tests/{test_id}/attempts",
    "GET /api/learner/strand-tests/{test_id}?include_items=true (after attempting)",
    "GET /api/learner/lri-tests",
    "GET /api/learner/lri-tests/{test_id}",
    "POST /api/learner/lri-tests/{test_id}/attempts",
    "GET /api/learner/lri-tests/{test_id}/attempts",
]


async def test_api_tst_06_no_leak_to_learners(client, make, login):
    """API-TST-06: no learner test endpoint returns is_correct or anything equivalent: no key about
    correctness, and nothing per option beyond its id and text."""
    strand = await make.strand("LS1-EN")
    lri = await make.lri_test()
    test = await make.strand_test(strand, "pretest", items=4)
    await make.strand_test(strand, "posttest", items=4)
    learner = await make.learner("L1")
    await make.intake(learner)
    headers = await login(learner)
    base = "/api/learner"
    bodies: dict[str, object] = {}

    async def call(label: str, method: str, path: str, **kwargs) -> None:
        response = await client.request(method, f"{base}{path}", headers=headers, **kwargs)
        assert response.status_code in (200, 201), (label, response.status_code, response.text[:200])
        bodies[label] = response.json()

    names = iter(LEARNER_TEST_ENDPOINTS)
    await call(next(names), "GET", "/strand-tests", params={"test_type": "pretest"})
    await call(next(names), "GET", "/strand-tests", params={"test_type": "posttest"})
    await call(next(names), "GET", f"/strand-tests/{test.id}")
    await call(next(names), "GET", f"/strand-tests/{test.id}", params={"include_items": "true"})
    lri_names = LEARNER_TEST_ENDPOINTS[7:]
    await call(lri_names[0], "GET", "/lri-tests")
    await call(lri_names[1], "GET", f"/lri-tests/{lri.id}")
    await call(lri_names[2], "POST", f"/lri-tests/{lri.id}/attempts", json={"answers": [{"item_id": item_id, "answer_value": 3} for item_id in lri.item_ids]})
    await call(lri_names[3], "GET", f"/lri-tests/{lri.id}/attempts")
    await call(next(names), "POST", f"/strand-tests/{test.id}/attempts", json=test.answers(correct=3))
    await call(next(names), "GET", f"/strand-tests/{test.id}/attempts")
    await call(next(names), "GET", f"/strand-tests/{test.id}", params={"include_items": "true"})
    assert set(bodies) == set(LEARNER_TEST_ENDPOINTS), "an endpoint in the list was not called"

    leaks = {}
    for label, body in bodies.items():
        keys, _ = keys_and_texts(body)
        suspicious = sorted(key for key in keys if "correct" in key.lower() or "answer_key" in key.lower() or key.lower() in {"is_right", "right", "solution"})
        if suspicious:
            leaks[label] = suspicious
    assert leaks == {}

    # Where options are shown, each carries its id and text and nothing else.
    for label in (LEARNER_TEST_ENDPOINTS[3], LEARNER_TEST_ENDPOINTS[6]):
        items = bodies[label]["items"]
        assert len(items) == 4
        for item in items:
            assert len(item["options"]) == 2
            for option in item["options"]:
                assert set(option) == {"option_id", "option_text"}, label

    # The result gives the totals only: nothing says which answers were right.
    result = bodies[LEARNER_TEST_ENDPOINTS[5]]
    assert set(result) == {"attempt_id", "test_id", "total_score", "item_count", "mps", "taken_at"}
    assert (result["total_score"], result["item_count"]) == (3, 4)
    assert set(bodies[LEARNER_TEST_ENDPOINTS[4]]) == {"attempt_id", "status"}

    # And the viewer that does show the answer key is closed to the learner.
    viewer = await client.get(f"{VIEWER}/{test.id}", headers=headers)
    assert viewer.status_code == 403
    assert "is_correct" not in viewer.text


async def test_api_tst_07_missing_test(client, make, login):
    """API-TST-07: a test id that does not exist answers 404 STRAND_TEST_NOT_FOUND."""
    response = await client.get(f"{VIEWER}/999999", headers=await login(await make.facilitator("FA")))

    assert response.status_code == 404
    body = response.json()
    assert (body["success"], body["code"]) == (False, "STRAND_TEST_NOT_FOUND")


async def test_api_tst_08_learner_order_is_id_order(client, make, login):
    """API-TST-08: the learner's test detail returns items by id and options by id within each item, the same
    order as the facilitator viewer, even when the rows' physical order differs; and it shows no correctness field."""
    strand = await make.strand("LS1-EN")
    test = await make.strand_test(strand, "pretest", items=6)
    # More options on some items, so option order within an item is worth checking.
    extra_item, extra_options = await make.strand_test_item(test, correct=[False, True, False, False])
    # Update early rows after later ones were inserted. Postgres writes an updated row as a new
    # physical row, so the table's physical order no longer follows the ids.
    async with AsyncSessionLocal() as session, session.begin():
        for item in test.items[:3]:
            await session.execute(update(StrandTestItem).where(StrandTestItem.id == item.item_id).values(question_text=f"Edited question {item.item_id}"))
            await session.execute(update(StrandTestItemOption).where(StrandTestItemOption.id == item.correct_option_id).values(option_text="right (edited)"))
        await session.execute(update(StrandTestItemOption).where(StrandTestItemOption.id == extra_options[0]).values(option_text="first option, edited last"))
    facilitator = await make.facilitator("FA")
    learner = await make.learner("L1")

    as_learner = await client.get(f"/api/learner/strand-tests/{test.id}", headers=await login(learner), params={"include_items": "true"})
    as_facilitator = await client.get(f"{VIEWER}/{test.id}", headers=await login(facilitator))

    assert as_learner.status_code == 200
    assert as_facilitator.status_code == 200
    learner_items = as_learner.json()["items"]
    viewer_items = as_facilitator.json()["items"]
    expected_item_ids = sorted([item.item_id for item in test.items] + [extra_item])
    assert len(learner_items) == 7

    # Items by id, and the same order as the viewer.
    assert [item["item_id"] for item in learner_items] == expected_item_ids
    assert [item["item_id"] for item in learner_items] == [item["id"] for item in viewer_items]
    # Options by id within each item, and the same order as the viewer.
    for seen, in_viewer in zip(learner_items, viewer_items):
        option_ids = [option["option_id"] for option in seen["options"]]
        assert option_ids == sorted(option_ids), seen["item_id"]
        assert option_ids == [option["id"] for option in in_viewer["options"]]
        assert seen["question_text"] == in_viewer["question_text"]
        assert [option["option_text"] for option in seen["options"]] == [option["option_text"] for option in in_viewer["options"]]
    assert [option["option_id"] for option in learner_items[-1]["options"]] == extra_options
    # Same rows as before: nothing dropped or doubled, and the edits are there.
    assert [len(item["options"]) for item in learner_items] == [2, 2, 2, 2, 2, 2, 4]
    assert learner_items[0]["question_text"] == f"Edited question {expected_item_ids[0]}"
    # Still no answer key for the learner.
    keys, _ = keys_and_texts(as_learner.json())
    assert not [key for key in keys if "correct" in key.lower()]
    for item in learner_items:
        for option in item["options"]:
            assert set(option) == {"option_id", "option_text"}
