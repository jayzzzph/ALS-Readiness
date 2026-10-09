"""B5. Content library (API-LIB-01 to 22). File storage is always the fake."""

from __future__ import annotations

from types import SimpleNamespace

import pytest
from botocore.exceptions import (
    ClientError,
    ConnectTimeoutError,
    EndpointConnectionError,
    NoCredentialsError,
    ParamValidationError,
    ReadTimeoutError,
)

from app.models.cohort_content import CohortContent

LIBRARY = "/api/facilitator/contents"
UPLOAD_FOLDER = "learning-contents"

# One of each kind of failure app/storage.py says a storage call can raise
# (STORAGE_ERRORS = BotoCoreError and ClientError): an error response from the
# service, and the failures that happen before any response exists.
STORAGE_FAILURES = [
    pytest.param(lambda: ClientError({"Error": {"Code": "InternalError", "Message": "boom"}}, "HeadObject"), id="error response (ClientError 500)"),
    pytest.param(lambda: ClientError({"Error": {"Code": "AccessDenied", "Message": "no"}}, "PutObject"), id="access denied (ClientError 403)"),
    pytest.param(lambda: EndpointConnectionError(endpoint_url="http://storage.invalid"), id="unreachable endpoint"),
    pytest.param(lambda: NoCredentialsError(), id="missing credentials"),
    pytest.param(lambda: ConnectTimeoutError(endpoint_url="http://storage.invalid"), id="connect timeout"),
    pytest.param(lambda: ReadTimeoutError(endpoint_url="http://storage.invalid"), id="read timeout"),
    pytest.param(lambda: ParamValidationError(report="bad parameters"), id="invalid parameters"),
]


@pytest.fixture
async def lib(make) -> SimpleNamespace:
    """Two facilitators, lessons LS-1 and LS-2, and the four Part A content items in LS-1."""
    fa = await make.facilitator("FA")
    fb = await make.facilitator("FB")
    strand = await make.strand("LS1-EN")
    module = await make.module(strand, "M-A", order_index=1, created_by=fa)
    ls_1 = await make.lesson(module, "LS-1", order_index=1, created_by=fa)
    ls_2 = await make.lesson(module, "LS-2", order_index=2, created_by=fa)
    return SimpleNamespace(
        fa=fa, fb=fb, strand=strand, module=module, ls_1=ls_1, ls_2=ls_2,
        c_fa_priv=await make.content(ls_1, "C-FA-PRIV", uploaded_by=fa, visibility="private"),
        c_fa_pub=await make.content(ls_1, "C-FA-PUB", uploaded_by=fa, visibility="public"),
        c_fb_priv=await make.content(ls_1, "C-FB-PRIV", uploaded_by=fb, visibility="private"),
        c_fb_pub=await make.content(ls_1, "C-FB-PUB", uploaded_by=fb, visibility="public"),
    )


async def listing(client, headers, **params) -> dict:
    response = await client.get(LIBRARY, headers=headers, params=params)
    assert response.status_code == 200, response.text[:200]
    return response.json()


def titles(body: dict) -> list[str]:
    return sorted(item["title"] for item in body["items"])


async def upload(client, headers, storage, filename: str = "a.pdf") -> str:
    """The first two steps of an upload: ask for a URL, then "send" the file to the fake storage."""
    response = await client.post("/api/contents/upload-url", headers=headers, json={"filename": filename})
    assert response.status_code == 200, response.text[:200]
    key = response.json()["file_key"]
    storage.put(key)
    return key


# ── Listing ──────────────────────────────────────────────────────────────────


async def test_api_lib_01_list_scope(client, lib, login):
    """API-LIB-01: FA's list has FA's own items and FB's public item; FB's private item is absent."""
    body = await listing(client, await login(lib.fa))

    assert titles(body) == ["C-FA-PRIV", "C-FA-PUB", "C-FB-PUB"]
    assert body["total"] == 3
    own = {item["title"]: item["is_own"] for item in body["items"]}
    assert own == {"C-FA-PRIV": True, "C-FA-PUB": True, "C-FB-PUB": False}


