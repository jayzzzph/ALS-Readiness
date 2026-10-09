import { apiClient } from "./client";
import type {
  StrandTestType,
  StrandTestViewerDetailResponse,
  StrandTestViewerListResponse,
} from "./types";

// M05 strand test viewer API. Read-only: a facilitator can see the tests and
// their answer keys, but nothing here edits them. (The learner-facing strand
// test calls, which never carry answers, live in diagnostic.ts.)
//
// Failures reject with the axios error; read them with lib/api/errors.ts.

export interface ListStrandTestsParams {
  strand_id?: number;
  type?: StrandTestType;
}

/** GET /api/facilitator/strand-tests - `{items, total}`, with item and attempt counts. */
export async function getStrandTests(params: ListStrandTestsParams = {}): Promise<StrandTestViewerListResponse> {
  const res = await apiClient.get<StrandTestViewerListResponse>("/api/facilitator/strand-tests", { params });
  return res.data;
}

/** GET /api/facilitator/strand-tests/{test_id} - items in order with options and `is_correct`, plus an `integrity` report. */
export async function getStrandTest(testId: number): Promise<StrandTestViewerDetailResponse> {
  const res = await apiClient.get<StrandTestViewerDetailResponse>(`/api/facilitator/strand-tests/${testId}`);
  return res.data;
}
