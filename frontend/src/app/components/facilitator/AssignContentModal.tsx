import { useState } from "react";
import { Check, Send } from "lucide-react";
import { getErrorCode, getErrorMessage, getErrorStatus } from "../../../lib/api/errors";
import { assignContent } from "../../../lib/api/facilitatorCurriculum";
import type { FacilitatorCohortItem, FacilitatorContentNode, FacilitatorLessonNode } from "../../../lib/api/types";
import { curriculumErrorMessage, pickerFailureEffect } from "../../../lib/curriculumText";
import { contentTypeLabel } from "../../../lib/labels";
import { toast } from "../../../lib/toast";
import { Button, EmptyState, Modal, Pill } from "./shared";

interface AssignContentModalProps {
  /** The lesson whose content is being assigned. */
  lesson: Pick<FacilitatorLessonNode, "lesson_id" | "title">;
  /** The cohort the content is assigned to. It must be active. */
  cohort: Pick<FacilitatorCohortItem, "id" | "name">;
  /** The lesson's `available_contents` from the curriculum tree: what the caller may assign and has not yet. */
  availableContents: FacilitatorContentNode[];
  /** `changed` is true when the tree behind is out of date: something was assigned, or a refusal showed it is stale. */
  onClose: (changed: boolean) => void;
  /** Opens the Content Library, where content is uploaded. */
  onOpenLibrary: () => void;
}

/**
 * The picker behind a lesson's "+ Assign": lists the content available for the
 * lesson and assigns it to the cohort one item at a time. An assigned item
 * leaves the list, so several can be assigned without reopening; the tree
 * reloads when the picker closes.
 */
export function AssignContentModal({ lesson, cohort, availableContents, onClose, onOpenLibrary }: AssignContentModalProps) {
  const [contents, setContents] = useState(availableContents);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [changed, setChanged] = useState(false);
  const assigning = assigningId !== null;

  const removeRow = (contentId: number) => setContents((current) => current.filter((item) => item.content_id !== contentId));

  const assign = async (content: FacilitatorContentNode) => {
    setAssigningId(content.content_id);
    try {
      await assignContent(cohort.id, content.content_id);
      toast.success(`"${content.title}" assigned to ${cohort.name}.`);
      setChanged(true);
      removeRow(content.content_id);
    } catch (requestError) {
      const code = getErrorCode(requestError);
      toast.error(
        curriculumErrorMessage(code, getErrorStatus(requestError), getErrorMessage(requestError, "The content could not be assigned.")),
      );
      const effect = pickerFailureEffect(code);
      if (effect === "close") {
        onClose(true);
        return;
      }
      if (effect === "remove-row") {
        // The list this picker was opened with is stale: the item is assigned already, or gone.
        setChanged(true);
        removeRow(content.content_id);
      }
    }
    setAssigningId(null);
  };

  return (
    <Modal
      title="Assign Content"
      subtitle={<>Assigning to: <span className="font-medium text-[#1B1D26]">{cohort.name}</span> · {lesson.title}</>}
      onClose={() => onClose(changed)}
      busy={assigning}
      footer={<Button onClick={() => onClose(changed)} disabled={assigning} className="flex-1">Done</Button>}
    >
      {contents.length === 0 ? (
        <EmptyState
          title="No content is available for this lesson"
          description="Content is uploaded in the Content Library. Content uploaded to this lesson appears here."
          action={<Button variant="link" onClick={onOpenLibrary}>Go to the Content Library</Button>}
        />
      ) : (
        <ul className="space-y-2">
          {contents.map((content) => (
            <li key={content.content_id} className="flex items-center gap-3 p-3 rounded-xl border-2 border-[#E2E0DA]">
              <div className="flex-1 min-w-0">
                <div className="text-[#1B1D26] text-[0.9375rem] font-medium truncate">{content.title}</div>
                <div className="flex items-center gap-2 flex-wrap text-[0.9375rem] text-[#4A4F5C] mt-0.5">
                  <span>{contentTypeLabel(content.content_type)}</span>
                  <Pill tone={content.has_evaluation ? "success" : "muted"}>{content.has_evaluation && <Check className="w-3.5 h-3.5" aria-hidden="true" />}{content.has_evaluation ? "Evaluated" : "Not evaluated"}</Pill>
                  {!content.is_own && <Pill tone="neutral">Shared</Pill>}
                </div>
              </div>
              <Button variant="accent" size="sm" onClick={() => void assign(content)} disabled={assigning} className="flex-shrink-0">
                <Send className="w-3.5 h-3.5" /> {assigningId === content.content_id ? "Assigning…" : "Assign"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
