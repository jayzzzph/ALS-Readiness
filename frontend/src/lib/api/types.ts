// Auth domain types. Confirmed against backend source (2026-09-17), not assumed:
//   - app/api/routes/auth.py, app/schemas/auth.py, app/schemas/user.py
//   - app/api/routes/users.py, app/schemas/user_profile.py
//   - app/main.py (exception -> status code mapping)
//
// Phase 3 additions, confirmed live against the running backend (2026-09-17):
//   - PATCH /api/users/me accepts exactly UserProfileUpdate's fields below (all
//     optional) - confirmed by sending id_no/role in the same request and
//     observing they're silently ignored (not persisted, not errored).
//   - PATCH /api/users/me/password: wrong current password -> 400 (not 401),
//     code INCORRECT_CURRENT_PASSWORD; password reuse -> 400, code
//     PASSWORD_REUSE; new_password too short -> 422 REQUEST_VALIDATION with a
//     pydantic-style details array. Success -> 200 with UserResponse (NOT
//     nested under `profile` - this endpoint's response has no profile field).

export type Role = "learner" | "facilitator" | "admin";

/** POST /api/auth/login is submitted as x-www-form-urlencoded (OAuth2PasswordRequestForm) */
export interface LoginRequest {
  id_no: string;
  password: string;
}

/** Shared response shape for both POST /api/auth/login and POST /api/auth/refresh */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  /** True right after an admin reset this account's password; the user must change it before anything else. */
  must_change_password: boolean;
}

export type LoginResponse = TokenResponse;

/** POST /api/auth/refresh returns only a new access token (TokenResponse) -
 *  the rotated refresh token is set as an httpOnly cookie, never in the body. */
export type RefreshResponse = TokenResponse;

export interface UserProfile {
  first_name: string;
  last_name: string;
  middle_name: string | null;
  birthdate: string | null;
  gender: string | null;
  address: string | null;
  contact_number: string | null;
  contact_email: string | null;
}

export interface User {
  id: number;
  id_no: string;
  role: Role;
  is_active: boolean;
  /** Only ever true for the single founding admin; the only account that can approve/deactivate/reset other admins. */
  is_super_admin: boolean;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

/** GET /api/users/me response shape */
export interface UserMe extends User {
  profile: UserProfile;
}

export type Gender = "male" | "female" | "other";

/** PATCH /api/users/me body - every field optional, only these are accepted. */
export interface UserProfileUpdate {
  first_name?: string | null;
  last_name?: string | null;
  middle_name?: string | null;
  birthdate?: string | null;
  gender?: Gender | null;
  address?: string | null;
  contact_number?: string | null;
  contact_email?: string | null;
}

/** PATCH /api/users/me/password body */
export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}


export interface AdminUserListItem {
  id: number;
  id_no: string | null;
  role: Role;
  is_active: boolean;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
}

export interface AdminUserListResponse {
  items: AdminUserListItem[];
  total: number;
  page: number;
  page_size: number;
}

/** Identical body shape for POST /api/admin/{learners,facilitators,admins} */
export interface AdminUserCreate {
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  birthdate?: string | null;
  gender?: Gender | null;
  address?: string | null;
  contact_number?: string | null;
  contact_email?: string | null;
}

export interface AdminUserCreateResponse {
  user_id: number;
  id_no: string;
  password: string;
  role: Role;
  is_active: boolean;
  profile: UserProfile;
  created_at: string;
  updated_at: string;
}

/** PATCH /api/admin/users/{id}/password body - just the new password, admin-set */
export interface AdminPasswordResetRequest {
  password: string;
}

