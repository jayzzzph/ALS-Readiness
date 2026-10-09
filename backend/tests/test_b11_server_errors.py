"""B11. Unexpected server errors (API-SEC-01)."""

from __future__ import annotations

import logging

from app.core.config import settings
from app.main import app

SECRET_DETAIL = "secret-detail-7f3a: password=hunter2 at 10.0.0.5"
BOOM_PATH = "/api/zz-test-only/boom"


async def test_api_sec_01_unexpected_error_has_cors_and_no_detail(client, caplog):
    """API-SEC-01: an unhandled exception answers 500 in the project's error shape, with CORS headers for an
    allowed origin, without the exception's text; the traceback is logged."""

    async def boom():
        raise RuntimeError(SECRET_DETAIL)

    # A route that exists only for this test. No real route is known to raise unexpectedly.
    routes_before = list(app.router.routes)
    app.add_api_route(BOOM_PATH, boom, methods=["GET"])
    allowed_origin = settings.cors_origins_list[0]
    try:
        with caplog.at_level(logging.ERROR):
            from_allowed = await client.get(BOOM_PATH, headers={"Origin": allowed_origin})
        from_other = await client.get(BOOM_PATH, headers={"Origin": "http://not-allowed.example"})
        no_origin = await client.get(BOOM_PATH)
        # An ordinary handled error still goes out the same way, for comparison.
        handled = await client.get("/api/facilitator/cohorts", headers={"Origin": allowed_origin})
    finally:
        app.router.routes[:] = routes_before
        app.openapi_schema = None
    assert (await client.get(BOOM_PATH)).status_code == 404  # the route is gone again

    expected_body = {"success": False, "code": "INTERNAL_SERVER_ERROR", "message": "An unexpected error occurred.", "details": None}
    for response in (from_allowed, from_other, no_origin):
        assert response.status_code == 500
        assert response.json() == expected_body
        assert response.headers["content-type"] == "application/json"
        # Nothing of the exception reaches the client.
        assert SECRET_DETAIL not in response.text
        assert "RuntimeError" not in response.text and "Traceback" not in response.text

    # A browser on an allowed origin can read the response.
    assert from_allowed.headers["access-control-allow-origin"] == allowed_origin
    assert from_allowed.headers["access-control-allow-credentials"] == "true"
    assert handled.headers["access-control-allow-origin"] == allowed_origin
    assert handled.status_code == 401
    # One on any other origin is not let in, and a caller with no Origin gets no CORS headers.
    assert "access-control-allow-origin" not in from_other.headers
    assert "access-control-allow-origin" not in no_origin.headers

    # The traceback, with the detail, went to the server log.
    logged = [record for record in caplog.records if record.levelno >= logging.ERROR and record.exc_info]
    assert logged, "the unhandled error was not logged"
    assert any(SECRET_DETAIL in str(record.exc_info[1]) for record in logged)
