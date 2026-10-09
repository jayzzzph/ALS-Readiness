# Backend Setup Guide

## Prerequisites

- Python 3.12+
- PostgreSQL
- `uv`

## 0. Install `uv`

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Alternative: via pip
pip install uv
```

Verify installation:

```bash
uv --version
```

> Restart your terminal if `uv` isn't recognized after install.

## 1. Install Dependencies

```bash
cd backend
uv sync
```

## 2. Set Up `.env`

```bash
cp .env.example .env
```

Fill in:

```env
# Database
DB_PORT=5432
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=<your_pg_password>
DB_NAME=alsense_db

# JWT
ACCESS_TOKEN_SECRET_KEY=<generate-your-own-secret>
REFRESH_TOKEN_SECRET_KEY=<generate-your-own-secret>
```

> Generate a secret key with: `python -c "import secrets; print(secrets.token_hex(32))"`

## 3. Create the Database

```bash
psql -U postgres -c "CREATE DATABASE alsense_db;"
```

(Match `DB_USER` and `DB_NAME` to whatever you set in `.env`)

## 4. Run Migrations

```bash
uv run alembic upgrade head
```

## 5. Seed the Database

```bash
uv run python -m scripts.seed
```

> Admin credentials will be printed in the terminal — save them.

## 6. Run the Server

```bash
uv run uvicorn app.main:app --reload
```

**Windows:** the command above crashes on any request that touches the database
(`psycopg.InterfaceError: ... cannot use the 'ProactorEventLoop'`), because uvicorn forces
Proactor as its default loop on Windows. Use this instead:

```bash
uv run uvicorn app.main:app --reload --loop app.core.event_loop:selector_event_loop_factory
```

See Troubleshooting below for why the `asyncio.set_event_loop_policy(...)` trick used in
`alembic/env.py` doesn't fix this — it needs the `--loop` flag instead.

API: `http://localhost:8000`

Docs: `http://localhost:8000/docs`

---

## Running the tests

The API tests live in `backend/tests/` and drive the real app in process (no server needed).

```bash
cd backend
uv sync            # installs pytest, pytest-asyncio and httpx (the dev group)
uv run pytest      # the whole suite
uv run pytest tests/test_b1_auth.py                # one file
uv run pytest -k test_api_auth_06                  # one case
```

- **Database.** The suite uses a separate database, `alsense_test`, on the same Postgres server as your `.env`. It creates the database if it is missing and migrates it to the Alembic head at the start of each run, so Postgres must be running. Your development database is never opened.
- **Another server or name.** Set `TEST_DATABASE_URL`, for example `postgresql://user:password@localhost:5432/alsense_ci_test`. The name **must end in `_test`**: the suite empties every table after each test and refuses to start otherwise.
- **File storage** is faked. No test reaches Backblaze or the network.
- **Each test builds its own data** through the fixtures in `tests/conftest.py` and `tests/factories.py`, so tests can run alone and in any order.
- **A test marked `xfail(strict=True)`** documents a known defect, named in its reason. When the defect is fixed the test starts failing ("XPASS"): remove the marker then.

## Troubleshooting

- **Missing module** → `uv sync` again
- **DB connection error** → check `DATABASE_URL` in `.env`
- **Windows async errors on Alembic** → already handled in code, pull latest
- **Windows: login (or any DB-touching request) returns 500 with `psycopg.InterfaceError:
  ... ProactorEventLoop`** → this is a *different* spot than the Alembic fix above. Alembic calls
  `asyncio.run()` directly, so setting the event loop policy at the top of `alembic/env.py` works.
  Uvicorn instead does `asyncio.run(..., loop_factory=...)`, which bypasses the policy entirely and
  hardcodes `ProactorEventLoop` on Windows regardless of it — so the same policy trick in
  `app/main.py` has no effect. Run uvicorn with
  `--loop app.core.event_loop:selector_event_loop_factory` (see step 6 above) instead.
- **Don't run `alembic revision --autogenerate`** unless you're intentionally changing the schema — pull latest first