async def test_api_lib_02_filters(client, make, login):
    """API-LIB-02: type, mine, search, evaluated and lesson_id each filter alone, and two combine; `total` follows."""
    fa = await make.facilitator("FA")
    fb = await make.facilitator("FB")
    strand = await make.strand("LS1-EN")
    module = await make.module(strand, "M-A", order_index=1)
    ls_1 = await make.lesson(module, "LS-1", order_index=1)
    ls_2 = await make.lesson(module, "LS-2", order_index=2)
    alpha_reading = await make.content(ls_1, "Alpha Reading", uploaded_by=fa, type="reading")
    await make.content(ls_2, "Beta Video", uploaded_by=fa, type="video")
    await make.content(ls_1, "Gamma Audio", uploaded_by=fb, type="audio", visibility="public")
    alpha_shared = await make.content(ls_2, "Alpha Shared", uploaded_by=fb, type="reading", visibility="public")
    await make.content(ls_1, "Alpha Hidden", uploaded_by=fb, type="reading", visibility="private")
    await make.evaluation(alpha_reading)
    await make.evaluation(alpha_shared)
    headers = await login(fa)

    async def found(**params) -> tuple[list[str], int]:
        body = await listing(client, headers, **params)
        return titles(body), body["total"]

    assert await found() == (["Alpha Reading", "Alpha Shared", "Beta Video", "Gamma Audio"], 4)
    assert await found(type="video") == (["Beta Video"], 1)
    assert await found(type="reading") == (["Alpha Reading", "Alpha Shared"], 2)
    assert await found(mine="true") == (["Alpha Reading", "Beta Video"], 2)
    assert await found(search="alpha") == (["Alpha Reading", "Alpha Shared"], 2)
    assert await found(evaluated="true") == (["Alpha Reading", "Alpha Shared"], 2)
    assert await found(evaluated="false") == (["Beta Video", "Gamma Audio"], 2)
    assert await found(lesson_id=ls_2.id) == (["Alpha Shared", "Beta Video"], 2)
    # Two at once.
    assert await found(type="reading", mine="true") == (["Alpha Reading"], 1)
    assert await found(search="alpha", lesson_id=ls_2.id) == (["Alpha Shared"], 1)
    assert await found(evaluated="true", type="video") == ([], 0)


async def test_api_lib_03_paging(client, make, login):
    """API-LIB-03: page_size=101 is refused (422); page 2 of 25 items is the right slice."""
    fa = await make.facilitator("FA")
    strand = await make.strand("LS1-EN")
    lesson = await make.lesson(await make.module(strand, "M-A", order_index=1), "LS-1", order_index=1)
    for number in range(1, 26):
        await make.content(lesson, f"Item {number:02d}", uploaded_by=fa)
    headers = await login(fa)

    too_large = await client.get(LIBRARY, headers=headers, params={"page_size": 101})
    assert too_large.status_code == 422
    assert too_large.json()["code"] == "REQUEST_VALIDATION"

    everything = [item["id"] for item in (await listing(client, headers, page_size=100))["items"]]
    assert len(everything) == 25
    first = await listing(client, headers, page=1, page_size=10)
    second = await listing(client, headers, page=2, page_size=10)
    third = await listing(client, headers, page=3, page_size=10)

    assert (second["page"], second["page_size"], second["total"]) == (2, 10, 25)
    assert [item["id"] for item in first["items"]] == everything[:10]
    assert [item["id"] for item in second["items"]] == everything[10:20]
    assert [item["id"] for item in third["items"]] == everything[20:]
    assert (await listing(client, headers, page=4, page_size=10))["items"] == []


