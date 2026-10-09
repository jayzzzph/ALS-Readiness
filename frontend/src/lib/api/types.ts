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
  /** The learners-table id (not the user id) - what the cohort assign routes take. Null for other roles. */
  learner_id: number | null;
  /** The facilitators-table id (not the user id) - what the cohort assign routes take. Null for other roles. */
  facilitator_id: number | null;
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
  learner_id: number | null;
  facilitator_id: number | null;
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
  /** Mean Percentage Score: total_score / item_count * 100, rounded to 2 dp (e.g. 65). Null when the test had no items. */
  mps: number | null;
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

// ─────────────────────────────────────────────────────────────────────────────
// M05 facilitator domain, plus the admin cohort routes it depends on.
// Every shape below was taken from the backend's OpenAPI schema (app.openapi(),
// dumped 2026-10-05); each type's comment names the schema it came from.
// Fields the schema marks optional-with-default are still always present in a
// response, so they're typed as required here (same as the types above).
// Timestamps are UTC without a zone marker - parse them with lib/dates.ts.
// ─────────────────────────────────────────────────────────────────────────────

// ── List envelopes ───────────────────────────────────────────────────────────
// The backend uses three: paginated lists, small unpaginated lists, and the
// older `{cohorts: [...]}` (CohortListResponse, below).

/** `{items, total, page, page_size}` */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

/** `{items, total}` */
export interface ItemList<T> {
  items: T[];
  total: number;
}

// ── Enums ────────────────────────────────────────────────────────────────────

/** CohortStatus */
export type CohortStatus = "upcoming" | "active" | "completed" | "archived";

/** CohortMemberStatus - a learner's membership in, or a facilitator's assignment to, a cohort. */
export type CohortMemberStatus = "active" | "ended";

/** ContentType */
export type ContentType = "video" | "audio" | "reading";

/** ContentVisibility */
export type ContentVisibility = "private" | "public";

/** ContentStatus */
export type ContentStatus = "active" | "archived" | "deleted";

/** StructureStatus - modules and lessons. */
export type StructureStatus = "active" | "archived" | "deleted";

/** StimulusLevel */
export type StimulusLevel = "low" | "medium" | "high";

/** AtRiskReason */
export type AtRiskReason = "low_mps" | "inactive" | "low_readiness";

/** AtRiskFlagStatus */
export type AtRiskFlagStatus = "open" | "reviewed" | "dismissed" | "resolved";

/** `membership_status` query value on the learners list and the cohort summary. */
export type MembershipStatusFilter = CohortMemberStatus | "all";

/** `status` query value on GET /api/facilitator/at-risk ("active" is the default). */
export type AtRiskStatusFilter = AtRiskFlagStatus | "active" | "all";

// ── School years and cohorts (facilitator) ───────────────────────────────────

/** FacilitatorSchoolYearsResponse - GET /api/facilitator/school-years */
export interface FacilitatorSchoolYearsResponse {
  school_years: string[];
  current: string | null;
}

/** FacilitatorCohortItem */
export interface FacilitatorCohortItem {
  id: number;
  name: string;
  code: string | null;
  school_year: string;
  status: CohortStatus;
  start_date: string | null;
  end_date: string | null;
  learner_count: number;
}

/** FacilitatorCohortListResponse - GET /api/facilitator/cohorts */
export type FacilitatorCohortListResponse = ItemList<FacilitatorCohortItem>;

/** FacilitatorRosterRow */
export interface FacilitatorRosterRow {
  learner_id: number;
  id_no: string | null;
  first_name: string | null;
  last_name: string | null;
  status: CohortMemberStatus;
  assigned_at: string;
}

/** FacilitatorCohortDetailResponse - GET /api/facilitator/cohorts/{cohort_id} */
export interface FacilitatorCohortDetailResponse extends FacilitatorCohortItem {
  roster: FacilitatorRosterRow[];
}

// ── At-risk flags ────────────────────────────────────────────────────────────

/** AtRiskCohort */
export interface AtRiskCohort {
  id: number;
  name: string;
}

/** AtRiskLearner */
export interface AtRiskLearner {
  learner_id: number;
  id_no: string | null;
  first_name: string | null;
  last_name: string | null;
}

/** AtRiskFlagSummary - a flag without its learner (Learner Detail). */
export interface AtRiskFlagSummary {
  id: number;
  cohort: AtRiskCohort;
  reason: AtRiskReason;
  strand_id: number | null;
  strand_code: string | null;
  trigger_value: number | null;
  status: AtRiskFlagStatus;
  detected_at: string;
  resolved_at: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  note: string | null;
}

