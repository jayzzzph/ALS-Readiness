import type { ListStrandTestsParams } from "./api/facilitatorTests";
import type { StrandTestIntegrity, StrandTestType } from "./api/types";

// Wording and decisions for the Strand Tests viewer (list and detail).
// Pure functions only: no React, no API calls, and nothing is stored anywhere.

// ── Labels ───────────────────────────────────────────────────────────────────

const TEST_TYPE_LABEL: Record<StrandTestType, string> = {
  pretest: "Pretest",
  posttest: "Posttest",
};

/** Every test type the API has, in the order the type filter lists them. */
export const TEST_TYPES = Object.keys(TEST_TYPE_LABEL) as StrandTestType[];

export function testTypeLabel(type: StrandTestType): string {
  return TEST_TYPE_LABEL[type] ?? type;
}

/** "Locked" once any learner has taken the test, otherwise "No attempts yet". */
export function testStatusLabel(isLocked: boolean): string {
  return isLocked ? "Locked" : "No attempts yet";
}

/** Why a test is locked. Shown as the pill's hint and beneath the table. */
export const LOCKED_EXPLANATION = "A test that learners have already taken can no longer be changed, so results stay comparable.";

/** Tests do not depend on the cohort or school year picked in the top bar. */
export const TESTS_SHARED_TEXT = "Strand tests are shared by all cohorts and school years. This page is view only.";

/** Shown at the top of a test's detail: the page carries the answer key. */
export const ANSWER_KEY_NOTICE = "This page shows the answer key. It is for facilitators and administrators only: do not share it with learners.";

function countText(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** "6 tests", "1 test". */
export function testsSubtitle(total: number): string {
  return countText(total, "test", "tests");
}

/** "20 items · 3 attempts". */
export function testCountsText(itemCount: number, attemptCount: number): string {
  return `${countText(itemCount, "item", "items")} · ${countText(attemptCount, "attempt", "attempts")}`;
}

// ── List: filters ────────────────────────────────────────────────────────────

export interface TestFilters {
  /** A strand's id, or null for all strands. */
  strandId: number | null;
  /** A test type, or "all". */
  type: StrandTestType | "all";
}

/** The query for GET /api/facilitator/strand-tests. A filter set to "all" is left out. */
export function buildTestsQuery(filters: TestFilters): ListStrandTestsParams {
  const params: ListStrandTestsParams = {};
  if (filters.strandId !== null) params.strand_id = filters.strandId;
  if (filters.type !== "all") params.type = filters.type;
  return params;
}

/** The empty-table line: different for "no tests exist" and "none match". */
export function emptyTestsText(filters: TestFilters): string {
  return filters.strandId !== null || filters.type !== "all" ? "No tests match these filters." : "There are no strand tests yet.";
}

// ── Detail: options and integrity ────────────────────────────────────────────

/** The letter for an option by position: A to Z, then AA, AB, and so on. */
export function optionLetter(index: number): string {
  let letters = "";
  let rest = Math.max(0, Math.floor(index));
  do {
    letters = String.fromCharCode(65 + (rest % 26)) + letters;
    rest = Math.floor(rest / 26) - 1;
  } while (rest >= 0);
  return letters;
}

export type ItemProblem = "no-correct-option" | "multiple-correct-options";

/** Which items the integrity report names, and what is wrong with each. */
export function itemProblems(integrity: StrandTestIntegrity): Map<number, ItemProblem> {
  const problems = new Map<number, ItemProblem>();
  for (const id of integrity.items_without_correct_option.item_ids) problems.set(id, "no-correct-option");
  for (const id of integrity.items_with_multiple_correct_options.item_ids) problems.set(id, "multiple-correct-options");
  return problems;
}

export function itemProblemLabel(problem: ItemProblem): string {
  return problem === "no-correct-option" ? "No correct option" : "More than one correct option";
}

/**
 * The amber notice for a test with bad items, built from the report's counts;
 * null when it reports none. "2 items have no correct option and 1 item has
 * more than one. These items cannot be scored reliably."
 */
export function integrityNoticeText(integrity: StrandTestIntegrity): string | null {
  const none = integrity.items_without_correct_option.count;
  const multiple = integrity.items_with_multiple_correct_options.count;
  if (none <= 0 && multiple <= 0) return null;

  const have = (count: number) => `${countText(count, "item", "items")} ${count === 1 ? "has" : "have"}`;
  const tail = "cannot be scored reliably.";
  if (none > 0 && multiple > 0) {
    return `${have(none)} no correct option and ${have(multiple)} more than one. These items ${tail}`;
  }
  const count = none > 0 ? none : multiple;
  const what = none > 0 ? "no correct option" : "more than one correct option";
  return `${have(count)} ${what}. ${count === 1 ? "This item" : "These items"} ${tail}`;
}

// ── Detail: attachments ──────────────────────────────────────────────────────

export type AssetKind = "image" | "audio" | "other";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"];
const AUDIO_EXTENSIONS = ["mp3", "wav", "m4a", "ogg", "oga", "aac"];

/**
 * What kind of file an item's asset link points at, read from the file
 * extension in the link's path (the query string, which carries the link's
 * signature, is ignored). The API does not say what kind of file it is, so a
 * link without a recognised extension is "other" and is offered as a plain
 * link rather than guessed at.
 */
export function assetKind(url: string): AssetKind {
  const path = url.split("#")[0].split("?")[0];
  const fileName = path.slice(path.lastIndexOf("/") + 1);
  const dot = fileName.lastIndexOf(".");
  if (dot === -1) return "other";
  const extension = fileName.slice(dot + 1).toLowerCase();
  if (IMAGE_EXTENSIONS.includes(extension)) return "image";
  if (AUDIO_EXTENSIONS.includes(extension)) return "audio";
  return "other";
}

// ── Failures ─────────────────────────────────────────────────────────────────

export interface LoadFailureText {
  title: string;
  message: string;
  canRetry: boolean;
}

const ACCESS_MESSAGE = "Strand tests and their answer keys are for facilitators and administrators only.";

/** A failed list load: a 403 is an access message, not a retryable error (FD13). */
export function testsFailureText(httpStatus: number | null, message: string): LoadFailureText {
  if (httpStatus === 403) return { title: "You do not have access to the strand tests", message: ACCESS_MESSAGE, canRetry: false };
  return { title: "The strand tests could not be loaded", message, canRetry: true };
}

/** A failed detail load: a 404 is "Test not found", a 403 an access message; anything else can be retried. */
export function testFailureText(httpStatus: number | null, message: string): LoadFailureText {
  if (httpStatus === 404) return { title: "Test not found", message: TEST_NOT_FOUND_TEXT, canRetry: false };
  if (httpStatus === 403) return { title: "You do not have access to this test", message: ACCESS_MESSAGE, canRetry: false };
  return { title: "The test could not be loaded", message, canRetry: true };
}

/** Shown for a 404 and for a link whose id is not a number. */
export const TEST_NOT_FOUND_TEXT = "This link does not point to a strand test. Go back to Strand Tests and open one from there.";
