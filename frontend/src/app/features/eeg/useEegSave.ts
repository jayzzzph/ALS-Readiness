import { useCallback, useRef, useState } from "react";
import { EegSaveError, describeSaveError, saveEegSession, type EegSessionType, type PendingEegSession } from "../../../lib/api/eegSessions";

export type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved" }
  | { status: "failed"; message: string; cors: boolean };

/**
 * Saves one finished recording and remembers it for retries. The CSV lives in a ref, in memory only, so Retry never needs
 * the recorder: it repeats the whole upload, or only the POST when the upload already worked (see saveEegSession).
 */
export function useEegSave(type: EegSessionType, onSaved?: () => void) {
  const [state, setState] = useState<SaveState>({ status: "idle" });
  const pending = useRef<PendingEegSession | null>(null);
  const busy = useRef(false);

  const run = useCallback(async () => {
    if (!pending.current || busy.current) return;
    busy.current = true;
    setState({ status: "saving" });
    try {
      await saveEegSession(pending.current);
      setState({ status: "saved" });
      onSaved?.();
    } catch (err) {
      console.warn("Could not save the EEG session", err);
      setState({ status: "failed", message: describeSaveError(err), cors: err instanceof EegSaveError && err.failure === "cors" });
    } finally {
      busy.current = false;
    }
  }, [onSaved]);

  /** Starts saving a finished recording. Calling it again for the same recording does nothing. */
  const begin = useCallback((csv: Blob, recordedAt: string) => {
    if (pending.current) return;
    pending.current = { csv, type, recordedAt };
    void run();
  }, [type, run]);

  return { state, begin, retry: run };
}