/** AtRiskFlagItem - GET /api/facilitator/at-risk item, PATCH /api/facilitator/at-risk/{flag_id} response */
export interface AtRiskFlagItem extends AtRiskFlagSummary {
  learner: AtRiskLearner;
}

/** AtRiskFlagListResponse - GET /api/facilitator/at-risk */
export type AtRiskFlagListResponse = Paginated<AtRiskFlagItem>;

/** AtRiskFlagUpdate - PATCH /api/facilitator/at-risk/{flag_id} body. "resolved" is not accepted here. */
export interface AtRiskFlagUpdate {
  status: "open" | "reviewed" | "dismissed";
  /** Up to 500 characters. */
  note?: string | null;
}

// ── Dashboard ────────────────────────────────────────────────────────────────

/** ReportCohort - the cohort header on the dashboard and the cohort summary. */
export interface ReportCohort {
  id: number;
  name: string;
  code: string | null;
  school_year: string;
  status: CohortStatus;
}

/** EvaluationCoverage */
export interface EvaluationCoverage {
  evaluated: number;
  total: number;
}

/** MpsAverage */
export interface MpsAverage {
  average_mps: number | null;
  count: number;
}

/** PosttestAverage */
export interface PosttestAverage extends MpsAverage {
  mastery_count: number;
}

/** DashboardStrand */
export interface DashboardStrand {
  strand_id: number;
  strand_code: string;
  strand_name: string;
  total_lessons: number;
  average_percent: number | null;
  completed_count: number;
  pretest: MpsAverage;
  posttest: PosttestAverage;
}

/** DashboardFlag */
export interface DashboardFlag {
  id: number;
  reason: AtRiskReason;
  strand_code: string | null;
  trigger_value: number | null;
  status: AtRiskFlagStatus;
  detected_at: string;
}

/** DashboardAtRiskLearner */
export interface DashboardAtRiskLearner {
  learner_id: number;
  id_no: string | null;
  first_name: string | null;
  last_name: string | null;
  overall_progress: number;
  last_active_at: string | null;
  flags: DashboardFlag[];
}

/** DashboardAtRisk */
export interface DashboardAtRisk {
  learner_count: number;
  flag_count: number;
  learners: DashboardAtRiskLearner[];
}

/** DashboardResponse - GET /api/facilitator/dashboard?cohort_id= */
export interface DashboardResponse {
  cohort: ReportCohort;
  learner_count: number;
  /** The schema types this as null: there is no readiness data yet. */
  readiness_distribution: null;
  average_progress: number | null;
  evaluation_coverage: EvaluationCoverage;
  progress_by_strand: DashboardStrand[];
  at_risk: DashboardAtRisk;
  generated_at: string;
}

// ── Learners ─────────────────────────────────────────────────────────────────

/** LearnerProgress */
export interface LearnerProgress {
  completed_lessons: number;
  total_lessons: number;
  percent: number;
}

/** LearnerStrandProgress */
export interface LearnerStrandProgress extends LearnerProgress {
  strand_id: number;
  strand_code: string;
}

/** FacilitatorLearnerRow */
export interface FacilitatorLearnerRow {
  learner_id: number;
  id_no: string | null;
  first_name: string | null;
  last_name: string | null;
  cohort_id: number;
  cohort_name: string;
  school_year: string;
  membership_status: CohortMemberStatus;
  /** The schema types this as null: there is no readiness data yet. */
  readiness: null;
  progress: LearnerStrandProgress[];
  last_active_at: string | null;
  at_risk_reasons: AtRiskReason[];
}

/** FacilitatorLearnerListResponse - GET /api/facilitator/learners */
export type FacilitatorLearnerListResponse = Paginated<FacilitatorLearnerRow>;

/** LearnerIdentity */
export interface LearnerIdentity {
  learner_id: number;
  id_no: string | null;
  first_name: string | null;
  last_name: string | null;
}

/** LearnerMembership */
export interface LearnerMembership {
  id: number;
  name: string;
  school_year: string;
  status: CohortStatus;
  membership_status: CohortMemberStatus;
  assigned_at: string;
}

/** StrandTestResult */
export interface StrandTestResult {
  score: number;
  total_items: number;
  mps: number | null;
  submitted_at: string | null;
}

/** LearnerStrandDetail */
export interface LearnerStrandDetail {
  strand_id: number;
  strand_code: string;
  strand_name: string;
  pretest: StrandTestResult | null;
  posttest: StrandTestResult | null;
  progress: LearnerProgress;
}

