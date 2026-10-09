// EEG sessions: which recordings the learner has saved, the stimulus video, and saving a new recording.

import { apiClient } from "./client";
import { getErrorCode, getErrorMessage } from "./errors";

export type EegSessionType = "baseline" | "exposed";

export interface EegSession {
  id: number;
  file_key: string;
  type: EegSessionType;
  recorded_at: string;
}

/** GET /api/eeg-sessions - what the learner has saved. Part IV is done when a "baseline" exists, Part V when an "exposed" one does. */
export async function getEegStatus(): Promise<{ baselineDone: boolean; exposedDone: boolean }> {
  const res = await apiClient.get<{ eeg_sessions: EegSession[] }>("/api/eeg-sessions");
  const types = new Set(res.data.eeg_sessions.map((s) => s.type));
  return { baselineDone: types.has("baseline"), exposedDone: types.has("exposed") };
}

/** GET /api/eeg-sessions/stimulus - the signed URL of the stimulus video. */
export async function getStimulusUrl(): Promise<string> {
  const res = await apiClient.get<{ read_url: string }>("/api/eeg-sessions/stimulus");
  return res.data.read_url;
}

// ── Saving a recording ───────────────────────────────────────────────────────

/** Where a save failed, so the screen can say what to do. "cors" is a network-level failure of the upload itself. */
export type EegSaveFailure = "url" | "upload" | "cors" | "record";

export class EegSaveError extends Error {
  constructor(public failure: EegSaveFailure, message: string) {
    super(message);
  }
}

/**
 * One recording waiting to be saved. The CSV stays in memory here, so a retry never needs the recorder again.
 * `fileKey` is set once the upload succeeded; a retry then only repeats the POST.
 */
export interface PendingEegSession {
  csv: Blob;
  type: EegSessionType;
  /** Recording start, ISO with timezone. */
  recordedAt: string;
  fileKey?: string;
}

/**
 * upload-url -> PUT the CSV -> POST the session.
 *  - PUT failed: nothing is remembered, so the next call asks for a fresh upload-url and uploads again.
 *  - PUT worked but POST failed: `fileKey` stays on `pending`, so the next call repeats only the POST.
 *  - 409 EEG_SESSION_TYPE_ALREADY_EXISTS means it was already saved, which counts as success.
 * The PUT goes straight to storage with fetch: no Authorization header and no cookies, Content-Type exactly text/csv.
 */
export async function saveEegSession(pending: PendingEegSession): Promise<void> {
  if (!pending.fileKey) {
    let uploadUrl: string;
    let fileKey: string;
    try {
      const res = await apiClient.get<{ upload_url: string; file_key: string }>("/api/eeg-sessions/upload-url");
      uploadUrl = res.data.upload_url;
      fileKey = res.data.file_key;
    } catch (err) {
      throw new EegSaveError("url", getErrorMessage(err, "Could not get an upload link."));
    }

    let put: Response;
    try {
      put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "text/csv" },
        body: pending.csv,
        credentials: "omit",
      });
    } catch {
      // fetch rejects (TypeError) when the browser blocked the request or the network failed. For a cross-origin PUT
      // to the storage bucket this is almost always missing CORS on the bucket.
      throw new EegSaveError("cors", "The upload was blocked or the network failed.");
    }
    if (!put.ok) throw new EegSaveError("upload", `Storage answered ${put.status}.`);
    pending.fileKey = fileKey;
  }

  try {
    await apiClient.post("/api/eeg-sessions", {
      file_key: pending.fileKey,
      type: pending.type,
      recorded_at: pending.recordedAt,
    });
  } catch (err) {
    if (getErrorCode(err) === "EEG_SESSION_TYPE_ALREADY_EXISTS") return;
    throw new EegSaveError("record", getErrorMessage(err, "Could not record the session."));
  }
}

/** Plain-language message for a failed save. */
export function describeSaveError(err: unknown): string {
  if (err instanceof EegSaveError) {
    if (err.failure === "cors") return "The recording could not be sent. This may be a setup problem on the server. Please tell your facilitator.";
    if (err.failure === "upload") return "The recording could not be sent. Try again.";
    if (err.failure === "url") return "We could not start the upload. Try again.";
    return "The recording was sent but not saved yet. Try again.";
  }
  return "Something went wrong while saving. Try again.";
}
