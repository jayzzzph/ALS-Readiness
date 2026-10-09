"""Shared setup for the API test suite (Part B of context/M05-test-cases.md).

The suite drives the real app in process over HTTP against a separate Postgres
database. Nothing here touches the development database or real file storage:
the database name must end in "_test" or the run is refused, and the storage
client is replaced before any test runs.

Isolation: every table is emptied and every id sequence restarted after each
test. The app commits each request's transaction before it sends the response,
on its own connection, so tests see exactly the commits a real client would.
The usual alternative - wrapping each test in one outer transaction and
rolling it back - would mean forcing the app onto a shared connection and
turning its commits into savepoints, which hides the very behaviour several
cases are about (what another request can see, and when). Emptying the tables
costs well under a tenth of a second per test and keeps the app untouched.
"""

from __future__ import annotations

import asyncio
import os
import subprocess
import sys
from collections.abc import AsyncIterator, Callable
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import unquote, urlsplit

import pytest

BACKEND_DIR = Path(__file__).resolve().parents[1]
DEFAULT_TEST_DB_NAME = "alsense_test"
REQUIRED_SUFFIX = "_test"


def _configure_environment() -> str:
    """Points the app at the test database BEFORE the app is imported, and returns its name.

    TEST_DATABASE_URL (postgresql://user:password@host:port/name) names the
    database. Without it the app's own server settings are used with the
    database name replaced by "alsense_test".
    """
    # The app reads .env from the working directory, and alembic.ini lives here too.
    os.chdir(BACKEND_DIR)

    url = os.environ.get("TEST_DATABASE_URL")
    if url:
        parts = urlsplit(url)
        name = parts.path.lstrip("/")
        if not parts.hostname or not name:
            raise pytest.UsageError("TEST_DATABASE_URL must look like postgresql://user:password@host:port/name_test")
        os.environ["DB_HOST"] = parts.hostname
        os.environ["DB_PORT"] = str(parts.port or 5432)
        os.environ["DB_USER"] = unquote(parts.username or "")
        os.environ["DB_PASSWORD"] = unquote(parts.password or "")
    else:
        name = DEFAULT_TEST_DB_NAME

    if not name.endswith(REQUIRED_SUFFIX):
        raise pytest.UsageError(
            f'Refusing to run: the test database is named "{name}", which does not end in "{REQUIRED_SUFFIX}". '
            "The suite empties every table it finds, so it only runs against a database kept for tests."
        )
    # Environment variables win over .env, so the app can only see this database.
    os.environ["DB_NAME"] = name

    # No real file storage: even if a fake were missed, these point nowhere.
    os.environ["B2_KEY_ID"] = "test-key-id"
    os.environ["B2_APPLICATION_KEY"] = "test-application-key"
    os.environ["B2_ENDPOINT_URL"] = "http://storage.invalid"
    os.environ["B2_BUCKET_NAME"] = "test-bucket"
    return name


TEST_DB_NAME = _configure_environment()

# The app is imported only after the environment is set.
import httpx  # noqa: E402
import psycopg  # noqa: E402
from botocore.exceptions import EndpointConnectionError  # noqa: E402
from psycopg import sql  # noqa: E402
from sqlalchemy import text  # noqa: E402
from sqlmodel import SQLModel  # noqa: E402

from app.api.deps import get_now  # noqa: E402
from app.core.config import settings  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.main import app  # noqa: E402

import app.storage as _real_storage_module  # noqa: E402
from tests.factories import Cast, Factory, UserRecord, build_cast  # noqa: E402

# The app's own storage functions, kept before any test replaces them with the fake.
REAL_STORAGE_FUNCTIONS = {name: getattr(_real_storage_module, name) for name in ("file_exists", "get_upload_url", "get_read_url", "upload_file")}

if settings.db_name != TEST_DB_NAME or not settings.db_name.endswith(REQUIRED_SUFFIX) or engine.url.database != TEST_DB_NAME:
    raise pytest.UsageError("Refusing to run: the app is not configured for the test database.")

# Tables whose rows are put there by a migration and must survive between tests.
# There are none today: no migration inserts a row (checked 2026-10-08). If one
# ever seeds reference data, name its table here and it is left alone.
REFERENCE_TABLES: frozenset[str] = frozenset()

# Alembic's own bookkeeping. Not a model, so it is never in the metadata.
MIGRATION_TABLE = "alembic_version"


def tables_to_empty() -> list:
    """Every table the app's models define, children before parents, so rows can
    be deleted without breaking a foreign key. It comes from the SQLModel
    metadata, so a table added later is covered without touching this file."""
    return [table for table in reversed(SQLModel.metadata.sorted_tables) if table.name not in REFERENCE_TABLES]


