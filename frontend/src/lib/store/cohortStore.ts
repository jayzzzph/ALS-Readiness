import { create } from "zustand";
import * as facilitatorApi from "../api/facilitator";
import { getErrorMessage } from "../api/errors";
import type { FacilitatorCohortItem } from "../api/types";
import { useAuthStore, type StoreUser } from "./authStore";

/**
 * The facilitator's school year and cohort selection (FD4): one place every
 * facilitator page and the shell's two dropdowns read from.
 *
 * `selectedCohortId` is the user's own choice and may be null, meaning "All
 * cohorts". A page that needs one cohort doesn't overwrite that choice - it
 * reads the *effective* cohort through useCohortSelection({ allowAll: false }),
 * which falls back to the first active cohort. So "All cohorts" picked on
 * Learners is still there after a visit to the Dashboard.
 */

interface CohortState {
  /** Every school year the facilitator has a cohort in, as the API lists them. */
  schoolYears: string[];
  /** The API's idea of the current school year; null if the facilitator has no cohort in it. */
  currentSchoolYear: string | null;
  selectedSchoolYear: string | null;
  /** The cohorts of `selectedSchoolYear`. */
  cohorts: FacilitatorCohortItem[];
  /** Null means "All cohorts". */
  selectedCohortId: number | null;

  /** True while school years or cohorts are loading. */
  loading: boolean;
  error: string | null;
  /** True once school years and the selected year's cohorts have loaded at least once for this user. */
  ready: boolean;
  /** Which user the state above belongs to; null when nobody is loaded. */
  userKey: string | null;

  /** Load for this user. Does nothing if this user is already loaded or loading; `force` reloads. */
  init: (userKey: string, force?: boolean) => Promise<void>;
  selectSchoolYear: (schoolYear: string) => Promise<void>;
  /** Null selects "All cohorts". */
  selectCohort: (cohortId: number | null) => void;
  /** Drop everything from memory (logout). localStorage is left alone, for this user's next login. */
  reset: () => void;
}

const EMPTY = {
  schoolYears: [] as string[],
  currentSchoolYear: null,
  selectedSchoolYear: null,
  cohorts: [] as FacilitatorCohortItem[],
  selectedCohortId: null,
  loading: false,
  error: null,
  ready: false,
  userKey: null,
};

// ── Remembered selection (localStorage, per user) ────────────────────────────

interface RememberedSelection {
  school_year: string | null;
  /**
   * The cohort last chosen in each school year, so switching back to a year
   * restores it. Null is a real choice ("All cohorts"), so it is stored.
   */
  cohort_by_year: Record<string, number | null>;
}

const storageKey = (userKey: string) => `alsense.facilitator.cohort.${userKey}`;

function readRemembered(userKey: string): RememberedSelection | null {
  try {
    const raw = window.localStorage.getItem(storageKey(userKey));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { school_year, cohort_by_year } = parsed as Record<string, unknown>;
    const cohortByYear: Record<string, number | null> = {};
    if (typeof cohort_by_year === "object" && cohort_by_year !== null) {
      for (const [year, cohortId] of Object.entries(cohort_by_year)) {
        if (typeof cohortId === "number" || cohortId === null) cohortByYear[year] = cohortId;
      }
    }
    return {
      school_year: typeof school_year === "string" ? school_year : null,
      cohort_by_year: cohortByYear,
    };
  } catch {
    // Blocked storage or a corrupt entry - behave as if nothing was remembered.
    return null;
  }
}

/** Remembers the year as the current one and, within it, the cohort. Other years' cohorts are kept. */
function remember(userKey: string, schoolYear: string | null, cohortId: number | null) {
  try {
    const cohortByYear = { ...(readRemembered(userKey)?.cohort_by_year ?? {}) };
    if (schoolYear) cohortByYear[schoolYear] = cohortId;
    const selection: RememberedSelection = { school_year: schoolYear, cohort_by_year: cohortByYear };
    window.localStorage.setItem(storageKey(userKey), JSON.stringify(selection));
  } catch {
    // Storage is a convenience; the selection still works for this session.
  }
}

// ── Defaults ─────────────────────────────────────────────────────────────────

