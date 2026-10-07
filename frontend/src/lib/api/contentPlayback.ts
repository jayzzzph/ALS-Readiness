// Opening a content item and reporting progress on it.

import { getMyCurriculum } from "./learningContents";

/** What the player reports. "not_opened" is the default and is never sent. */
export type ReportedProgress = "in_progress" | "completed";

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

/** Waits for the progress route (PUT /api/me/contents/{contentId}/progress), which the backend does not have yet. */
export async function updateProgress(_contentId: number, _status: ReportedProgress): Promise<void> {}