async def test_api_lib_04_counts_ignore_filters(client, make, lib, login):
    """API-LIB-04: `counts` is the same whatever filter is applied."""
    await make.evaluation(lib.c_fa_pub)
    headers = await login(lib.fa)

    unfiltered = await listing(client, headers)
    assert unfiltered["counts"] == {"total": 3, "evaluated": 1, "not_evaluated": 2}

    for params in ({"mine": "true"}, {"search": "PRIV"}, {"evaluated": "true"}, {"type": "video"}, {"lesson_id": lib.ls_2.id}, {"page_size": 1}):
        filtered = await listing(client, headers, **params)
        assert filtered["counts"] == unfiltered["counts"], params
    # The filters did change what was listed.
    assert (await listing(client, headers, type="video"))["total"] == 0


# ── Upload and create ────────────────────────────────────────────────────────


async def test_api_lib_05_upload_url_valid(client, make, login, storage):
    """API-LIB-05: a .pdf filename gets an upload URL and a file key (200)."""
    headers = await login(await make.facilitator("FA"))

    response = await client.post("/api/contents/upload-url", headers=headers, json={"filename": "a.pdf"})

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"upload_url", "file_key"}
    assert body["file_key"].startswith(f"{UPLOAD_FOLDER}/")
    assert body["file_key"].endswith("_a.pdf")
    assert body["upload_url"] == f"http://storage.invalid/upload/{body['file_key']}"
    assert storage.calls == [("get_upload_url", body["file_key"])]


@pytest.mark.parametrize("filename", ["a.exe", "noext"])
async def test_api_lib_06_upload_url_invalid(client, make, login, storage, filename):
    """API-LIB-06: an unsupported extension or no extension is refused with 400 INVALID_CONTENT_FILE."""
    headers = await login(await make.facilitator("FA"))

    response = await client.post("/api/contents/upload-url", headers=headers, json={"filename": filename})

    assert response.status_code == 400
    assert response.json()["code"] == "INVALID_CONTENT_FILE"
    assert storage.calls == []


async def test_api_lib_07_create(client, lib, login, storage):
    """API-LIB-07: creating content with an uploaded key and an active lesson answers 201; status is active whatever the body says."""
    headers = await login(lib.fa)
    key = await upload(client, headers, storage, "Lesson Notes.pdf")

    response = await client.post(
        "/api/contents",
        headers=headers,
        json={"file_key": key, "title": "New notes", "description": "For week 1", "lesson_id": lib.ls_2.id, "visibility": "public", "status": "archived"},
    )

    assert response.status_code == 201
    body = response.json()
    assert (body["title"], body["description"], body["file_key"]) == ("New notes", "For week 1", key)
    assert (body["status"], body["visibility"], body["type"]) == ("active", "public", "reading")
    item = next(item for item in (await listing(client, headers))["items"] if item["id"] == body["id"])
    assert (item["status"], item["lesson_id"], item["is_own"], item["uploaded_by"]) == ("active", lib.ls_2.id, True, lib.fa.id)


@pytest.mark.parametrize("title", ["", "   "], ids=["empty", "whitespace"])
async def test_api_lib_08_create_blank_title(client, lib, login, storage, title):
    """API-LIB-08: an empty or whitespace-only title is refused with 422."""
    headers = await login(lib.fa)
    key = await upload(client, headers, storage)

    response = await client.post("/api/contents", headers=headers, json={"file_key": key, "title": title, "lesson_id": lib.ls_1.id})

    assert response.status_code == 422
    assert response.json()["code"] == "REQUEST_VALIDATION"
    assert (await listing(client, headers))["total"] == 3


