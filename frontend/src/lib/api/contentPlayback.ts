// Opening a content item and reporting progress on it.

import { apiClient } from "./client";
import { getErrorCode } from "./errors";
import { getMyCurriculum } from "./learningContents";

/**
 * Where to play one item. The curriculum response carries a presigned storage URL on every content (`file_url`),
 * which stops working after about 2 hours.
 *
 * With `knownUrl` (the item's file_url from the outline already on screen) it returns that. Without it, it refetches
 * the strand's curriculum and reads a fresh file_url, which is how the player recovers from an expired URL.
 */
export async function openContent(contentId: number, strandId: number, knownUrl?: string): Promise<string> {
  if (knownUrl) return knownUrl;
  const curriculum = await getMyCurriculum(strandId);
  for (const module of curriculum.modules) {
    for (const lesson of module.lessons) {
      const found = lesson.contents.find((content) => content.content_id === contentId);
      if (found?.file_url) return found.file_url;
    }
  }
  throw new Error("This content has no file URL.");
}

export interface ContentProgress {
  content_id: number;
  last_accessed_at: string | null;
  completed_at: string | null;
}

const progressUrl = (contentId: number) => `/api/me/contents/${contentId}/progress`;

/**
 * Reports progress on one item and returns the saved record, or null when the call failed. It never throws: a failed
 * progress call must not interrupt playback, so the failure is only logged.
 *
 * - "started": POST when the item has never been opened (`hadProgress` false), otherwise PATCH with completed_at null.
 * - "completed": PATCH with both timestamps.
 *
 * `hadProgress` can be stale, so POST that finds a record (CONTENT_PROGRESS_ALREADY_EXISTS) retries as PATCH, and
 * PATCH that finds none (CONTENT_PROGRESS_NOT_FOUND) POSTs first and then PATCHes. PATCH always sends both keys.
 */
export async function updateProgress(contentId: number, event: "started" | "completed", hadProgress: boolean): Promise<ContentProgress | null> {
  const now = new Date().toISOString();
  const patchBody = { last_accessed_at: now, completed_at: event === "completed" ? now : null };
  const patch = async () => (await apiClient.patch<ContentProgress>(progressUrl(contentId), patchBody)).data;
  const post = async () => (await apiClient.post<ContentProgress>(progressUrl(contentId), { last_accessed_at: now })).data;
  try {
    if (event === "started" && !hadProgress) {
      try {
        return await post();
      } catch (error) {
        if (getErrorCode(error) !== "CONTENT_PROGRESS_ALREADY_EXISTS") throw error;
        return await patch();
      }
    }
    try {
      return await patch();
    } catch (error) {
      if (getErrorCode(error) !== "CONTENT_PROGRESS_NOT_FOUND") throw error;
      await post();
      return await patch();
    }
  } catch (error) {
    console.warn("Could not save content progress", error);
    return null;
  }
}
