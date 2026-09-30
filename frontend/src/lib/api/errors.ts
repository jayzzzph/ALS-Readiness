// Shared helpers for reading the confirmed ApiErrorResponse shape
// ({success, code, message, details}) off a failed axios call. Centralized
// here so every form (this phase's profile/password, Phase 4's admin forms)
// handles errors the same way instead of re-deriving this per component.

interface PydanticDetail {
  msg?: string;
  loc?: unknown[];
}

function getResponseData(err: unknown): { code?: string; message?: string; details?: unknown } | undefined {
  return (err as { response?: { data?: unknown } })?.response?.data as
    | { code?: string; message?: string; details?: unknown }
    | undefined;
}

/** The error `code` field (e.g. "INCORRECT_CURRENT_PASSWORD", "PASSWORD_REUSE"), if present. */
export function getErrorCode(err: unknown): string | undefined {
  return getResponseData(err)?.code;
}

/**
 * A human-readable message for the failure - prefers the first pydantic
 * validation detail (422s) over the generic top-level `message`, since
 * "Request validation failed." on its own tells the user nothing.
 */
export function getErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const data = getResponseData(err);
  if (!data) return fallback;

  if (Array.isArray(data.details) && data.details.length > 0) {
    const first = data.details[0] as PydanticDetail;
    if (first?.msg) return first.msg;
  }

  return data.message || fallback;
}

// ── Auth error codes ─────────────────────────────────────────────────────────
// Only codes something branches on live here; the rest (e.g. UNAUTHORIZED,
// SELF_PASSWORD_RESET_NOT_ALLOWED) are read by the component that triggered them.

// ── M02 (diagnostic / inventory test) error codes ────────────────────────────
// Confirmed against the live backend's ErrorResponse `code` values. Compare with
// hasErrorCode()/the predicates below instead of repeating string literals.

export const ApiErrorCode = {
  /** 403 - the account's password was just reset; only /users/me and /users/me/password work until it's changed. */
  MUST_CHANGE_PASSWORD: "MUST_CHANGE_PASSWORD",
  /** 409 - the learner already submitted an attempt for this strand test. */
  STRAND_TEST_ATTEMPT_ALREADY_EXISTS: "STRAND_TEST_ATTEMPT_ALREADY_EXISTS",
  /** 409 - the learner already submitted an attempt for this LRI test. */
  LRI_TEST_ATTEMPT_ALREADY_EXISTS: "LRI_TEST_ATTEMPT_ALREADY_EXISTS",
  /** 400 - a posttest was submitted before the pretest for the same strand. */
  PRETEST_REQUIRED: "PRETEST_REQUIRED",
  /** 404 - results requested for a strand test the learner hasn't attempted. */
  STRAND_TEST_ATTEMPT_NOT_FOUND: "STRAND_TEST_ATTEMPT_NOT_FOUND",
  /** 404 - results requested for an LRI test the learner hasn't attempted. */
  LRI_TEST_ATTEMPT_NOT_FOUND: "LRI_TEST_ATTEMPT_NOT_FOUND",
  /** 400 - a duplicate or foreign item (or, LRI only, a missing one), or an option didn't belong to its item. */
  INVALID_TEST_ATTEMPT: "INVALID_TEST_ATTEMPT",
  /** 404 - no such strand test (or it has no items). */
  STRAND_TEST_NOT_FOUND: "STRAND_TEST_NOT_FOUND",
  /** 404 - no such LRI test. */
  LRI_TEST_NOT_FOUND: "LRI_TEST_NOT_FOUND",
} as const;

export type ApiErrorCodeValue = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

/** True if the failed call's error `code` is any of the given codes. */
export function hasErrorCode(err: unknown, ...codes: ApiErrorCodeValue[]): boolean {
  const code = getErrorCode(err);
  return code !== undefined && (codes as string[]).includes(code);
}

/** 403: the user must change their password before any other request will succeed. */
export function isMustChangePassword(err: unknown): boolean {
  return hasErrorCode(err, ApiErrorCode.MUST_CHANGE_PASSWORD);
}

/** 409: this learner already submitted an attempt for this test (strand or LRI). */
export function isAttemptAlreadySubmitted(err: unknown): boolean {
  return hasErrorCode(
    err,
    ApiErrorCode.STRAND_TEST_ATTEMPT_ALREADY_EXISTS,
    ApiErrorCode.LRI_TEST_ATTEMPT_ALREADY_EXISTS,
  );
}

/** 400: a posttest needs the pretest for the same strand to be submitted first. */
export function isPretestRequired(err: unknown): boolean {
  return hasErrorCode(err, ApiErrorCode.PRETEST_REQUIRED);
}

/** 404: no result yet because the learner hasn't attempted this test (strand or LRI). */
export function isAttemptNotFound(err: unknown): boolean {
  return hasErrorCode(
    err,
    ApiErrorCode.STRAND_TEST_ATTEMPT_NOT_FOUND,
    ApiErrorCode.LRI_TEST_ATTEMPT_NOT_FOUND,
  );
}
