// Opening a content item and reporting progress on it.
//
// The backend has no learner route for either yet (see the Learning Content notes: it needs an "open" route that checks
// the content is assigned to the learner's cohort and returns a signed storage URL, and a progress route). Until they
// exist these two functions are the only place the app talks about them, so wiring the real routes means editing only
// the bodies below and flipping CONTENT_OPEN_READY.

/** What the player reports. "not_opened" is the default and is never sent. */
export type ReportedProgress = "in_progress" | "completed";

/** What the player needs to play one item. `url` is a temporary signed URL, so it expires. */
export interface OpenContentResponse {
  url: string;
  title: string;
  content_type: "video" | "audio" | "reading";
  /** ISO timestamp after which `url` stops working. */
  expires_at: string;
}

/**
 * Whether learners may press Open. False in production builds until the real route exists; flip it (or remove it)
 * together with the real openContent below. In dev the mock makes Open usable so the player can be built and tried.
 */
export const CONTENT_OPEN_READY: boolean = import.meta.env.DEV;

/** Dev only: where the mock reads a video from when VITE_CONTENT_DEV_URL is not set. Gitignored; drop any mp4 there. */
const LOCAL_SAMPLE_URL = "/dev/sample-video.mp4";
const MOCK_LIFETIME_MS = 15 * 60 * 1000;

/**
 * Will be: GET /api/me/contents/{contentId}/open  ->  { url, title, content_type, expires_at }
 * (404 when the content is not assigned to the learner's active cohort).
 *
 * Mock (dev builds only): returns VITE_CONTENT_DEV_URL (paste a signed URL there) or the local sample file.
 */
export async function openContent(contentId: number): Promise<OpenContentResponse> {
  if (!import.meta.env.DEV) {
    throw new Error("The open-content route does not exist yet.");
  }
  const pasted = (import.meta.env.VITE_CONTENT_DEV_URL as string | undefined)?.trim();
  return {
    url: pasted || LOCAL_SAMPLE_URL,
    title: `Content ${contentId}`,
    content_type: "video",
    expires_at: new Date(Date.now() + MOCK_LIFETIME_MS).toISOString(),
  };
}

/**
 * Will be: PUT /api/me/contents/{contentId}/progress  with { status }  ->  { content_id, progress_status }
 *
 * Mock: logs only. The player calls it with "in_progress" when playback starts and "completed" when the video ends.
 */
export async function updateProgress(contentId: number, status: ReportedProgress): Promise<void> {
  console.info(`[mock] updateProgress(${contentId}, "${status}")`);
}
