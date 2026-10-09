# PR report: M05 facilitator side

| | |
|---|---|
| **Branch** | `build/M05-backend` |
| **Base** | `origin/main`. The diff described here is against the merge-base `336c43902`; `origin/main` itself was already ahead of that, at `5f0a2a7ce` |
| **Commits** | 22 (`0b0b0d0a1` to `636dbab38`, 2026-10-02 to 2026-10-09) |
| **Size** | 170 files changed, 20,829 insertions, 1,096 deletions |
| **Alembic head after this branch** | `c4e1a9f27b3d` |

## 1. Summary

This branch delivers the facilitator side of M05, backend and frontend. The facilitator gets a Dashboard, Curriculum, Content Library, Learners list and Learner Detail, Reports (cohort summary with CSV download), My Cohorts, and a read-only Strand Tests viewer, all reading from new `/api/facilitator` endpoints instead of mock data. The admin gets a Cohorts page for creating cohorts, changing their status, and assigning or ending members. At-risk flags are new: the backend raises, resolves, and stores them, and facilitators review, dismiss, or reopen them. The branch also adds the first committed backend test suite (140 cases) and several reliability fixes that apply to every endpoint.

## 2. Backend

All paths below are under `/api`.

### 2.1 New endpoints

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/facilitator/school-years` | Facilitator | School years the caller has a cohort in, and the current one |
| GET | `/facilitator/cohorts` | Facilitator | The caller's visible cohorts, with learner counts. Optional `school_year` |
| GET | `/facilitator/cohorts/{cohort_id}` | Facilitator | One cohort with its roster (names, ID numbers, status, date assigned) |
| GET | `/facilitator/learners` | Facilitator | Paged learner list, one row per membership. Filters: `cohort_id`, `school_year`, `membership_status`, `search`, `at_risk` |
| GET | `/facilitator/learners/{learner_id}` | Facilitator | Learner detail: strand progress, pretest and posttest MPS, LRI score, intake summary, at-risk history. Optional `cohort_id` |
| GET | `/facilitator/at-risk` | Facilitator | Paged at-risk flags. Filters: `cohort_id`, `school_year`, `status`, `reason` |
| PATCH | `/facilitator/at-risk/{flag_id}` | Facilitator | Mark a flag reviewed, dismissed, or open again; add or edit a note |
| GET | `/facilitator/dashboard` | Facilitator | Cohort totals: learners, average progress, per-strand averages, evaluation coverage, flagged learners. Requires `cohort_id` |
| GET | `/facilitator/reports/cohort-summary` | Facilitator | Cohort summary as JSON, or as a CSV attachment with `format=csv`. Requires `cohort_id`; optional `membership_status` |
| POST | `/facilitator/cohorts/{cohort_id}/contents` | Facilitator | Assign a content item to a cohort |
| DELETE | `/facilitator/cohorts/{cohort_id}/contents/{content_id}` | Facilitator | Unassign it |
| GET | `/facilitator/contents` | Facilitator | Paged content library with counts. Filters: strand, module, lesson, `type`, `evaluated`, `mine`, `status`, `search` |
| GET | `/facilitator/contents/{content_id}` | Facilitator | One item, with a read link to the file |
| PATCH | `/facilitator/contents/{content_id}` | Facilitator | Edit, move, archive, or restore an item the caller uploaded |
| GET | `/facilitator/strands` | Facilitator | Active learning strands in display order |
| POST | `/facilitator/strands/{strand_id}/modules` | Facilitator | Add a module |
| PUT | `/facilitator/strands/{strand_id}/modules/order` | Facilitator | Reorder a strand's active modules |
| PATCH | `/facilitator/modules/{module_id}` | Facilitator | Edit, archive, or restore a module |
| POST | `/facilitator/modules/{module_id}/lessons` | Facilitator | Add a lesson |
| PUT | `/facilitator/modules/{module_id}/lessons/order` | Facilitator | Reorder a module's active lessons |
| PATCH | `/facilitator/lessons/{lesson_id}` | Facilitator | Edit, archive, or restore a lesson |
| GET | `/facilitator/strand-tests` | Facilitator or admin | Strand tests with item and attempt counts. Filters: `strand_id`, `type` |
| GET | `/facilitator/strand-tests/{test_id}` | Facilitator or admin | One test with its items, options, and correct answers. Read-only |

That is 23 routes: 21 for facilitators only, 2 for facilitators and admins.

### 2.2 Changed endpoints

| Method | Path | Role | What changed |
|---|---|---|---|
| GET | `/curriculum/{strand_id}` | Facilitator | New response shape: each lesson lists `contents` and, with `cohort_id`, `available_contents`; nodes carry `status`, `is_own`, `visibility`, `has_evaluation`. `cohort_id` is checked against the caller's scope. New `include_archived` parameter. Only content the caller may see is listed. An archived strand answers 404 `LEARNING_STRAND_NOT_FOUND` |
| GET | `/me/curriculum/{strand_id}` | Learner | Archived modules, lessons, and contents are no longer in the tree. A missing strand answers `LEARNING_STRAND_NOT_FOUND` |
| GET | `/me/strands` | Learner | Progress counts only active content under an active lesson and module. See 2.6 |
| GET | `/me/cohorts` | Any signed-in user | A facilitator gets only cohorts where the assignment is active and the cohort is not archived. A learner gets the cohort of the active membership only. An admin gets an empty list |
| GET | `/cohorts` | Admin | New `school_year` filter |
| POST | `/cohorts` | Admin | `school_year` must be two consecutive years (`YYYY-YYYY`); `start_date` must be before `end_date`. Otherwise 422 |
| GET | `/cohorts/{cohort_id}/members` | Admin | Was open to any signed-in user; now admin-only. A member's `profile` holds first and last name only. Rows gain `id_no` and `ended_at` |
| POST | `/cohorts/{cohort_id}/learners` | Admin | A learner who is active in another cohort is refused with 409 `LEARNER_ALREADY_IN_ACTIVE_COHORT` |
| PATCH | `/cohort-learners/{cohort_learner_id}/status` | Admin | Ending sets the end time, reactivating clears it. Reactivating a learner who is active elsewhere answers 409 `LEARNER_ALREADY_IN_ACTIVE_COHORT` |
| PATCH | `/cohort-facilitators/{cohort_facilitator_id}/status` | Admin | Ending sets `ended_at`, reactivating clears it |
| GET | `/admin/users` | Admin | New `search` parameter (name in either order, or ID number). Items gain `learner_id` and `facilitator_id` |
| POST | `/admin/learners`, `/admin/facilitators`, `/admin/admins` | Admin | The response no longer has a required `cohort_id`. It returns `learner_id` or `facilitator_id` for the matching role |
| POST | `/contents/upload-url` | Facilitator | An unsupported or missing extension answers 400 `INVALID_CONTENT_FILE` (was 422). Storage failures answer 503 `STORAGE_UNAVAILABLE` |
| POST | `/contents` | Facilitator | Title is trimmed and must be 1 to 255 characters. `status` is no longer accepted; new content is always active. The lesson must be active (409). The file key must be inside the upload folder and not already used (404, 409) |
| POST | `/contents/{content_id}/evaluate` | Facilitator | Now takes `content_id`, checks the caller can see the content, and returns a typed body. Still a placeholder; see section 6 |
| POST | `/contents/{content_id}/evaluation` | Facilitator | Path fixed (the leading slash was missing). Only the uploader may save (403 `CONTENT_EDIT_DENIED`). One evaluation per content (409 `CONTENT_EVALUATION_ALREADY_EXISTS`). `stimulus_level` field name corrected in the response |
| GET | `/learner/strand-tests/{test_id}` | Learner | Items in id order, options in id order within each item. `asset_url` is null when storage is not configured |
| POST | `/learner/strand-tests/{test_id}/attempts` | Learner | A pretest needs the participant intake and every LRI test first: 409 `INTAKE_REQUIRED` or `LRI_REQUIRED` |
| GET | `/learner/strand-tests/{test_id}/attempts` | Learner | `mps` may be null (an attempt with no items) |

### 2.3 Migrations

Four new revisions, in order. The previous head was `5b7680c500b9`.

| # | Revision | What it does |
|---|---|---|
| 1 | `1bf57c58c61d` | Repairs the `cohort_member_status` enum on databases built before the initial schema was edited in place. Sets the labels to `active` and `ended`, mapping any other value to `ended`. Does nothing on a database that is already correct |
| 2 | `7b0db1b8b8f4` | Adds `created_by`, `created_at`, `updated_at` to `modules` and `lessons`. Adds `UNIQUE (cohort_id, content_id)` on `cohort_content` |
| 3 | `0dc99b83b7e2` | Adds `UNIQUE (content_id)` on `content_evaluations` |
| 4 | `c4e1a9f27b3d` | Creates `at_risk_flags` with the enums `at_risk_reason` and `at_risk_flag_status`, and a unique index allowing one active flag per learner, cohort, reason, and strand |

Resulting head: **`c4e1a9f27b3d`** (single head).

Revisions 2 and 3 check for existing duplicate rows first. If any exist, the upgrade stops and lists them. It does not delete rows.

### 2.4 Access control

**Facilitator scope** (`app/services/facilitator_scope.py`). Every facilitator endpoint goes through it.

- A facilitator sees a cohort when their assignment to it is active and the cohort is upcoming, active, or completed. An archived cohort is hidden even from its own facilitators.
- A facilitator sees the learners of those cohorts, including learners whose membership has ended.
- Changes to a cohort (assigning or unassigning content) are allowed only while the cohort is active. Otherwise 409 `COHORT_NOT_ACTIVE`.
- A cohort or learner outside the scope answers 403 `COHORT_ACCESS_DENIED`. The response is the same whether or not the cohort or learner exists.
- Curriculum structure (modules and lessons) is global per strand, so no cohort check applies to it.

**Content visibility.**

- A facilitator may **assign** a content item when they uploaded it, or it is public, or it has no uploader.
- A facilitator may **see** it when any of those holds, or when it is assigned to a cohort they can see. So a private item shared through a common cohort is visible but cannot be assigned elsewhere.
- Only the uploader may edit, archive, restore, or save an evaluation for an item (403 `CONTENT_EDIT_DENIED`).
- Archived content is listed only for its uploader.
- Content the caller cannot see answers 404 `CONTENT_NOT_FOUND`, identical to a missing id.

**Admin-only endpoints touched by this branch:** `GET` and `POST /cohorts`, `PATCH /cohorts/{id}/status`, `POST /cohorts/{id}/learners`, `POST /cohorts/{id}/facilitators`, `GET /cohorts/{id}/members` (newly admin-only), the two member status endpoints, and `/admin/users`. Admins get 403 on the 21 facilitator-only routes and are admitted to the two strand test viewer routes.

### 2.5 Error handling and reliability

- **Commit before response.** The database session dependency now uses `scope="function"`, so the transaction is committed when the endpoint returns, before the response is sent. This applies to every endpoint. A client can no longer receive a 2xx and then fail to find what it just wrote. A failed commit now reaches the client as an error.
- **Unhandled-error middleware** (`app/core/error_middleware.py`). Sits inside the CORS middleware and answers any unhandled exception with the project's 500 body (`INTERNAL_SERVER_ERROR`). The 500 now carries CORS headers, so a browser on another origin can read it. The traceback is logged; the exception text is not sent.
- **Storage configuration check** (`app/storage.py`). Every storage function first checks that all four B2 settings are present and raises `StorageUnavailableError` if not. Uploads answer 503. Views that only show a link (content detail, test item assets) still answer 200 with the link null.
- **409 category.** New base `ConflictError`, mapped to 409. Codes: `COHORT_NOT_ACTIVE`, `STRAND_NOT_ACTIVE`, `MODULE_NOT_ACTIVE`, `LESSON_NOT_ACTIVE`, `AT_RISK_FLAG_CLOSED`, `AT_RISK_FLAG_INVALID_TRANSITION`, `INTAKE_REQUIRED`, `LRI_REQUIRED`. Existing "already exists" errors also answer 409; new codes there: `CONTENT_ALREADY_ASSIGNED`, `CONTENT_FILE_KEY_ALREADY_USED`, `CONTENT_EVALUATION_ALREADY_EXISTS`, `LEARNER_ALREADY_IN_ACTIVE_COHORT`.
- **503 category.** New base `ServiceUnavailableError`, mapped to 503. Code: `STORAGE_UNAVAILABLE`, for storage that is unreachable, times out, lacks credentials, or is not configured.
- Remaining raw `HTTPException` calls in the content, curriculum, and cohort-learner services are replaced with coded errors (`CONTENT_FILE_NOT_FOUND`, `INVALID_CONTENT_FILE`, `LEARNING_STRAND_NOT_FOUND`, `LEARNER_NOT_IN_COHORT`, and others).

### 2.6 Behaviour changes other modules will notice

Each item was checked against the diff.

| Change | Where | Effect |
|---|---|---|
| Learner strand progress ignores archived structure | `GET /me/strands`, `GET /me/curriculum/{strand_id}` | A lesson counts only when it is active, under an active module, and has at least one active content assigned to the cohort. Archived items no longer appear in the learner tree or in the totals |
| Learner test items and options in id order | `GET /learner/strand-tests/{test_id}` | The query had no `ORDER BY`. It now returns items by id and options by id, the same order the facilitator viewer shows |
| Strand pretest requires intake and LRI first | `POST /learner/strand-tests/{test_id}/attempts` | 409 `INTAKE_REQUIRED` or `LRI_REQUIRED`. The learner pages already enforced this order; the API now does too |
| Admin roster trimmed to names | `GET /cohorts/{cohort_id}/members` | `profile` is `first_name` and `last_name` only. Birthdate, gender, address, contact number, and email are no longer returned |
| Cohort roster endpoint admin-only | `GET /cohorts/{cohort_id}/members` | Learners and facilitators now get 403. Facilitators use `GET /facilitator/cohorts/{cohort_id}` |
| `Content-Disposition` exposed in CORS | all responses | Lets the browser read the CSV export's filename |

Also relevant to other modules:

- `GET /me/cohorts` returns fewer rows than before (see 2.2).
- `StrandAttemptResultResponse.mps` is nullable.

## 3. Frontend

### 3.1 Pages

**Revised from mockups** (mock data replaced by API calls):

| File | Screen | Route |
|---|---|---|
| `FacilitatorDashboard.tsx` | Dashboard: readiness tile, average progress, evaluation coverage, progress by strand, at-risk table with review dialog | `/facilitator-dashboard` |
| `FacilitatorCohort.tsx` | Learners list: search, membership chips, "At risk only", paging, one progress column per strand. The file name is kept from the mockup | `/facilitator-learners` |
| `FacilitatorContent.tsx` | Content Library: table with type and evaluation columns, filters, upload, view, edit, archive, restore | `/facilitator-content` |
| `FacilitatorReports.tsx` | Reports: cohort summary tiles, by-strand table, learner table, CSV download, personal-information notice | `/facilitator-reports` |

**New:**

| File | Screen | Route |
|---|---|---|
| `FacilitatorCurriculum.tsx` | Curriculum: strand tabs, modules and lessons with add, edit, move, archive, restore; assign and unassign content per cohort | `/facilitator-curriculum` |
| `FacilitatorLearnerDetail.tsx` | Learner Detail: tiles, strand table, intake summary, at-risk history, other cohorts | `/facilitator-learners/:learnerId` |
| `FacilitatorMyCohorts.tsx` | My Cohorts: cohort cards and a roster panel | `/facilitator-cohorts` |
| `FacilitatorTests.tsx` | Strand Tests list with strand and type filters | `/facilitator-tests` |
| `FacilitatorTestDetail.tsx` | One test with its items and the answer key. View-only | `/facilitator-tests/:testId` |
| `admin/AdminCohorts.tsx`, `admin/CohortMemberPicker.tsx` | Admin Cohorts: filters, create, status change, facilitator and learner tables with End and Reactivate, member picker | `/admin-cohorts` |
| `shared/NotFound.tsx` | "Page not found" for any unmatched address | `*` |

New dialogs used by those pages: `AssignContentModal.tsx`, `ContentUploadDialog.tsx`, `ContentViewDialog.tsx`.

### 3.2 Shared components

`components/facilitator/shared/`, exported from `index.ts`: `PageHeader`, `Card`, `StatTile`, `Pill`, `ProgressBar`, `DataTable` (column groups, pinned column), `Pagination`, `EmptyState` / `ErrorState` / `LoadingState` / `NoCohortsState`, `CohortControls`, `Modal`, `Button`, `Notice`, `ReadinessPill`, `AtRiskReviewDialog`, `SearchInput`, `Chip`, `ActionMenu`, `ConfirmDialog`, `Tabs`, `Field`, `FileDrop`, `Steps`, `LessonPicker`.

### 3.3 API modules and helpers

| File | Covers |
|---|---|
| `lib/api/facilitator.ts` | School years, cohorts, learners, at-risk flags, dashboard, cohort summary and CSV |
| `lib/api/facilitatorContent.ts` | Content library, upload URL, create, edit |
| `lib/api/facilitatorCurriculum.ts` | Strands, tree, modules, lessons, reorder, assign, unassign |
| `lib/api/facilitatorTests.ts` | Strand test viewer |
| `lib/api/adminCohorts.ts` | Admin cohort list, create, status, roster, assign, member status |
| `lib/api/types.ts` | Types for all of the above |
| `lib/api/errors.ts` | New `getErrorStatus` |
| `lib/hooks/useFetch.ts`, `useDebouncedValue.ts` | One data-fetching hook (loading, error, cancel, reload); debounced search input |
| `lib/*Text.ts`, `labels.ts`, `atRisk.ts`, `dates.ts`, `download.ts`, `focusReturn.ts`, `scoreCompare.ts` | Page wording, labels, at-risk text, Philippine-time formatting, file download, focus return, MPS comparison |

### 3.4 Cohort and school-year selector

`lib/store/cohortStore.ts` holds the facilitator's school year and cohort selection. `CohortControls` renders the two dropdowns in the top bar of `AppLayout`, for facilitators only.

- The selection is remembered per user in `localStorage` and survives a reload.
- "All cohorts" is offered only on pages that allow it (Learners). A page that needs one cohort falls back to the first active cohort without overwriting the user's choice.
- Pages that take their context from the URL (Learner Detail, Strand Test detail) hide the dropdowns.

### 3.5 Routes

- Sidebar for facilitators: Dashboard, Curriculum, Content Library, Learners, Reports, Strand Tests, My Cohorts. Admin sidebar gains Cohorts.
- First routes with URL parameters: `/facilitator-learners/:learnerId` (optional `?cohort=`) and `/facilitator-tests/:testId`. Build the page keys with `learnerDetailPage()` and `strandTestDetailPage()` in `lib/navigation.ts`.
- Removed routes: `/facilitator-cohort` and `/facilitator-analytics`. Both now show the not-found page.
- New catch-all route shows `NotFound`, with a link to the role's dashboard or to sign-in.
- `ProtectedPage` exports a typed `PageProps`.
- `AccessDenied` wording no longer names learner-only pages; it fits any role.

### 3.6 Parked or removed

No file is deleted in this branch.

| File | State |
|---|---|
| `FacilitatorAnalytics.tsx` | Parked. No route, no sidebar entry. Mock data only. Header comment says so |
| `TribeV2Upload.tsx` | Parked. Mock data only; nothing imports it at HEAD. The real upload is `ContentUploadDialog.tsx` |
| `FacilitatorPlaceholders.tsx` | Added and then superseded within this branch. Nothing imports it. Safe to delete |
| `learner/StimulusContent.tsx` | The "View cohort roster" link is removed; its target is now admin-only |

Other small changes: `ScoreCompareModal.tsx` handles a null MPS; `toast.success` accepts an action button (used for Undo).

## 4. Testing

### 4.1 Backend pytest suite

- **Location:** `backend/tests/` (11 test files, `conftest.py`, `factories.py`).
- **Run:** from `backend/`, `uv sync` once, then `uv run pytest`. One file: `uv run pytest tests/test_b7_at_risk.py`. One case: `uv run pytest -k test_api_rsk_08`.
- **Needs:** a running local Postgres. The suite uses its own database, `alsense_test` by default, on the server named in `.env`. It creates the database if missing and migrates it to the Alembic head at the start of each run. It refuses to start for any database whose name does not end in `_test`. `TEST_DATABASE_URL` overrides the target. The development database is never opened.
- **Storage** is faked. No test reaches the network.
- **Method:** the real app is driven in process over HTTP with real sign-in. Each test builds its own data; every table is emptied after each test.

| Section | File | Cases | Tests |
|---|---|---|---|
| B1 Authentication and role guard | `test_b1_auth.py` | 6 | 6 |
| B2 Cohort scope and school years | `test_b2_cohorts.py` | 13 | 15 |
| B3 Curriculum structure | `test_b3_curriculum.py` | 15 | 22 |
| B4 Content assignment and visibility | `test_b4_assignment.py` | 13 | 13 |
| B5 Content library | `test_b5_library.py` | 23 | 45 |
| B6 Learners | `test_b6_learners.py` | 14 | 14 |
| B7 At-risk flags | `test_b7_at_risk.py` | 20 | 20 |
| B8 Dashboard and reports | `test_b8_reports.py` | 15 | 18 |
| B9 Strand tests | `test_b9_strand_tests.py` | 8 | 11 |
| B10 Admin cohorts and users | `test_b10_admin.py` | 12 | 16 |
| B11 Server errors | `test_b11_server_errors.py` | 1 | 1 |
| **Total** | 11 files | **140** | **181** |

One test function per case; 15 cases are parametrized over several inputs.

**Last recorded full run (2026-10-08):** 181 passed, 0 failed, 0 xfailed, in 4 min 31 s.

**Confirmation run for this report (2026-10-09, at `636dbab38`):** not completed. Postgres was not reachable on the configured local port, so all 181 tests errored at setup with a connection timeout before any test ran. This says nothing about the code. Re-run `uv run pytest` with Postgres up and replace this line with the result.

Four defects were found and fixed during testing, each with a regression test:

| Defect | Fix | Test |
|---|---|---|
| With a storage setting missing, the upload URL endpoint answered 500 | Storage configuration check; 503 `STORAGE_UNAVAILABLE` | API-LIB-23 |
| The admin roster returned each member's whole profile | Profile trimmed to names | API-ADM-12 |
| The learner's test detail had no ordering | Items and options in id order | API-TST-08 |
| An unexpected error's 500 had no CORS headers | Unhandled-error middleware | API-SEC-01 |

### 4.2 UI test run

Manual test cases, executed in Chrome against the local frontend and backend on 2026-10-07 and 2026-10-08. Data was created through the app's own screens and API, not with SQL.

| Section | Pass | Fail | Blocked |
|---|---|---|---|
| Setup | 4 | 0 | 0 |
| Shell and cohort selector | 10 | 0 | 0 |
| Dashboard | 13 | 0 | 1 |
| Curriculum | 17 | 0 | 0 |
| Content Library | 13 | 1 | 0 |
| Learners and Learner Detail | 16 | 0 | 0 |
| Reports and My Cohorts | 11 | 0 | 1 |
| Strand Tests | 5 | 0 | 1 |
| Admin Cohorts | 9 | 0 | 0 |
| Access checks | 7 | 0 | 0 |
| **Total (109 cases)** | **105** | **1** | **3** |

Defects found:

| Defect | Status |
|---|---|
| A newly created cohort could show "Cohort not found" until reload (intermittent) | Fixed by commit-before-response. Re-test passed |
| Add Module gave no message for a blank title | Fixed: "Title is required" under the field. Re-test passed |
| Browser uploads were rejected by file storage | Resolved outside the code: a CORS rule was added to the bucket. Re-run passed. See section 5 |
| With storage not configured, an upload failed with a "server could not be reached" message | Fixed in the backend (503 with a readable body). Covered by API tests. **Not re-tested in a browser**, so the case still counts as the one Fail |

Also fixed after the run and re-tested: focus trap and focus return in dialogs, the not-found page for removed addresses, dropdowns hidden on Learner Detail, My Cohorts opening on the selected cohort, Access Restricted wording, singular and plural in the picker footer.

Blocked cases: the inactivity flag in a browser (no test learner was five days old), the CSV file landing on disk (the browser automation could not confirm the save), and audio attachments in the test viewer (no test item has one). The inactivity rule and the CSV's content and headers are covered by the API suite (B7, B8); the audio player is not covered anywhere.

## 5. Deploying or pulling this branch

1. **Back up the database.** Then, from `backend/`: `uv run alembic upgrade head`. The head must read `c4e1a9f27b3d`. The learners, at-risk, dashboard, and report endpoints all read `at_risk_flags` and fail without it.
2. If the upgrade stops with a list of duplicate rows (`cohort_content` or `content_evaluations`), remove the extra rows by hand and run it again.
3. **`uv sync`** installs the new dev dependencies: `pytest`, `pytest-asyncio`, `httpx`. No new runtime dependency.
4. Frontend: no new package. Pull and restart the dev server.
5. **Outside the code: storage bucket CORS.** The content upload sends the file from the browser straight to the bucket. The bucket needs a CORS rule allowing the frontend's origin to `PUT` with a `content-type` header. A rule for the local frontend origin exists. **The deployed frontend's address must be added to that rule before deployment**, or uploads will fail there at the "Upload file" step.
6. The four B2 storage settings must all be set. With any missing, uploads answer 503 and file links are omitted.

## 6. Known limitations and dependencies

| Area | State | Waits on |
|---|---|---|
| Readiness | Null in the learners list, learner detail, and dashboard; shown as "Not yet profiled". The `low_readiness` at-risk rule is built but switched off (`AT_RISK_READINESS_ENABLED = False`) | M03 |
| Progress | Reads zero everywhere. Nothing writes learner content progress yet | M04 recording it |
| Content evaluation | `POST /contents/{id}/evaluate` is a placeholder: the file is not read and every call returns the same fixed result. The Evaluate button is disabled with the hint "Evaluation is not available yet" | The TRIBE decision |
| Test authoring | View-only. No create, edit, or delete for tests, items, options, or assets | Decision on whether the pilot needs it |
| At-risk thresholds | Posttest MPS below 75; 5 days inactive. Provisional constants in `app/core/constants.py` | Confirmation from the ALS coordinator |
| At-risk refresh | Flags are brought up to date when they are read. There is no scheduler | By design |
| Content with no uploader | Visible and assignable by all, editable by no one. No admin content route exists | Not planned in M05 |
| Strand Tests for admins | The API admits admins; the frontend screen is facilitator-only | Decision |

## 7. Open items

**Manual checks still pending**

- Re-run the "storage not configured" upload case in a browser (fixed in the backend, verified by API tests only).
- Confirm the CSV download saves to disk with the expected filename.
- Inactivity flag in a browser, with a learner at least five days inactive.
- Audio attachment in the Strand Test viewer, once an item has one.
- Every screen at 1024px wide and by keyboard, by a person.
- The UAT checklist for facilitator and admin testers has no sign-off recorded yet.

**Handed to other module owners**

- **M03 owner:** where readiness is stored, the level values, and whether history is kept. Then the readiness fields and the `low_readiness` rule can be switched on.
- **M04 owner:**
  - Confirm the content visibility rules in 2.4.
  - Note the changes to `GET /me/strands` and `GET /me/curriculum/{strand_id}` (archived structure excluded).
  - When adding the progress write path, add `UNIQUE (learner_id, content_id)` on `learner_content_progress`.
- **Learner test owner:** note the item ordering change and the intake and LRI requirement on pretest submission.
- **ALS coordinator:** confirm the two at-risk thresholds.

**Small decisions left**

- Learner Detail shows the learner's age from the intake. Reports and rosters leave age out. Decide whether to keep it.
- Module and lesson numbering ("Module 1", "Lesson 1.1") is not shown.
- Delete `FacilitatorPlaceholders.tsx`. Keep or remove the unused `getAtRiskFlags` in `lib/api/facilitator.ts`.
- Schema gaps not closed here: no order column on test items and options; no `UNIQUE (strand_id, type)` on `strand_tests`.

## 8. Reviewer checklist

1. Check out `build/M05-backend`. Back up your local database. In `backend/`, run `uv sync`, then `uv run alembic upgrade head`, then `uv run alembic current`. Expect `c4e1a9f27b3d (head)`.
2. With Postgres running, run `uv run pytest` from `backend/`. Expect 181 passed in about 4 to 5 minutes. Confirm your development database is untouched (the suite uses `alsense_test`).
3. Start the backend and the frontend. As an admin, open **Cohorts**: create a cohort, set it Active, assign one facilitator and two learners. Try assigning a learner who is already active elsewhere and expect a refusal.
4. As that facilitator, check the top bar shows the school year and cohort dropdowns. Open **Curriculum**: add a module and a lesson, archive the module, use Undo.
5. Open **Content Library** and upload a small PDF to the lesson. Then in **Curriculum**, assign it to the cohort and unassign it. (If the upload stops at "Upload file", your origin is missing from the bucket's CORS rule.)
6. Open **Learners**, then a learner's detail page. Reload the page and expect the same view. Confirm no birthdate, address, contact number, or email is shown.
7. Open **Reports** and download the CSV. Expect a file named `cohort-summary_<cohort code>_<date>.csv` with one row per learner.
8. Access checks: as a learner, open `/facilitator-tests/1` and expect "Access Restricted". As the facilitator, open `/admin-cohorts` (Access Restricted) and `/facilitator-analytics` (Page not found). As a learner, call `GET /api/cohorts/<id>/members` and expect 403.
