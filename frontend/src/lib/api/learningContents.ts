import { apiClient } from "./client";
import type {
  LearningStrandProgress,
  MyCohortsResponse,
  MyCurriculumResponse,
} from "./types";

/** Returns only cohorts the authenticated user is permitted to view. */
export async function getMyCohorts(): Promise<MyCohortsResponse> {
  const response = await apiClient.get<MyCohortsResponse>("/api/me/cohorts");
  return response.data;
}

/** Returns learning strands that have content assigned to the learner's cohort. */
export async function getMyStrands(): Promise<LearningStrandProgress[]> {
  const response = await apiClient.get<LearningStrandProgress[]>("/api/me/strands");
  return response.data;
}

/** Fetches the module → lesson → content tree for one selected strand. */
export async function getMyCurriculum(strandId: number): Promise<MyCurriculumResponse> {
  const response = await apiClient.get<MyCurriculumResponse>(`/api/me/curriculum/${strandId}`);
  return response.data;
}

/** Whole-number percent of a strand's lessons that are done. The backend does not send a percent. */
export function strandPercent(strand: Pick<LearningStrandProgress, "completed_lessons" | "total_lessons">): number {
  return strand.total_lessons > 0 ? Math.round((strand.completed_lessons / strand.total_lessons) * 100) : 0;
}