/** Shape of app/schemas/error.py's ErrorResponse, returned by every handled exception */
export interface ApiErrorResponse {
  success: false;
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Confirmed status codes from app/main.py's exception handlers - not assumed:
 *   NotFoundError            -> 404
 *   UnauthenticatedError     -> 401
 *   UnauthorizedError        -> 403
 *   AlreadyExistsError       -> 409  (matches design intent)
 *   DomainValidationError    -> 400  (matches design intent)
 *   RequestValidationError / PydanticValidationError -> 422
 */
export const API_STATUS = {
  UNAUTHENTICATED: 401,
  UNAUTHORIZED: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION: 400,
  UNPROCESSABLE: 422,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Learning contents domain (GET /api/me/cohorts, /api/me/strands and
// /api/me/curriculum/{strand_id}).
// ─────────────────────────────────────────────────────────────────────────────

export interface MyCohort {
  id: number;
  name: string;
  code: string;
  school_year: string;
  start_date: string;
  end_date: string;
  status: string;
}

export interface MyCohortsResponse {
  cohorts: MyCohort[];
}

export interface LearningStrandProgress {
  strand_id: number;
  code: string;
  name: string;
  completed_lessons: number;
  total_lessons: number;
  progress_percent: number | null;
}

export interface LearningContentNode {
  content_id: number;
  title: string;
  content_type: "video" | "audio" | "reading";
  stimulus_level: "low" | "medium" | "high" | null;
  /** Both null: not started. Only last_accessed_at set: in progress. completed_at set: done. */
  last_accessed_at: string | null;
  completed_at: string | null;
  /** Presigned storage URL, valid for about 2 hours. Refetch the curriculum for a fresh one. */
  file_url: string;
}

export interface CurriculumLesson {
  lesson_id: number;
  title: string;
  contents: LearningContentNode[];
}

export interface CurriculumModule {
  module_id: number;
  title: string;
  lessons: CurriculumLesson[];
}

export interface MyCurriculumResponse {
  strand_id: number;
  strand_code: string;
  strand_name: string;
  strand_description: string | null;
  modules: CurriculumModule[];
}

// ─────────────────────────────────────────────────────────────────────────────
// M02 diagnostic domain types (strand tests, LRI, participant intake).
// Every shape below was captured from the live backend responses (2026-09-19),
// not inferred from the spec - see lib/api/diagnostic.ts for the endpoints.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The three in-scope learning strands. `strand_code` is the stable identity
 * for a strand - key and filter on it, never on `strand_name` (the seeded
 * names are "Communication Skills (English)", "Kasanayan sa Pakikipagtalastasan",
 * "Mathematical and Problem Solving Skills").
 */
export type StrandCode = "LS1-EN" | "LS1-FIL" | "LS3";

export type StrandTestType = "pretest" | "posttest";

/** Per-test status in the listing endpoints (NOT the submission response's `status`). */
export type AttemptStatus = "completed" | "pending";

/** Status of a just-submitted attempt - "submitted" for both strand and LRI. */
export type AttemptSubmissionStatus = "submitted";

// ── Strand tests ─────────────────────────────────────────────────────────────

/** One entry of GET /api/learner/strand-tests?test_type=... */
export interface StrandTestListItem {
  test_id: number;
  title: string;
  /** Always null today (no image data exists yet); the field is nullable by design. */
  image_url: string | null;
  strand_id: number;
  strand_code: StrandCode;
  strand_name: string;
  attempt_status: AttemptStatus;
}

export interface StrandTestListResponse {
  tests: StrandTestListItem[];
}

/** `is_correct` is never sent to the learner. */
export interface StrandTestOption {
  option_id: number;
  option_text: string;
}

export interface StrandTestItem {
  item_id: number;
  question_text: string;
  options: StrandTestOption[];
  /** Presigned image URL; null when the item has no image OR file storage (B2) isn't configured. */
  asset_url: string | null;
}

/**
 * GET /api/learner/strand-tests/{test_id}?include_items=true.
 * Carries `strand_id` but NOT `strand_code`/`strand_name` - take those from the
 * matching StrandTestListItem (same `test_id`).
 */
export interface StrandTestWithItems {
  test_id: number;
  strand_id: number;
  title: string;
  type: StrandTestType;
  items: StrandTestItem[];
}

export interface StrandAttemptAnswer {
  item_id: number;
  option_id: number;
}

/** POST /api/learner/strand-tests/{test_id}/attempts body - at most one answer per item; unanswered items score as incorrect. */
export interface StrandAttemptCreate {
  answers: StrandAttemptAnswer[];
}

/** Response of both POST .../attempts endpoints (strand and LRI). */
export interface AttemptSubmissionResponse {
  attempt_id: number;
  status: AttemptSubmissionStatus;
}

/** GET /api/learner/strand-tests/{test_id}/attempts - 404 STRAND_TEST_ATTEMPT_NOT_FOUND if unattempted. */
export interface StrandAttemptResult {
  attempt_id: number;
  test_id: number;
  /** Raw count of correct answers. */
  total_score: number;
  /** Items in the test when the attempt was submitted. */
  item_count: number;
  /** Mean Percentage Score: total_score / item_count * 100, rounded to 2 dp (e.g. 65). */
  mps: number;
  taken_at: string | null;
}

// ── LRI (Learner Readiness Inventory) ────────────────────────────────────────

/** One entry of GET /api/learner/lri-tests (same `{tests: [...]}` envelope as strand tests). */
export interface LriTestListItem {
  test_id: number;
  title: string;
  description: string;
  attempt_status: AttemptStatus;
}

export interface LriTestListResponse {
  tests: LriTestListItem[];
}

export interface LriTestItem {
  item_id: number;
  question_text: string;
}

/** GET /api/learner/lri-tests/{test_id} - always includes items (the backend has no include_items switch). */
export interface LriTestWithItems {
  test_id: number;
  title: string;
  description: string;
  items: LriTestItem[];
}

/** Four-point agreement scale: 1 = Strongly Disagree ... 4 = Strongly Agree. Other values are rejected (422). */
export type LriAnswerValue = 1 | 2 | 3 | 4;

export interface LriAttemptAnswer {
  item_id: number;
  answer_value: LriAnswerValue;
}

/** POST /api/learner/lri-tests/{test_id}/attempts body - must answer every item exactly once. */
export interface LriAttemptCreate {
  answers: LriAttemptAnswer[];
}

/** GET /api/learner/lri-tests/{test_id}/attempts - 404 LRI_TEST_ATTEMPT_NOT_FOUND if unattempted. */
export interface LriAttemptResult {
  attempt_id: number;
  test_id: number;
  /** Mean of the 1-4 answers (not normalised to a percentage). */
  lri_score: number;
  submitted_at: string | null;
}

// ── Participant intake ───────────────────────────────────────────────────────

/**
 * POST/PUT /api/learner/participant-intake body. These eight fields are the
 * complete set (confirmed against the backend's OpenAPI schema).
 * Server-side limits: age 15-120, enrollment months 0-1200, attempt count 0-100,
 * at least one strand, and ae_test_attempt_count must be 0 when
 * has_taken_ae_test is false and >= 1 when it is true.
 */
export interface ParticipantIntakeUpsert {
  age: number;
  sex: Gender;
  civil_status: string;
  highest_educational_attainment: string;
  /**
   * Send strand codes. The backend accepts any strings, but codes keep this
   * field on the same identity scheme as everything else.
   */
  als_learning_strands: StrandCode[];
  als_enrollment_months: number;
  has_taken_ae_test: boolean;
  ae_test_attempt_count: number;
}

/** Response of GET/POST/PUT (GET returns null before the first submission). */
export interface ParticipantIntake extends Omit<ParticipantIntakeUpsert, "als_learning_strands"> {
  /** Not constrained server-side, so older/free-text values may appear. */
  als_learning_strands: string[];
  submitted_at: string;
}
