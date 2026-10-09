import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../api/errors";

export interface UseFetchOptions {
  /** When false, nothing is fetched and the result stays empty (e.g. no cohort selected yet). Default: true. */
  enabled?: boolean;
  /** Message used when the failure carries none of its own. */
  fallbackError?: string;
}

export interface UseFetchResult<T> {
  /** Null until the first successful load, and again while new inputs load. */
  data: T | null;
  loading: boolean;
  /** A readable message from getErrorMessage, or null. */
  error: string | null;
  /** HTTP status of the failure (e.g. 403 for an access message, FD13); null if there was no response. */
  errorStatus: number | null;
  /** Fetch again with the same inputs. Keeps the current data on screen while it runs. */
  reload: () => void;
}

/**
 * The app's one data-fetching hook (FD5): the same useEffect + useState +
 * `cancelled` flag pattern the pages already use, in one place.
 *
 *   const { data, loading, error, reload } = useFetch(() => getDashboard(cohortId), [cohortId]);
 *
 * It re-runs whenever a value in `deps` changes, and a result that arrives
 * after the inputs changed or the component unmounted is dropped. `fetcher`
 * doesn't need to be memoised - only `deps` decides when to re-run.
 */
export function useFetch<T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[],
  options: UseFetchOptions = {},
): UseFetchResult<T> {
  const { enabled = true, fallbackError } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  // Always call the latest fetcher without making it a dependency.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // Tells a reload (keep the data) apart from new inputs (clear it).
  const lastReloadCount = useRef(reloadCount);

  useEffect(() => {
    const isReload = lastReloadCount.current !== reloadCount;
    lastReloadCount.current = reloadCount;

    if (!enabled) {
      setData(null);
      setError(null);
      setErrorStatus(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    // New inputs: the old data belongs to something else (another cohort, another page).
    if (!isReload) setData(null);
    setLoading(true);
    setError(null);
    setErrorStatus(null);

    fetcherRef.current()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        setData(null);
        setError(getErrorMessage(requestError, fallbackError));
        setErrorStatus((requestError as { response?: { status?: number } })?.response?.status ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // `deps` is the caller's dependency list, spread in on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return { data, loading, error, errorStatus, reload };
}
