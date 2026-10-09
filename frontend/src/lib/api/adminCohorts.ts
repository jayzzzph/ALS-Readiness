import { apiClient } from "./client";
import type {
  CohortCreate,
  CohortFacilitatorCreate,
  CohortFacilitatorResponse,
  CohortFacilitatorStatusUpdate,
  CohortLearnerCreate,
  CohortLearnerResponse,
  CohortLearnerStatusUpdate,
  CohortListResponse,
  CohortMemberStatus,
  CohortResponse,
  CohortStatus,
  CohortStatusUpdate,
  CohortWithMembersResponse,
} from "./types";

// Admin cohort API: create cohorts, change their status, and assign
// facilitators and learners. Kept apart from admin.ts (user accounts) because
// these routes live under /api/cohorts*, not /api/admin/*.
//
// The assign routes take the facilitators-table / learners-table id, not the
// user id - use `facilitator_id` / `learner_id` from GET /api/admin/users.
//
// Failures reject with the axios error; read them with lib/api/errors.ts.

export interface ListCohortsParams {
  status?: CohortStatus;
  school_year?: string;
}

/** GET /api/cohorts - `{cohorts: [...]}` (not `{items, total}`). */
export async function listCohorts(params: ListCohortsParams = {}): Promise<CohortListResponse> {
  const res = await apiClient.get<CohortListResponse>("/api/cohorts", { params });
  return res.data;
}

/** POST /api/cohorts - 201. */
export async function createCohort(data: CohortCreate): Promise<CohortResponse> {
  const res = await apiClient.post<CohortResponse>("/api/cohorts", data);
  return res.data;
}

/** PATCH /api/cohorts/{cohort_id}/status */
export async function updateCohortStatus(cohortId: number, status: CohortStatus): Promise<CohortResponse> {
  const body: CohortStatusUpdate = { status };
  const res = await apiClient.patch<CohortResponse>(`/api/cohorts/${cohortId}/status`, body);
  return res.data;
}

/** GET /api/cohorts/{cohort_id}/members - the cohort with its facilitators and learners, each with a profile. */
export async function getCohortMembers(cohortId: number): Promise<CohortWithMembersResponse> {
  const res = await apiClient.get<CohortWithMembersResponse>(`/api/cohorts/${cohortId}/members`);
  return res.data;
}

// ── Assignment ───────────────────────────────────────────────────────────────

/** POST /api/cohorts/{cohort_id}/facilitators - 201. */
export async function assignFacilitator(cohortId: number, facilitatorId: number): Promise<CohortFacilitatorResponse> {
  const body: CohortFacilitatorCreate = { facilitator_id: facilitatorId };
  const res = await apiClient.post<CohortFacilitatorResponse>(`/api/cohorts/${cohortId}/facilitators`, body);
  return res.data;
}

/** POST /api/cohorts/{cohort_id}/learners - 201. */
export async function assignLearner(cohortId: number, learnerId: number): Promise<CohortLearnerResponse> {
  const body: CohortLearnerCreate = { learner_id: learnerId };
  const res = await apiClient.post<CohortLearnerResponse>(`/api/cohorts/${cohortId}/learners`, body);
  return res.data;
}

/**
 * PATCH /api/cohort-facilitators/{cohort_facilitator_id}/status - end or
 * reactivate an assignment. The id is the assignment row's `id` (from the
 * roster), not the facilitator's. The schema allows a null body in the response.
 */
export async function updateFacilitatorAssignmentStatus(
  cohortFacilitatorId: number,
  status: CohortMemberStatus,
): Promise<CohortFacilitatorResponse | null> {
  const body: CohortFacilitatorStatusUpdate = { status };
  const res = await apiClient.patch<CohortFacilitatorResponse | null>(
    `/api/cohort-facilitators/${cohortFacilitatorId}/status`,
    body,
  );
  return res.data;
}

/**
 * PATCH /api/cohort-learners/{cohort_learner_id}/status - end or reactivate a
 * membership. The id is the membership row's `id` (from the roster), not the
 * learner's. The schema allows a null body in the response.
 */
export async function updateLearnerMembershipStatus(
  cohortLearnerId: number,
  status: CohortMemberStatus,
): Promise<CohortLearnerResponse | null> {
  const body: CohortLearnerStatusUpdate = { status };
  const res = await apiClient.patch<CohortLearnerResponse | null>(
    `/api/cohort-learners/${cohortLearnerId}/status`,
    body,
  );
  return res.data;
}