# ── Event loop ───────────────────────────────────────────────────────────────


def pytest_asyncio_loop_factories(config, item):
    """Every test runs on a selector event loop: async psycopg cannot use
    Windows' default (Proactor) loop, and the same loop is fine elsewhere."""
    return {"selector": asyncio.SelectorEventLoop}


# ── Database ─────────────────────────────────────────────────────────────────


def _create_database_if_missing() -> None:
    with psycopg.connect(
        host=settings.db_host, port=settings.db_port, user=settings.db_user, password=settings.db_pass, dbname="postgres", autocommit=True
    ) as connection:
        exists = connection.execute("SELECT 1 FROM pg_database WHERE datname = %s", (TEST_DB_NAME,)).fetchone()
        if not exists:
            connection.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(TEST_DB_NAME)))


def _migrate_to_head() -> None:
    # A subprocess, because alembic's env.py starts its own event loop.
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"], cwd=BACKEND_DIR, env=os.environ.copy(), capture_output=True, text=True
    )
    if result.returncode != 0:
        raise pytest.UsageError(f"Could not migrate the test database:\n{result.stderr[-2000:]}")


async def _truncate_all() -> None:
    """At the start of a run: every table in the schema, whatever a stopped run left behind."""
    async with engine.begin() as connection:
        rows = await connection.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'"))
        tables = sorted(name for (name,) in rows if name != MIGRATION_TABLE and name not in REFERENCE_TABLES)
        if tables:
            quoted = ", ".join(f'"{name}"' for name in tables)
            await connection.execute(text(f"TRUNCATE TABLE {quoted} RESTART IDENTITY CASCADE"))


async def _empty_tables() -> None:
    """Between tests: DELETE in dependency order and restart the id sequences.
    Much faster than TRUNCATE for the few rows a test leaves behind."""
    async with engine.begin() as connection:
        tables = tables_to_empty()
        for table in tables:
            await connection.execute(text(f'DELETE FROM "{table.name}"'))
        # Ids start from 1 again, for the emptied tables only.
        restarts = [
            f"setval(pg_get_serial_sequence('\"{table.name}\"', 'id'), 1, false)"
            for table in tables
            if "id" in table.columns and table.columns["id"].primary_key
        ]
        if restarts:
            await connection.execute(text("SELECT " + ", ".join(restarts)))


@pytest.fixture(scope="session", autouse=True)
async def _database() -> AsyncIterator[None]:
    """Once per run: create the test database if needed, migrate it, and start from empty tables."""
    _create_database_if_missing()
    _migrate_to_head()
    await _truncate_all()
    yield
    await engine.dispose()


@pytest.fixture(autouse=True)
async def _isolation(_database: None) -> AsyncIterator[None]:
    """Leaves nothing behind: tables emptied and dependency overrides removed after every test."""
    yield
    app.dependency_overrides.clear()
    await _empty_tables()


# ── Storage ──────────────────────────────────────────────────────────────────


class FakeStorage:
    """Stands in for file storage. `keys` are the files that "exist".

    To make every storage call fail, set `failing = True` (an unreachable
    service) or set `error` to the exact exception to raise, e.g. a botocore
    ClientError. `calls` records every (operation, key) the app asked for.
    """

    def __init__(self) -> None:
        self.keys: set[str] = set()
        self.error: Exception | None = None
        self.calls: list[tuple[str, str]] = []

    @property
    def failing(self) -> bool:
        return self.error is not None

    @failing.setter
    def failing(self, value: bool) -> None:
        self.error = EndpointConnectionError(endpoint_url="http://storage.invalid") if value else None

    def _use(self, operation: str, key: str) -> None:
        self.calls.append((operation, key))
        if self.error is not None:
            raise self.error

    def file_exists(self, key: str) -> bool:
        self._use("file_exists", key)
        return key in self.keys

    def get_upload_url(self, key: str, expires_in: int = 600) -> str:
        self._use("get_upload_url", key)
        return f"http://storage.invalid/upload/{key}"

    def get_read_url(self, key: str, expires_in: int = 7200) -> str | None:
        self._use("get_read_url", key)
        return f"http://storage.invalid/read/{key}"

    def put(self, key: str) -> None:
        """What the browser's upload to the presigned URL would do."""
        self.keys.add(key)


class _NoRealStorage:
    """Replaces the boto3 client: any use of it is a test that escaped the fake."""

    def __getattr__(self, name: str):
        raise AssertionError(f"real storage client used in a test (s3_client.{name})")


