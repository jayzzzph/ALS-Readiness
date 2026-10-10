import { useEffect, useState } from "react";
import { getLearner, updateAtRiskFlag } from "../../../../lib/api/facilitator";
import { getErrorMessage } from "../../../../lib/api/errors";
import type { AtRiskFlagSummary } from "../../../../lib/api/types";
import {
  FLAG_NOTE_MAX_LENGTH,
  flagActions,
  flagReasonText,
  flagStatusLabel,
  isActiveFlag,
  noteForRequest,
  shouldReloadAfterFailure,
  type FlagAction,
} from "../../../../lib/atRisk";
import { formatDate } from "../../../../lib/dates";
import { DASH, orDash, personName } from "../../../../lib/labels";
import { useFetch } from "../../../../lib/hooks/useFetch";
import { toast } from "../../../../lib/toast";
import { Button } from "./Button";
import { FIELD_CLASS } from "./Field";
import { Modal } from "./Modal";
import { FLAG_STATUS_TONE, StatusText } from "./StatusText";
import { EmptyState, ErrorState, LoadingState } from "./States";
import { LABEL } from "./tokens";

interface AtRiskReviewDialogProps {
  /** The learner whose flags are reviewed. */
  learner: { learner_id: number; id_no: string | null; first_name: string | null; last_name: string | null };
  /** The cohort the flags belong to. */
  cohortId: number;
  onClose: () => void;
  /** Called after any change, and after a refused one, so the page behind can reload. */
  onChanged: () => void;
}

/**
 * Review a learner's active at-risk flags: mark each reviewed, dismiss it, or
 * reopen it, with an optional note.
 *
 * The flags are read from the learner detail endpoint, not from the dashboard
 * response, because only that one carries each flag's note and reviewer.
 */
export function AtRiskReviewDialog({ learner, cohortId, onClose, onChanged }: AtRiskReviewDialogProps) {
  const { data, loading, error, reload } = useFetch(
    () => getLearner(learner.learner_id, cohortId),
    [learner.learner_id, cohortId],
  );
  const flags = data ? data.at_risk_flags.filter(isActiveFlag) : [];

  const [notes, setNotes] = useState<Record<number, string>>({});
  const [savingFlagId, setSavingFlagId] = useState<number | null>(null);
  const saving = savingFlagId !== null;

  // Start each note field from the saved note; keep what is being typed for
  // flags already on screen when the list reloads.
  useEffect(() => {
    if (!data) return;
    setNotes((current) => {
      const next: Record<number, string> = {};
      for (const flag of data.at_risk_flags) next[flag.id] = current[flag.id] ?? flag.note ?? "";
      return next;
    });
  }, [data]);

  const act = async (flag: AtRiskFlagSummary, action: FlagAction) => {
    setSavingFlagId(flag.id);
    try {
      await updateAtRiskFlag(flag.id, { status: action.status, note: noteForRequest(notes[flag.id] ?? "") });
      toast.success(action.done);
      onChanged();
      onClose();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "The flag could not be updated."));
      const status = (requestError as { response?: { status?: number } })?.response?.status ?? null;
      if (shouldReloadAfterFailure(status)) {
        // The flag is no longer what this dialog shows: fetch its current state.
        setNotes({});
        reload();
        onChanged();
      }
      setSavingFlagId(null);
    }
  };

  return (
    <Modal
      title="Review at-risk flags"
      subtitle={`${personName(learner, "Unnamed learner")} · ${orDash(learner.id_no)}`}
      onClose={onClose}
      busy={saving}
      footer={<Button onClick={onClose} disabled={saving} className="flex-1">Close</Button>}
    >
      {loading && !data && <LoadingState label="Loading flags…" />}
      {error && <ErrorState message={error} title="The flags could not be loaded" onRetry={reload} />}
      {data && flags.length === 0 && (
        <EmptyState title="No active flags" description="This learner has no open or reviewed flags in this cohort." />
      )}

      {data && flags.length > 0 && (
        <ul className="space-y-4">
          {flags.map((flag) => {
            const noteId = `flag-note-${flag.id}`;
            const note = notes[flag.id] ?? "";
            return (
              <li key={flag.id} className="p-4 bg-[#F2F1ED] border border-[#E2E0DA] rounded-xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-[#1B1D26] text-base font-bold">{flagReasonText(flag)}</div>
                  <StatusText tone={FLAG_STATUS_TONE[flag.status] ?? "quiet"}>{flagStatusLabel(flag.status)}</StatusText>
                </div>
                <div className="text-[#4A4F5C] text-[0.9375rem] mt-1">
                  Detected {formatDate(flag.detected_at) ?? DASH}
                  {flag.status === "reviewed" && (
                    <> · Reviewed by {orDash(flag.reviewed_by_name)} on {formatDate(flag.reviewed_at) ?? DASH}</>
                  )}
                </div>
                {flag.note && <p className="text-[#1B1D26] text-[0.9375rem] mt-2 whitespace-pre-wrap">Note: {flag.note}</p>}

                <label htmlFor={noteId} className={`text-[#1B1D26] ${LABEL} mt-3 mb-2 block`}>
                  Note (optional)
                </label>
                <textarea
                  id={noteId}
                  value={note}
                  onChange={(event) => setNotes((current) => ({ ...current, [flag.id]: event.target.value }))}
                  maxLength={FLAG_NOTE_MAX_LENGTH}
                  rows={2}
                  disabled={saving}
                  placeholder="What you found or did about it"
                  className={FIELD_CLASS}
                />
                <div className="text-[#4A4F5C] text-[0.9375rem] text-right tabular-nums mt-1">{note.length} / {FLAG_NOTE_MAX_LENGTH}</div>

                <div className="flex gap-2 mt-3">
                  {flagActions(flag.status, flag.resolved_at).map((action) => (
                    <Button
                      key={action.status}
                      size="sm"
                      variant={action.status === "reviewed" ? "primary" : "secondary"}
                      onClick={() => void act(flag, action)}
                      disabled={saving}
                    >
                      {savingFlagId === flag.id ? "Saving…" : action.label}
                    </Button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