/** The remembered year if still listed, else the API's current year, else the newest. */
export function pickSchoolYear(
  schoolYears: readonly string[],
  current: string | null,
  remembered: string | null,
): string | null {
  if (remembered && schoolYears.includes(remembered)) return remembered;
  if (current && schoolYears.includes(current)) return current;
  if (schoolYears.length === 0) return null;
  // "2026-2027" style labels sort correctly as text.
  const sorted = [...schoolYears].sort();
  return sorted[sorted.length - 1];
}

/**
 * The cohort to select when a year's cohorts load: the one remembered for that
 * year if still listed (a remembered "All cohorts" stays "All cohorts"), else
 * the first active cohort, else the first cohort, else none.
 */
function pickCohortId(
  cohorts: readonly FacilitatorCohortItem[],
  remembered: RememberedSelection | null,
  schoolYear: string | null,
): number | null {
  const cohortByYear = remembered?.cohort_by_year ?? {};
  if (schoolYear && Object.prototype.hasOwnProperty.call(cohortByYear, schoolYear)) {
    return resolveCohortId(cohorts, cohortByYear[schoolYear], true);
  }
  return defaultCohortId(cohorts);
}

/** The first active cohort, else the first cohort, else none. */
export function defaultCohortId(cohorts: readonly FacilitatorCohortItem[]): number | null {
  return (cohorts.find((cohort) => cohort.status === "active") ?? cohorts[0])?.id ?? null;
}

/**
 * The cohort a page should use: the selection if it is still listed; otherwise
 * "All cohorts" (null) where the page allows it and that is what was chosen,
 * else the default cohort.
 */
export function resolveCohortId(
  cohorts: readonly FacilitatorCohortItem[],
  selectedCohortId: number | null,
  allowAll: boolean,
): number | null {
  if (selectedCohortId !== null && cohorts.some((cohort) => cohort.id === selectedCohortId)) {
    return selectedCohortId;
  }
  if (selectedCohortId === null && allowAll) return null;
  return defaultCohortId(cohorts);
}

// ── Store ────────────────────────────────────────────────────────────────────

// Bumped on every load and on reset, so a response that arrives after the user
// switched year, or logged out, is dropped instead of overwriting newer state.
let requestId = 0;

export const useCohortStore = create<CohortState>((set, get) => ({
  ...EMPTY,

  init: async (userKey, force = false) => {
    const state = get();
    if (!force && state.userKey === userKey && (state.ready || state.loading)) return;

    const id = ++requestId;
    // A different user's selection must never be visible, even for a moment.
    set({ ...EMPTY, userKey, loading: true });

    try {
      const years = await facilitatorApi.getSchoolYears();
      if (id !== requestId) return;

      const remembered = readRemembered(userKey);
      const schoolYear = pickSchoolYear(years.school_years, years.current, remembered?.school_year ?? null);

      // No school years means no cohorts at all: an empty state, not an error.
      const cohorts = schoolYear ? (await facilitatorApi.getCohorts(schoolYear)).items : [];
      if (id !== requestId) return;

      const selectedCohortId = pickCohortId(cohorts, remembered, schoolYear);

      set({
        schoolYears: years.school_years,
        currentSchoolYear: years.current,
        selectedSchoolYear: schoolYear,
        cohorts,
        selectedCohortId,
        loading: false,
        ready: true,
      });
    } catch (error) {
      if (id !== requestId) return;
      set({ loading: false, error: getErrorMessage(error, "Unable to load your cohorts.") });
    }
  },

  selectSchoolYear: async (schoolYear) => {
    const { userKey, selectedSchoolYear, schoolYears } = get();
    if (!userKey || schoolYear === selectedSchoolYear || !schoolYears.includes(schoolYear)) return;

    const id = ++requestId;
    // Clear the old year's cohorts right away so they can't be shown under the new year.
    set({ selectedSchoolYear: schoolYear, cohorts: [], selectedCohortId: null, loading: true, error: null });

    try {
      const cohorts = (await facilitatorApi.getCohorts(schoolYear)).items;
      if (id !== requestId) return;

      const selectedCohortId = pickCohortId(cohorts, readRemembered(userKey), schoolYear);
      set({ cohorts, selectedCohortId, loading: false });
      remember(userKey, schoolYear, selectedCohortId);
    } catch (error) {
      if (id !== requestId) return;
      set({ loading: false, error: getErrorMessage(error, "Unable to load the cohorts for this school year.") });
    }
  },

  selectCohort: (cohortId) => {
    const { userKey, cohorts, selectedSchoolYear } = get();
    if (!userKey) return;
    if (cohortId !== null && !cohorts.some((cohort) => cohort.id === cohortId)) return;

    set({ selectedCohortId: cohortId });
    remember(userKey, selectedSchoolYear, cohortId);
  },

  reset: () => {
    requestId++;
    set({ ...EMPTY });
  },
}));