/** LearnerLriResult */
export interface LearnerLriResult {
  score: number;
  submitted_at: string | null;
}

/** LearnerIntakeSummary */
export interface LearnerIntakeSummary {
  age: number;
  highest_educational_attainment: string;
  als_learning_strands: string[];
  als_enrollment_months: number;
  has_taken_ae_test: boolean;
  ae_test_attempt_count: number;
  submitted_at: string | null;
}

/** FacilitatorLearnerDetailResponse - GET /api/facilitator/learners/{learner_id}?cohort_id= */
export interface FacilitatorLearnerDetailResponse {
  learner: LearnerIdentity;
  cohort: LearnerMembership;
  memberships: LearnerMembership[];
  /** The schema types this as null: there is no readiness data yet. */
  readiness: null;
  last_active_at: string | null;
  strands: LearnerStrandDetail[];
  lri: LearnerLriResult | null;
  intake: LearnerIntakeSummary | null;
  at_risk_flags: AtRiskFlagSummary[];
}

// ── Cohort summary report ────────────────────────────────────────────────────

/** ReportThresholds */
export interface ReportThresholds {
  mps_mastery: number;
  inactivity_days: number;
}

/** ReportLearnerStrand */
export interface ReportLearnerStrand {
  strand_code: string;
  progress_percent: number;
  completed_lessons: number;
  total_lessons: number;
  pretest_mps: number | null;
  posttest_mps: number | null;
  gain: number | null;
  mastered: boolean | null;
}

/** ReportLearner */
export interface ReportLearner {
  learner_id: number;
  id_no: string | null;
  first_name: string | null;
  last_name: string | null;
  membership_status: CohortMemberStatus;
  overall_progress: number;
  last_active_at: string | null;
  lri_score: number | null;
  at_risk_reasons: AtRiskReason[];
  strands: ReportLearnerStrand[];
}

/** GainAverage */
export interface GainAverage {
  average: number | null;
  count: number;
}

/** ReportStrandTotals */
export interface ReportStrandTotals {
  strand_code: string;
  average_progress: number | null;
  pretest: MpsAverage;
  posttest: MpsAverage;
  gain: GainAverage;
  mastery_count: number;
}

/** ReportAtRiskByReason */
export interface ReportAtRiskByReason {
  low_mps: number;
  inactive: number;
  low_readiness: number;
}

/** ReportAtRiskTotals */
export interface ReportAtRiskTotals {
  learner_count: number;
  by_reason: ReportAtRiskByReason;
}

/** ReportTotals */
export interface ReportTotals {
  learner_count: number;
  average_progress: number | null;
  at_risk: ReportAtRiskTotals;
  strands: ReportStrandTotals[];
}

/** CohortSummaryResponse - GET /api/facilitator/reports/cohort-summary?cohort_id= (format=json) */
export interface CohortSummaryResponse {
  cohort: ReportCohort;
  generated_at: string;
  thresholds: ReportThresholds;
  learners: ReportLearner[];
  totals: ReportTotals;
}

// ── Curriculum ───────────────────────────────────────────────────────────────

/** StrandItem */
export interface StrandItem {
  id: number;
  code: string;
  name: string;
}

/** StrandListResponse - GET /api/facilitator/strands */
export type StrandListResponse = ItemList<StrandItem>;

/** FacilitatorContentNode */
export interface FacilitatorContentNode {
  content_id: number;
  title: string;
  content_type: ContentType;
  visibility: ContentVisibility;
  has_evaluation: boolean;
  is_own: boolean;
}

/** FacilitatorLessonNode */
export interface FacilitatorLessonNode {
  lesson_id: number;
  title: string;
  description: string | null;
  order_index: number;
  /** The lesson's own status. "active" unless the tree was asked for with include_archived; an active lesson can sit under an archived module. */
  status: StructureStatus;
  contents: FacilitatorContentNode[];
  available_contents: FacilitatorContentNode[];
}

/** FacilitatorModuleNode */
export interface FacilitatorModuleNode {
  module_id: number;
  title: string;
  description: string | null;
  order_index: number;
  /** "active" unless the tree was asked for with include_archived. */
  status: StructureStatus;
  lessons: FacilitatorLessonNode[];
}

/** FacilitatorCurriculumResponse - GET /api/curriculum/{strand_id}?cohort_id= */
export interface FacilitatorCurriculumResponse {
  strand_id: number;
  strand_code: string;
  strand_name: string;
  strand_description: string | null;
  cohort_id: number | null;
  modules: FacilitatorModuleNode[];
}