@pytest.fixture(autouse=True)
def storage(monkeypatch: pytest.MonkeyPatch) -> FakeStorage:
    """The fake storage, installed for every test whether it asks for it or not."""
    import app.services.content as content_service
    import app.services.content_library as library_service
    import app.services.curriculum as curriculum_service
    import app.services.strand_test as strand_test_service
    import app.storage as real_storage

    fake = FakeStorage()
    monkeypatch.setattr(real_storage, "s3_client", _NoRealStorage())
    for name in ("file_exists", "get_upload_url", "get_read_url"):
        monkeypatch.setattr(real_storage, name, getattr(fake, name))
    # Each service imported the functions by name, so each holds its own reference.
    monkeypatch.setattr(content_service, "file_exists", fake.file_exists)
    monkeypatch.setattr(content_service, "get_upload_url", fake.get_upload_url)
    monkeypatch.setattr(library_service, "get_read_url", fake.get_read_url)
    monkeypatch.setattr(curriculum_service, "get_read_url", fake.get_read_url)
    monkeypatch.setattr(strand_test_service, "get_read_url", fake.get_read_url)
    return fake


@pytest.fixture
def own_storage_code(monkeypatch: pytest.MonkeyPatch, storage: FakeStorage) -> None:
    """Puts the app's own storage functions back in place of the fake's, for a test
    about what they do before they reach storage (the "not configured" check).
    The boto3 client stays replaced, so a call that got as far as real storage
    would fail the test rather than touch the network."""
    import app.services.content as content_service
    import app.services.content_library as library_service
    import app.services.curriculum as curriculum_service
    import app.services.strand_test as strand_test_service
    import app.storage as real_storage

    for name, function in REAL_STORAGE_FUNCTIONS.items():
        monkeypatch.setattr(real_storage, name, function)
    monkeypatch.setattr(content_service, "file_exists", REAL_STORAGE_FUNCTIONS["file_exists"])
    monkeypatch.setattr(content_service, "get_upload_url", REAL_STORAGE_FUNCTIONS["get_upload_url"])
    monkeypatch.setattr(library_service, "get_read_url", REAL_STORAGE_FUNCTIONS["get_read_url"])
    monkeypatch.setattr(curriculum_service, "get_read_url", REAL_STORAGE_FUNCTIONS["get_read_url"])
    monkeypatch.setattr(strand_test_service, "get_read_url", REAL_STORAGE_FUNCTIONS["get_read_url"])


# ── Clock ────────────────────────────────────────────────────────────────────


class Clock:
    """The app's "now" (its get_now dependency), frozen and movable."""

    def __init__(self) -> None:
        self.now = datetime.now(timezone.utc)

    def set(self, moment: datetime) -> None:
        self.now = moment if moment.tzinfo else moment.replace(tzinfo=timezone.utc)

    def advance(self, **delta: float) -> None:
        self.now += timedelta(**delta)


@pytest.fixture
def clock() -> Clock:
    """Freezes the app's clock at the present; move it with clock.set() or clock.advance(days=5).
    Only the rules that take the time from get_now follow it (the at-risk rules do)."""
    controlled = Clock()
    app.dependency_overrides[get_now] = lambda: controlled.now
    return controlled


# ── HTTP and auth ────────────────────────────────────────────────────────────


@pytest.fixture
async def client() -> AsyncIterator[httpx.AsyncClient]:
    """An HTTP client wired straight to the app: real routing, auth, validation and commits, no network."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as http:
        yield http


@pytest.fixture
def login(client: httpx.AsyncClient) -> Callable:
    """`headers = await login(user)`: signs in through POST /api/auth/login and returns the Authorization header."""

    async def _login(user: UserRecord, password: str | None = None) -> dict[str, str]:
        response = await client.post("/api/auth/login", data={"username": user.id_no, "password": password or user.password})
        assert response.status_code == 200, f"login as {user.name} failed: {response.status_code}"
        # The refresh cookie is not needed by the tests and must not leak into the next login.
        client.cookies.clear()
        return {"Authorization": f"Bearer {response.json()['access_token']}"}

    return _login


# ── Data ─────────────────────────────────────────────────────────────────────


@pytest.fixture
def make(client: httpx.AsyncClient, storage: FakeStorage) -> Factory:
    """Builders for users, cohorts, curriculum, content, tests, attempts, flags and progress (tests/factories.py)."""
    return Factory(client, storage)


@pytest.fixture
async def cast(make: Factory) -> Cast:
    """The full Part A cast, built fresh for the test."""
    return await build_cast(make)


def pytest_report_header() -> str:
    return f"test database: {TEST_DB_NAME} on {settings.db_host}:{settings.db_port}"
