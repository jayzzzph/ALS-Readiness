import axios from "axios";
import { apiClient } from "./client";
import type {
  ContentCreate,
  ContentLibraryDetailResponse,
  ContentLibraryItem,
  ContentLibraryListResponse,
  ContentResponse,
  ContentType,
  ContentUpdate,
  UploadUrlRequest,
  UploadUrlResponse,
} from "./types";

// M05 content library API, plus the three-step upload:
//   1. requestUploadUrl(filename)  -> { upload_url, file_key }
//   2. uploadFileToUrl(upload_url, file, onProgress)   (straight to file storage)
//   3. createContent({ lesson_id, file_key, title, ... })
//
// Failures reject with the axios error; read them with lib/api/errors.ts.

// ── Library ──────────────────────────────────────────────────────────────────

export interface ListContentsParams {
  strand_id?: number;
  module_id?: number;
  lesson_id?: number;
  type?: ContentType;
  /** True for evaluated only, false for not evaluated only; omit for both. */
  evaluated?: boolean;
  /** True for only the caller's own uploads. Server default: false. */
  mine?: boolean;
  /** Server default: "active". */
  status?: "active" | "archived";
  search?: string;
  /** Server default: 1. */
  page?: number;
  /** 1 to 100. Server default: 20. */
  page_size?: number;
}

/** GET /api/facilitator/contents - paginated, with `counts` for the page header. */
export async function getContents(params: ListContentsParams = {}): Promise<ContentLibraryListResponse> {
  const res = await apiClient.get<ContentLibraryListResponse>("/api/facilitator/contents", { params });
  return res.data;
}

/** GET /api/facilitator/contents/{content_id} - the list item plus `read_url` (null when file storage isn't configured). */
export async function getContent(contentId: number): Promise<ContentLibraryDetailResponse> {
  const res = await apiClient.get<ContentLibraryDetailResponse>(`/api/facilitator/contents/${contentId}`);
  return res.data;
}

/** PATCH /api/facilitator/contents/{content_id} - edit, move to another lesson, or archive/restore via `status`. */
export async function updateContent(contentId: number, data: ContentUpdate): Promise<ContentLibraryItem> {
  const res = await apiClient.patch<ContentLibraryItem>(`/api/facilitator/contents/${contentId}`, data);
  return res.data;
}

// ── Upload ───────────────────────────────────────────────────────────────────

/** POST /api/contents/upload-url - a presigned PUT URL and the `file_key` to hand to createContent. */
export async function requestUploadUrl(filename: string): Promise<UploadUrlResponse> {
  const body: UploadUrlRequest = { filename };
  const res = await apiClient.post<UploadUrlResponse>("/api/contents/upload-url", body);
  return res.data;
}

/** POST /api/contents - 201. Registers an uploaded file as content under a lesson. */
export async function createContent(data: ContentCreate): Promise<ContentResponse> {
  const res = await apiClient.post<ContentResponse>("/api/contents", data);
  return res.data;
}

export interface UploadProgress {
  loaded: number;
  /** Null when the browser can't tell the total size. */
  total: number | null;
  /** Whole number 0 to 100, or null when the total is unknown. */
  percent: number | null;
}

export interface UploadFileOptions {
  onProgress?: (progress: UploadProgress) => void;
  /** Abort to cancel the upload; the promise then rejects (check with axios.isCancel). */
  signal?: AbortSignal;
}

const VIDEO_EXTENSIONS = ["mp4", "mov", "webm"];
const AUDIO_EXTENSIONS = ["mp3", "wav", "m4a"];

/**
 * The Content-Type the API signed the upload URL for. Storage rejects a PUT whose Content-Type differs, so this must
 * mirror ContentService.create_upload_url in the backend: "<kind>/<extension>", not the browser's own `file.type`
 * (the two differ for most formats, e.g. "audio/mp3" here against the browser's "audio/mpeg").
 */
export function signedUploadContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (VIDEO_EXTENSIONS.includes(ext)) return `video/${ext}`;
  if (AUDIO_EXTENSIONS.includes(ext)) return `audio/${ext}`;
  return `text/${ext}`;
}

/**
 * PUTs a file to a presigned URL from requestUploadUrl, reporting progress.
 *
 * `file.name` must be the filename the URL was requested for: the Content-Type sent is derived from it.
 *
 * Uses a bare axios call on purpose, not apiClient: the URL points at file
 * storage, not our API, so it must not carry the bearer token, the refresh
 * cookie, or the API base URL - and a 401/403 from storage must not trigger
 * apiClient's session handling.
 */
export async function uploadFileToUrl(uploadUrl: string, file: File, options: UploadFileOptions = {}): Promise<void> {
  const { onProgress, signal } = options;
  await axios.put(uploadUrl, file, {
    headers: { "Content-Type": signedUploadContentType(file.name) },
    signal,
    onUploadProgress: (event) => {
      if (!onProgress) return;
      const total = event.total ?? null;
      onProgress({
        loaded: event.loaded,
        total,
        percent: total ? Math.min(100, Math.round((event.loaded / total) * 100)) : null,
      });
    },
  });
}
