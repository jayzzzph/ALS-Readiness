import { apiClient } from "./client";
import type {
  AtRiskFlagItem,
  AtRiskFlagListResponse,
  AtRiskFlagUpdate,
  AtRiskReason,
  AtRiskStatusFilter,
  CohortSummaryResponse,
  DashboardResponse,
  FacilitatorCohortDetailResponse,
  FacilitatorCohortListResponse,
  FacilitatorLearnerDetailResponse,
  FacilitatorLearnerListResponse,
  FacilitatorSchoolYearsResponse,
  MembershipStatusFilter,
} from "./types";

// M05 facilitator API: school years, cohorts, dashboard, learners, at-risk
// flags and the cohort summary report. Everything here is scoped server-side to
// the cohorts the signed-in facilitator is assigned to; asking for a cohort or
// learner outside that scope rejects with a 403 or 404.
//
// Failures reject with the axios error; read them with lib/api/errors.ts.
// List shapes differ by route: the cohort list is `{items, total}`, the
// learner and at-risk lists are `{items, total, page, page_size}`.

// ── School years and cohorts ─────────────────────────────────────────────────

/** GET /api/facilitator/school-years - the years the facilitator has cohorts in, plus which one is current. */
export async function getSchoolYears(): Promise<FacilitatorSchoolYearsResponse> {
  const res = await apiClient.get<FacilitatorSchoolYearsResponse>("/api/facilitator/school-years");
  return res.data;
}

/** GET /api/facilitator/cohorts - `{items, total}`; every school year when `schoolYear` is omitted. */
export async function getCohorts(schoolYear?: string): Promise<FacilitatorCohortListResponse> {
  const res = await apiClient.get<FacilitatorCohortListResponse>("/api/facilitator/cohorts", {
    params: { school_year: schoolYear },
  });
  return res.data;
}

/** GET /api/facilitator/cohorts/{cohort_id} - the cohort with its roster. */
export async function getCohort(cohortId: number): Promise<FacilitatorCohortDetailResponse> {
  const res = await apiClient.get<FacilitatorCohortDetailResponse>(`/api/facilitator/cohorts/${cohortId}`);
  return res.data;
}

// ── Dashboard ────────────────────────────────────────────────────────────────

/** GET /api/facilitator/dashboard?cohort_id= - a cohort is required. */
export async function getDashboard(cohortId: number): Promise<DashboardResponse> {
  const res = await apiClient.get<DashboardResponse>("/api/facilitator/dashboard", {
    params: { cohort_id: cohortId },
  });
  return res.data;
}

// ── Learners ─────────────────────────────────────────────────────────────────

export interface ListLearnersParams {
  /** Omit for every cohort the facilitator can see ("All cohorts"). */
  cohort_id?: number;
  school_year?: string;
  /** Server default: "active". */
  membership_status?: MembershipStatusFilter;
  search?: string;
  /** True for only learners with an at-risk flag. Server default: false. */
  at_risk?: boolean;
  /** Server default: 1. */
  page?: number;
  /** 1 to 100. Server default: 20. */
  page_size?: number;
}

/** GET /api/facilitator/learners - paginated. */
export async function getLearners(params: ListLearnersParams = {}): Promise<FacilitatorLearnerListResponse> {
  const res = await apiClient.get<FacilitatorLearnerListResponse>("/api/facilitator/learners", { params });
  return res.data;
}

/**
 * GET /api/facilitator/learners/{learner_id}?cohort_id= - `cohortId` picks which
 * of the learner's memberships the detail is about; the backend chooses one
 * when it's omitted.
 */
export async function getLearner(learnerId: number, cohortId?: number): Promise<FacilitatorLearnerDetailResponse> {
  const res = await apiClient.get<FacilitatorLearnerDetailResponse>(`/api/facilitator/learners/${learnerId}`, {
    params: { cohort_id: cohortId },
  });
  return res.data;
}

// ── At-risk flags ────────────────────────────────────────────────────────────

export interface ListAtRiskParams {
  cohort_id?: number;
  school_year?: string;
  /** Server default: "active". */
  status?: AtRiskStatusFilter;
  reason?: AtRiskReason;
  /** Server default: 1. */
  page?: number;
  /** 1 to 100. Server default: 20. */
  page_size?: number;
}

/** GET /api/facilitator/at-risk - paginated. */
export async function getAtRiskFlags(params: ListAtRiskParams = {}): Promise<AtRiskFlagListResponse> {
  const res = await apiClient.get<AtRiskFlagListResponse>("/api/facilitator/at-risk", { params });
  return res.data;
}

/** PATCH /api/facilitator/at-risk/{flag_id} - mark a flag reviewed or dismissed (or reopen it), with an optional note. */
export async function updateAtRiskFlag(flagId: number, data: AtRiskFlagUpdate): Promise<AtRiskFlagItem> {
  const res = await apiClient.patch<AtRiskFlagItem>(`/api/facilitator/at-risk/${flagId}`, data);
  return res.data;
}

// ── Cohort summary report ────────────────────────────────────────────────────

const COHORT_SUMMARY_PATH = "/api/facilitator/reports/cohort-summary";

/** GET /api/facilitator/reports/cohort-summary?cohort_id= - the JSON report, with totals. */
export async function getCohortSummary(
  cohortId: number,
  membershipStatus?: MembershipStatusFilter,
): Promise<CohortSummaryResponse> {
  const res = await apiClient.get<CohortSummaryResponse>(COHORT_SUMMARY_PATH, {
    params: { cohort_id: cohortId, membership_status: membershipStatus },
  });
  return res.data;
}

export interface CsvDownload {
  blob: Blob;
  filename: string;
}

/**
 * The filename out of a `Content-Disposition: attachment; filename="..."`
 * header, or null if the header is missing or has none.
 */
export function filenameFromContentDisposition(header: string | null | undefined): string | null {
  if (!header) return null;
  // RFC 5987 form first (filename*=UTF-8''...), then the plain quoted/unquoted one.
  const extended = /filename\*\s*=\s*[^']*'[^']*'([^;]+)/i.exec(header);
  if (extended) {
    try {
      return decodeURIComponent(extended[1].trim());
    } catch {
      // Malformed escape - fall through to the plain form.
    }
  }
  const plain = /filename\s*=\s*(?:"([^"]*)"|([^;]+))/i.exec(header);
  const name = (plain?.[1] ?? plain?.[2])?.trim();
  return name || null;
}

/**
 * GET /api/facilitator/reports/cohort-summary?format=csv - the same report as a
 * CSV file (one row per learner, no totals), fetched through apiClient so the
 * auth token is attached. Returns the file and the server's filename.
 *
 * A browser only lets a script read Content-Disposition cross-origin when the
 * server lists it in Access-Control-Expose-Headers, which the backend does
 * (backend/app/main.py), so the server's filename is used. If the header is
 * ever missing or has no filename, it falls back to `cohort-summary_<cohortId>.csv`.
 */
export async function downloadCohortSummaryCsv(
  cohortId: number,
  membershipStatus?: MembershipStatusFilter,
): Promise<CsvDownload> {
  const res = await apiClient.get<Blob>(COHORT_SUMMARY_PATH, {
    params: { cohort_id: cohortId, membership_status: membershipStatus, format: "csv" },
    responseType: "blob",
  });
  const header = res.headers["content-disposition"] as string | undefined;
  return {
    blob: res.data,
    filename: filenameFromContentDisposition(header) ?? `cohort-summary_${cohortId}.csv`,
  };
}