async def test_api_lib_09_create_key_outside_folder(client, lib, login, storage):
    """API-LIB-09: a key outside the upload folder answers 404 CONTENT_FILE_NOT_FOUND, exactly as a
    key with no file does, and storage is never asked about the outside key."""
    headers = await login(lib.fa)
    # The outside file really "exists" in storage, so only the folder rule can refuse it.
    outside_key = "test-item-assets/answer-key.pdf"
    storage.put(outside_key)
    missing_key = f"{UPLOAD_FOLDER}/00000000-0000-0000-0000-000000000000_never-uploaded.pdf"

    outside = await client.post("/api/contents", headers=headers, json={"file_key": outside_key, "title": "Sneaky", "lesson_id": lib.ls_1.id})
    missing = await client.post("/api/contents", headers=headers, json={"file_key": missing_key, "title": "Sneaky", "lesson_id": lib.ls_1.id})

    assert outside.status_code == 404
    assert outside.json()["code"] == "CONTENT_FILE_NOT_FOUND"
    assert missing.status_code == 404
    # The whole body is the same, so the answer does not reveal that the outside file exists.
    assert outside.json() == missing.json()
    assert outside.headers.get("content-type") == missing.headers.get("content-type")
    # Storage was asked about the in-folder key only.
    assert [key for _, key in storage.calls] == [missing_key]
    assert all(key != outside_key for _, key in storage.calls)
    assert (await listing(client, headers))["total"] == 3


async def test_api_lib_10_create_reused_key(client, lib, login, storage):
    """API-LIB-10: a file key already used by a content item cannot be used again (409)."""
    headers = await login(lib.fa)
    key = await upload(client, headers, storage)
    first = await client.post("/api/contents", headers=headers, json={"file_key": key, "title": "First", "lesson_id": lib.ls_1.id})
    assert first.status_code == 201

    second = await client.post("/api/contents", headers=headers, json={"file_key": key, "title": "Second", "lesson_id": lib.ls_2.id})

    assert second.status_code == 409
    assert second.json()["code"] == "CONTENT_FILE_KEY_ALREADY_USED"
    assert (await listing(client, headers))["total"] == 4


async def test_api_lib_11_create_archived_lesson(client, lib, login, storage):
    """API-LIB-11: content cannot be created under an archived lesson (409 LESSON_NOT_ACTIVE)."""
    headers = await login(lib.fa)
    key = await upload(client, headers, storage)
    archived = await client.patch(f"/api/facilitator/lessons/{lib.ls_2.id}", headers=headers, json={"status": "archived"})
    assert archived.status_code == 200

    response = await client.post("/api/contents", headers=headers, json={"file_key": key, "title": "Late", "lesson_id": lib.ls_2.id})

    assert response.status_code == 409
    assert response.json()["code"] == "LESSON_NOT_ACTIVE"
    assert (await listing(client, headers))["total"] == 3


@pytest.mark.parametrize("failure", STORAGE_FAILURES)
async def test_api_lib_12_storage_down(client, lib, login, storage, failure):
    """API-LIB-12: whichever way storage fails, the upload URL and the create both answer 503 STORAGE_UNAVAILABLE."""
    headers = await login(lib.fa)
    key = await upload(client, headers, storage)
    storage.error = failure()

    upload_url = await client.post("/api/contents/upload-url", headers=headers, json={"filename": "b.pdf"})
    create = await client.post("/api/contents", headers=headers, json={"file_key": key, "title": "While down", "lesson_id": lib.ls_1.id})

    for response in (upload_url, create):
        assert response.status_code == 503
        body = response.json()
        assert (body["success"], body["code"]) == (False, "STORAGE_UNAVAILABLE")
        # The storage error's own text does not leak into the response.
        assert "storage.invalid" not in response.text and "boom" not in response.text
    # Storage was really asked both times, and nothing was created.
    assert [operation for operation, _ in storage.calls[-2:]] == ["get_upload_url", "file_exists"]
    storage.error = None
    assert (await listing(client, headers))["total"] == 3
    # Once storage is back the same key works.
    assert (await client.post("/api/contents", headers=headers, json={"file_key": key, "title": "After", "lesson_id": lib.ls_1.id})).status_code == 201


# ── Detail ───────────────────────────────────────────────────────────────────