/** ModuleCreate - POST /api/facilitator/strands/{strand_id}/modules body. Title is 1 to 255 characters. */
export interface ModuleCreate {
  title: string;
  description?: string | null;
}

/** ModuleUpdate - PATCH /api/facilitator/modules/{module_id} body; every field optional. */
export interface ModuleUpdate {
  title?: string | null;
  description?: string | null;
  status?: StructureStatus | null;
}

/** ModuleResponse */
export interface ModuleResponse {
  id: number;
  strand_id: number;
  title: string;
  description: string | null;
  order_index: number;
  status: StructureStatus;
  created_by: number | null;
  created_at: string | null;
  updated_at: string | null;
}

/** ModuleListResponse - PUT /api/facilitator/strands/{strand_id}/modules/order response */
export type ModuleListResponse = ItemList<ModuleResponse>;

/** LessonCreate - POST /api/facilitator/modules/{module_id}/lessons body. Title is 1 to 255 characters. */
export interface LessonCreate {
  title: string;
  description?: string | null;
}

/** LessonUpdate - PATCH /api/facilitator/lessons/{lesson_id} body; every field optional. */
export interface LessonUpdate {
  title?: string | null;
  description?: string | null;
  status?: StructureStatus | null;
}

/** LessonResponse */
export interface LessonResponse {
  id: number;
  module_id: number;
  title: string;
  description: string | null;
  order_index: number;
  status: StructureStatus;
  created_by: number | null;
  created_at: string | null;
  updated_at: string | null;
}

/** LessonListResponse - PUT /api/facilitator/modules/{module_id}/lessons/order response */
export type LessonListResponse = ItemList<LessonResponse>;

/** ReorderRequest - body of both order routes. */
export interface ReorderRequest {
  ids: number[];
}

/** CohortContentCreate - POST /api/facilitator/cohorts/{cohort_id}/contents body */
export interface CohortContentCreate {
  content_id: number;
}

/** CohortContentResponse */
export interface CohortContentResponse {
  id: number;
  cohort_id: number;
  content_id: number;
  assigned_by: number;
  assigned_at: string | null;
}

// ── Content library and upload ───────────────────────────────────────────────

/** ContentEvaluationSummary */
export interface ContentEvaluationSummary {
  stimulus_level: StimulusLevel;
  cognitive_sustainability_rating: number;
}

/** ContentLibraryItem - list item, and PATCH /api/facilitator/contents/{content_id} response */
export interface ContentLibraryItem {
  id: number;
  title: string;
  description: string | null;
  type: ContentType;
  visibility: ContentVisibility;
  status: ContentStatus;
  lesson_id: number;
  lesson_title: string;
  module_title: string;
  strand_code: string;
  uploaded_by: number | null;
  uploader_name: string | null;
  uploaded_at: string | null;
  is_own: boolean;
  evaluation: ContentEvaluationSummary | null;
}

/** ContentLibraryCounts */
export interface ContentLibraryCounts {
  total: number;
  evaluated: number;
  not_evaluated: number;
}

/** ContentLibraryListResponse - GET /api/facilitator/contents */
export interface ContentLibraryListResponse extends Paginated<ContentLibraryItem> {
  counts: ContentLibraryCounts;
}

/** ContentLibraryDetailResponse - GET /api/facilitator/contents/{content_id} */
export interface ContentLibraryDetailResponse extends ContentLibraryItem {
  read_url: string | null;
}

/** ContentUpdate - PATCH /api/facilitator/contents/{content_id} body; every field optional. */
export interface ContentUpdate {
  /** 1 to 255 characters. */
  title?: string | null;
  description?: string | null;
  visibility?: ContentVisibility | null;
  lesson_id?: number | null;
  status?: ContentStatus | null;
}

/** UploadUrlRequest - POST /api/contents/upload-url body */
export interface UploadUrlRequest {
  filename: string;
}

/** UploadUrlResponse */
export interface UploadUrlResponse {
  upload_url: string;
  file_key: string;
}

/** ContentCreate - POST /api/contents body. `file_key` is the one upload-url returned. */
export interface ContentCreate {
  lesson_id: number;
  file_key: string;
  title: string;
  description?: string | null;
  /** Defaults to "private" server-side. */
  visibility?: ContentVisibility;
}

/** ContentResponse - POST /api/contents response */
export interface ContentResponse {
  id: number;
  file_key: string;
  title: string;
  description: string | null;
  type: ContentType;
  status: ContentStatus;
  visibility: ContentVisibility;
}

// ── Strand test viewer ───────────────────────────────────────────────────────

