import { apiClient } from "./client";
import type {
  CohortContentCreate,
  CohortContentResponse,
  FacilitatorCurriculumResponse,
  LessonCreate,
  LessonListResponse,
  LessonResponse,
  LessonUpdate,
  ModuleCreate,
  ModuleListResponse,
  ModuleResponse,
  ModuleUpdate,
  ReorderRequest,
  StrandListResponse,
} from "./types";

// M05 curriculum API: the strand → module → lesson tree, authoring its
// structure, and assigning contents to a cohort. Structure is shared by every
// cohort; only the assignment of contents is per cohort.
//
// Failures reject with the axios error; read them with lib/api/errors.ts.

// ── Strands and tree ─────────────────────────────────────────────────────────

/** GET /api/facilitator/strands - `{items, total}`. Never hard-code the strand list; take it from here. */
export async function getStrands(): Promise<StrandListResponse> {
  const res = await apiClient.get<StrandListResponse>("/api/facilitator/strands");
  return res.data;
}

/**
 * GET /api/curriculum/{strand_id}?cohort_id= - the tree for one strand. With a
 * cohort, each lesson lists the contents assigned to it and the ones still
 * available to assign; without one, the tree is structure only.
 *
 * With `includeArchived`, archived modules and lessons are returned too, each
 * with its `status`, so they can be found and restored. Contents are
 * active-only either way.
 */
export async function getCurriculum(
  strandId: number,
  cohortId?: number,
  includeArchived?: boolean,
): Promise<FacilitatorCurriculumResponse> {
  const res = await apiClient.get<FacilitatorCurriculumResponse>(`/api/curriculum/${strandId}`, {
    // Sent only when asked for, so the default request is what it always was.
    params: { cohort_id: cohortId, include_archived: includeArchived ? true : undefined },
  });
  return res.data;
}

// ── Modules ──────────────────────────────────────────────────────────────────

/** POST /api/facilitator/strands/{strand_id}/modules - 201. */
export async function createModule(strandId: number, data: ModuleCreate): Promise<ModuleResponse> {
  const res = await apiClient.post<ModuleResponse>(`/api/facilitator/strands/${strandId}/modules`, data);
  return res.data;
}

/** PATCH /api/facilitator/modules/{module_id} - rename, re-describe, or archive/restore via `status`. */
export async function updateModule(moduleId: number, data: ModuleUpdate): Promise<ModuleResponse> {
  const res = await apiClient.patch<ModuleResponse>(`/api/facilitator/modules/${moduleId}`, data);
  return res.data;
}

/** PUT /api/facilitator/strands/{strand_id}/modules/order - `ids` in the new order; returns the modules as `{items, total}`. */
export async function reorderModules(strandId: number, ids: number[]): Promise<ModuleListResponse> {
  const body: ReorderRequest = { ids };
  const res = await apiClient.put<ModuleListResponse>(`/api/facilitator/strands/${strandId}/modules/order`, body);
  return res.data;
}

// ── Lessons ──────────────────────────────────────────────────────────────────

/** POST /api/facilitator/modules/{module_id}/lessons - 201. */
export async function createLesson(moduleId: number, data: LessonCreate): Promise<LessonResponse> {
  const res = await apiClient.post<LessonResponse>(`/api/facilitator/modules/${moduleId}/lessons`, data);
  return res.data;
}

/** PATCH /api/facilitator/lessons/{lesson_id} - rename, re-describe, or archive/restore via `status`. */
export async function updateLesson(lessonId: number, data: LessonUpdate): Promise<LessonResponse> {
  const res = await apiClient.patch<LessonResponse>(`/api/facilitator/lessons/${lessonId}`, data);
  return res.data;
}

/** PUT /api/facilitator/modules/{module_id}/lessons/order - `ids` in the new order; returns the lessons as `{items, total}`. */
export async function reorderLessons(moduleId: number, ids: number[]): Promise<LessonListResponse> {
  const body: ReorderRequest = { ids };
  const res = await apiClient.put<LessonListResponse>(`/api/facilitator/modules/${moduleId}/lessons/order`, body);
  return res.data;
}

// ── Assignment ───────────────────────────────────────────────────────────────

/** POST /api/facilitator/cohorts/{cohort_id}/contents - 201. Assigns one content to the cohort. */
export async function assignContent(cohortId: number, contentId: number): Promise<CohortContentResponse> {
  const body: CohortContentCreate = { content_id: contentId };
  const res = await apiClient.post<CohortContentResponse>(`/api/facilitator/cohorts/${cohortId}/contents`, body);
  return res.data;
}

/** DELETE /api/facilitator/cohorts/{cohort_id}/contents/{content_id} - 204 No Content. */
export async function unassignContent(cohortId: number, contentId: number): Promise<void> {
  await apiClient.delete(`/api/facilitator/cohorts/${cohortId}/contents/${contentId}`);
}