@pytest.mark.parametrize("failure", STORAGE_FAILURES)
async def test_api_lib_13_detail_with_storage_down(client, lib, login, storage, failure):
    """API-LIB-13: whichever way storage fails on read, the detail still answers 200, with read_url null."""
    headers = await login(lib.fa)
    path = f"{LIBRARY}/{lib.c_fa_priv.id}"
    working = await client.get(path, headers=headers)
    assert working.status_code == 200
    assert working.json()["read_url"] == f"http://storage.invalid/read/{lib.c_fa_priv.file_key}"

    storage.error = failure()
    response = await client.get(path, headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["read_url"] is None
    # Everything else is as it was with storage working.
    assert {key: value for key, value in body.items() if key != "read_url"} == {
        key: value for key, value in working.json().items() if key != "read_url"
    }
    assert storage.calls[-1] == ("get_read_url", lib.c_fa_priv.file_key)


async def test_api_lib_14_detail_of_hidden_item(client, lib, login, storage):
    """API-LIB-14: another facilitator's private item answers 404 with a response identical to an id that does not exist."""
    headers = await login(lib.fa)

    hidden = await client.get(f"{LIBRARY}/{lib.c_fb_priv.id}", headers=headers)
    missing = await client.get(f"{LIBRARY}/999999", headers=headers)

    assert hidden.status_code == 404
    assert missing.status_code == 404
    assert hidden.json()["code"] == "CONTENT_NOT_FOUND"
    # Byte for byte the same, so the answer does not reveal that the item exists.
    assert hidden.content == missing.content
    assert hidden.headers.get("content-type") == missing.headers.get("content-type")
    # No read link was prepared for the hidden file.
    assert storage.calls == []
    # Its owner, and anyone for the public item, still gets it.
    assert (await client.get(f"{LIBRARY}/{lib.c_fb_priv.id}", headers=await login(lib.fb))).status_code == 200
    assert (await client.get(f"{LIBRARY}/{lib.c_fb_pub.id}", headers=headers)).status_code == 200


# ── Edit ─────────────────────────────────────────────────────────────────────


async def test_api_lib_15_edit_own(client, lib, login):
    """API-LIB-15: the uploader can change title, description, visibility and lesson (200)."""
    headers = await login(lib.fa)

    response = await client.patch(
        f"{LIBRARY}/{lib.c_fa_priv.id}",
        headers=headers,
        json={"title": "Renamed", "description": "Now described", "visibility": "public", "lesson_id": lib.ls_2.id},
    )

    assert response.status_code == 200
    body = response.json()
    assert (body["title"], body["description"], body["visibility"]) == ("Renamed", "Now described", "public")
    assert (body["lesson_id"], body["lesson_title"]) == (lib.ls_2.id, "LS-2")
    assert (body["status"], body["type"], body["is_own"]) == ("active", "reading", True)
    # Now public, it is in the other facilitator's library too.
    assert "Renamed" in titles(await listing(client, await login(lib.fb)))


async def test_api_lib_16_edit_anothers_public_item(client, lib, login):
    """API-LIB-16: FA can see FB's public item but cannot edit it (403 CONTENT_EDIT_DENIED)."""
    headers = await login(lib.fa)

    response = await client.patch(f"{LIBRARY}/{lib.c_fb_pub.id}", headers=headers, json={"title": "Taken over"})
    archive = await client.patch(f"{LIBRARY}/{lib.c_fb_pub.id}", headers=headers, json={"status": "archived"})

    assert (response.status_code, response.json()["code"]) == (403, "CONTENT_EDIT_DENIED")
    assert (archive.status_code, archive.json()["code"]) == (403, "CONTENT_EDIT_DENIED")
    unchanged = (await client.get(f"{LIBRARY}/{lib.c_fb_pub.id}", headers=headers)).json()
    assert (unchanged["title"], unchanged["status"]) == ("C-FB-PUB", "active")


@pytest.mark.parametrize("field, value", [("type", "video"), ("file_key", "learning-contents/other.pdf")])
async def test_api_lib_17_edit_forbidden_fields(client, lib, login, field, value):
    """API-LIB-17: the content type and the file key cannot be changed (422)."""
    headers = await login(lib.fa)

    response = await client.patch(f"{LIBRARY}/{lib.c_fa_priv.id}", headers=headers, json={"title": "Edited", field: value})

    assert response.status_code == 422
    assert response.json()["code"] == "REQUEST_VALIDATION"
    unchanged = (await client.get(f"{LIBRARY}/{lib.c_fa_priv.id}", headers=headers)).json()
    # Nothing was applied, not even the valid title sent with it.
    assert (unchanged["title"], unchanged["type"]) == ("C-FA-PRIV", "reading")


# ── Archive ──────────────────────────────────────────────────────────────────


async def test_api_lib_18_archive_and_restore(client, make, lib, login):
    """API-LIB-18: an archived item leaves the default list and the tree but keeps its assignment; restoring brings it back."""
    headers = await login(lib.fa)
    cohort = await make.cohort("S1")
    await make.assign_facilitator(cohort, lib.fa)
    assigned = await client.post(f"/api/facilitator/cohorts/{cohort.id}/contents", headers=headers, json={"content_id": lib.c_fa_priv.id})
    assert assigned.status_code == 201

    async def in_tree() -> list[str]:
        tree = (await client.get(f"/api/curriculum/{lib.strand.id}", headers=headers, params={"cohort_id": cohort.id})).json()
        lesson = tree["modules"][0]["lessons"][0]
        return [item["title"] for item in lesson["contents"] + lesson["available_contents"]]

    assert "C-FA-PRIV" in await in_tree()

    archived = await client.patch(f"{LIBRARY}/{lib.c_fa_priv.id}", headers=headers, json={"status": "archived"})

    assert (archived.status_code, archived.json()["status"]) == (200, "archived")
    assert "C-FA-PRIV" not in titles(await listing(client, headers))
    assert "C-FA-PRIV" not in await in_tree()
    assert titles(await listing(client, headers, status="archived")) == ["C-FA-PRIV"]
    assert await make.count(CohortContent, cohort_id=cohort.id, content_id=lib.c_fa_priv.id) == 1

    restored = await client.patch(f"{LIBRARY}/{lib.c_fa_priv.id}", headers=headers, json={"status": "active"})

    assert (restored.status_code, restored.json()["status"]) == (200, "active")
    assert "C-FA-PRIV" in titles(await listing(client, headers))
    tree = (await client.get(f"/api/curriculum/{lib.strand.id}", headers=headers, params={"cohort_id": cohort.id})).json()
    # Back under `contents`, still assigned, with no second assignment made.
    assert [item["title"] for item in tree["modules"][0]["lessons"][0]["contents"]] == ["C-FA-PRIV"]
    assert await make.count(CohortContent, cohort_id=cohort.id, content_id=lib.c_fa_priv.id) == 1


async def test_api_lib_19_archived_list_is_own_only(client, make, lib, login):
    """API-LIB-19: status=archived lists only the caller's own archived items, never another's, public or not."""
    await make.content(lib.ls_1, "FA archived", uploaded_by=lib.fa, status="archived")
    await make.content(lib.ls_1, "FB archived public", uploaded_by=lib.fb, status="archived", visibility="public")
    await make.content(lib.ls_1, "FB archived private", uploaded_by=lib.fb, status="archived", visibility="private")

    body = await listing(client, await login(lib.fa), status="archived")

    assert titles(body) == ["FA archived"]
    assert body["total"] == 1
    assert titles(await listing(client, await login(lib.fb), status="archived")) == ["FB archived private", "FB archived public"]


async def test_api_lib_20_restore_under_archived_lesson(client, lib, login):
    """API-LIB-20: content cannot be restored while its lesson is archived (409 LESSON_NOT_ACTIVE)."""
    headers = await login(lib.fa)
    assert (await client.patch(f"{LIBRARY}/{lib.c_fa_priv.id}", headers=headers, json={"status": "archived"})).status_code == 200
    assert (await client.patch(f"/api/facilitator/lessons/{lib.ls_1.id}", headers=headers, json={"status": "archived"})).status_code == 200

    response = await client.patch(f"{LIBRARY}/{lib.c_fa_priv.id}", headers=headers, json={"status": "active"})

    assert response.status_code == 409
    assert response.json()["code"] == "LESSON_NOT_ACTIVE"
    assert titles(await listing(client, headers, status="archived")) == ["C-FA-PRIV"]


# ── Evaluation ───────────────────────────────────────────────────────────────

EVALUATION = {"stimulus_level": "high", "cognitive_sustainability_rating": 0.8}


async def test_api_lib_21_save_evaluation_not_uploader(client, lib, login):
    """API-LIB-21: only the uploader can save an evaluation; FA on FB's public item gets 403 CONTENT_EDIT_DENIED."""
    headers = await login(lib.fa)

    response = await client.post(f"/api/contents/{lib.c_fb_pub.id}/evaluation", headers=headers, json=EVALUATION)

    assert response.status_code == 403
    assert response.json()["code"] == "CONTENT_EDIT_DENIED"
    assert (await client.get(f"{LIBRARY}/{lib.c_fb_pub.id}", headers=headers)).json()["evaluation"] is None


async def test_api_lib_22_save_evaluation_twice(client, lib, login):
    """API-LIB-22: the first evaluation of an own item is saved (201); a second is refused (409)."""
    headers = await login(lib.fa)
    path = f"/api/contents/{lib.c_fa_priv.id}/evaluation"

    first = await client.post(path, headers=headers, json=EVALUATION)
    second = await client.post(path, headers=headers, json={"stimulus_level": "low", "cognitive_sustainability_rating": 0.1})

    assert first.status_code == 201
    assert (first.json()["content_id"], first.json()["stimulus_level"], first.json()["cognitive_sustainability_rating"]) == (lib.c_fa_priv.id, "high", 0.8)
    assert second.status_code == 409
    assert second.json()["code"] == "CONTENT_EVALUATION_ALREADY_EXISTS"
    # The first one stands.
    detail = (await client.get(f"{LIBRARY}/{lib.c_fa_priv.id}", headers=headers)).json()
    assert detail["evaluation"] is not None
    assert (await listing(client, headers))["counts"] == {"total": 3, "evaluated": 1, "not_evaluated": 2}


# ── Storage not configured ───────────────────────────────────────────────────


@pytest.mark.parametrize("setting", ["b2_key_id", "b2_application_key", "b2_endpoint_url", "b2_bucket_name"])
@pytest.mark.parametrize("missing_value", [None, ""], ids=["unset", "empty"])
async def test_api_lib_23_storage_not_configured(client, lib, login, monkeypatch, own_storage_code, storage, setting, missing_value):
    """API-LIB-23: with any one of the four storage settings missing, the upload URL and the create answer
    503 STORAGE_UNAVAILABLE, and the content detail still answers 200 with read_url null."""
    from app.core.config import settings

    headers = await login(lib.fa)
    monkeypatch.setattr(settings, setting, missing_value)
    # A key in the upload folder that no content uses, so the create gets as far as asking storage.
    key = f"{UPLOAD_FOLDER}/11111111-1111-1111-1111-111111111111_a.pdf"

    upload_url = await client.post("/api/contents/upload-url", headers=headers, json={"filename": "a.pdf"})
    create = await client.post("/api/contents", headers=headers, json={"file_key": key, "title": "Not configured", "lesson_id": lib.ls_1.id})
    detail = await client.get(f"{LIBRARY}/{lib.c_fa_priv.id}", headers=headers)

    for response in (upload_url, create):
        assert response.status_code == 503, response.text[:200]
        assert response.json() == {"success": False, "code": "STORAGE_UNAVAILABLE", "message": response.json()["message"], "details": None}
    assert detail.status_code == 200
    assert detail.json()["read_url"] is None
    assert detail.json()["title"] == "C-FA-PRIV"
    # Nothing was created, and the listing still works.
    assert (await listing(client, headers))["total"] == 3