/** StrandTestViewerItem */
export interface StrandTestViewerItem {
  id: number;
  strand_id: number;
  strand_code: string;
  strand_name: string;
  type: StrandTestType;
  title: string;
  item_count: number;
  attempt_count: number;
  is_locked: boolean;
}

/** StrandTestViewerListResponse - GET /api/facilitator/strand-tests */
export type StrandTestViewerListResponse = ItemList<StrandTestViewerItem>;

/** StrandTestViewerOption - unlike the learner's StrandTestOption, this carries `is_correct`. */
export interface StrandTestViewerOption {
  id: number;
  option_text: string;
  is_correct: boolean;
}

/** StrandTestViewerQuestion */
export interface StrandTestViewerQuestion {
  id: number;
  question_text: string;
  options: StrandTestViewerOption[];
  asset_url: string | null;
}

/** StrandTestIntegrityIssue */
export interface StrandTestIntegrityIssue {
  count: number;
  item_ids: number[];
}

/** StrandTestIntegrity */
export interface StrandTestIntegrity {
  items_without_correct_option: StrandTestIntegrityIssue;
  items_with_multiple_correct_options: StrandTestIntegrityIssue;
}

/** StrandTestViewerDetailResponse - GET /api/facilitator/strand-tests/{test_id} */
export interface StrandTestViewerDetailResponse extends StrandTestViewerItem {
  items: StrandTestViewerQuestion[];
  integrity: StrandTestIntegrity;
}

// ── Admin: cohorts ───────────────────────────────────────────────────────────

/** CohortResponse */
export interface CohortResponse {
  id: number;
  name: string;
  school_year: string;
  start_date: string | null;
  end_date: string | null;
  code: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  status: CohortStatus;
}

/** CohortListResponse - GET /api/cohorts (and GET /api/me/cohorts) */
export interface CohortListResponse {
  cohorts: CohortResponse[];
}

/** CohortCreate - POST /api/cohorts body. Name is up to 100 characters; dates are YYYY-MM-DD. */
export interface CohortCreate {
  name: string;
  school_year: string;
  start_date: string;
  end_date: string;
}

/** CohortStatusUpdate - PATCH /api/cohorts/{cohort_id}/status body */
export interface CohortStatusUpdate {
  status: CohortStatus;
}

/** CohortFacilitatorCreate - POST /api/cohorts/{cohort_id}/facilitators body */
export interface CohortFacilitatorCreate {
  facilitator_id: number;
}

/** CohortFacilitatorResponse */
export interface CohortFacilitatorResponse {
  id: number;
  cohort_id: number;
  facilitator_id: number;
  status: CohortMemberStatus;
  assigned_by: number;
  assigned_at: string;
}

/** CohortFacilitatorStatusUpdate - PATCH /api/cohort-facilitators/{cohort_facilitator_id}/status body */
export interface CohortFacilitatorStatusUpdate {
  status: CohortMemberStatus;
}

/** CohortLearnerCreate - POST /api/cohorts/{cohort_id}/learners body */
export interface CohortLearnerCreate {
  learner_id: number;
}

/** CohortLearnerResponse */
export interface CohortLearnerResponse {
  id: number;
  cohort_id: number;
  learner_id: number;
  status: CohortMemberStatus;
  assigned_by: number;
  assigned_at: string;
}

/** CohortLearnerStatusUpdate - PATCH /api/cohort-learners/{cohort_learner_id}/status body */
export interface CohortLearnerStatusUpdate {
  status: CohortMemberStatus;
}

/** UserProfileResponse - the profile embedded in a roster row. */
export interface UserProfileResponse extends UserProfile {
  user_id: number;
}

/** CohortMemberProfile - what a roster shows of a member's profile: the name only. */
export interface CohortMemberProfile {
  first_name: string;
  last_name: string;
}

/** CohortFacilitatorMemberResponse */
export interface CohortFacilitatorMemberResponse extends CohortFacilitatorResponse {
  profile: CohortMemberProfile;
  /** The facilitator's ID number. */
  id_no: string | null;
  /** When the assignment ended. Null while it is active. */
  ended_at: string | null;
}

/** CohortLearnerMemberResponse */
export interface CohortLearnerMemberResponse extends CohortLearnerResponse {
  profile: CohortMemberProfile;
  /** The learner's ID number. */
  id_no: string | null;
  /** When the membership ended. Null while it is active. */
  ended_at: string | null;
}

/** CohortWithMembersResponse - GET /api/cohorts/{cohort_id}/members */
export interface CohortWithMembersResponse extends CohortResponse {
  facilitators: CohortFacilitatorMemberResponse[];
  learners: CohortLearnerMemberResponse[];
}