// ── Session wiring ───────────────────────────────────────────────────────────

/** The key the selection is remembered under: the user's id, or their ID number if the id is unavailable. */
export function cohortUserKey(user: StoreUser | null): string | null {
  if (!user || user.role !== "facilitator") return null;
  const id = user.raw?.id ?? user.id_no;
  return id === undefined || id === null ? null : String(id);
}

// Whenever the session ends or changes hands (logout, expiry, another user
// signing in), drop the in-memory selection so the next user never sees it.
// Loading for the new user is started by the shell (CohortControls).
useAuthStore.subscribe((state, previous) => {
  if (state.user === previous.user) return;
  const key = cohortUserKey(state.user);
  if (key === null || key !== useCohortStore.getState().userKey) {
    useCohortStore.getState().reset();
  }
});

// ── Page-facing hook ─────────────────────────────────────────────────────────

export interface UseCohortSelectionOptions {
  /**
   * Whether this page can show "All cohorts". When false and nothing specific
   * is selected, the first active cohort (else the first cohort) is used.
   * Default: false.
   */
  allowAll?: boolean;
}

export interface CohortSelection {
  schoolYears: string[];
  currentSchoolYear: string | null;
  schoolYear: string | null;
  cohorts: FacilitatorCohortItem[];
  /** The cohort this page should use; null means "All cohorts" (only when allowed) or that there are none. */
  cohortId: number | null;
  cohort: FacilitatorCohortItem | null;
  /** True when `cohortId` is null because "All cohorts" is selected, not because there are none. */
  isAllCohorts: boolean;
  /** Whether the cohort is active. False means read-only (FD12); also false for "All cohorts". */
  isCohortActive: boolean;
  /** Loaded fine, but the facilitator has no cohort in the selected year: show an empty state, not an error. */
  hasNoCohorts: boolean;
  loading: boolean;
  ready: boolean;
  error: string | null;
  selectSchoolYear: (schoolYear: string) => Promise<void>;
  selectCohort: (cohortId: number | null) => void;
  /** Reload school years and cohorts from the API (e.g. a retry after an error). */
  reload: () => void;
}

/** What a facilitator page (or the shell) reads the school year and cohort from. */
export function useCohortSelection(options: UseCohortSelectionOptions = {}): CohortSelection {
  const { allowAll = false } = options;
  const state = useCohortStore();

  const cohortId = resolveCohortId(state.cohorts, state.selectedCohortId, allowAll);
  const cohort = state.cohorts.find((item) => item.id === cohortId) ?? null;

  return {
    schoolYears: state.schoolYears,
    currentSchoolYear: state.currentSchoolYear,
    schoolYear: state.selectedSchoolYear,
    cohorts: state.cohorts,
    cohortId,
    cohort,
    isAllCohorts: cohortId === null && state.cohorts.length > 0,
    isCohortActive: cohort?.status === "active",
    hasNoCohorts: state.ready && !state.loading && state.cohorts.length === 0,
    loading: state.loading,
    ready: state.ready,
    error: state.error,
    selectSchoolYear: state.selectSchoolYear,
    selectCohort: state.selectCohort,
    reload: () => {
      if (state.userKey) void state.init(state.userKey, true);
    },
  };
}

// Dev-only console access for manual verification - see authStore.ts.
if (import.meta.env.DEV) {
  (window as unknown as { __cohortStore: typeof useCohortStore }).__cohortStore = useCohortStore;
}
