import { useEffect, useId, useRef, useState } from "react";
import { getCurriculum, getStrands } from "../../../../lib/api/facilitatorCurriculum";
import { useFetch } from "../../../../lib/hooks/useFetch";
import { Button } from "./Button";
import { FIELD_CLASS } from "./Field";
import { LABEL } from "./tokens";

interface LessonPickerProps {
  /** The chosen lesson, or null while none is. */
  lessonId: number | null;
  onChange: (lessonId: number | null) => void;
  /**
   * The lesson to start on (read once, when the picker opens). Its strand is
   * found by code and its module by looking the lesson up in that strand's
   * tree; if the lesson is not there (archived), the picker starts on the
   * strand with no module or lesson chosen.
   */
  initial?: { strandCode: string; lessonId: number };
  disabled?: boolean;
  /** Opens the Curriculum page, where modules and lessons are added. */
  onOpenCurriculum: () => void;
}

/**
 * Three dependent pickers - strand, then module, then lesson - for choosing
 * the lesson a content item belongs to. Strands come from the strands
 * endpoint and each strand's modules and lessons from the curriculum tree
 * (asked for without a cohort), so only active items are offered.
 */
export function LessonPicker({ lessonId, onChange, initial, disabled = false, onOpenCurriculum }: LessonPickerProps) {
  const id = useId();
  const pendingInitial = useRef(initial ?? null);

  const strands = useFetch(getStrands, [], { fallbackError: "Unable to load the learning strands." });
  const strandItems = strands.data?.items ?? [];

  const [chosenStrandId, setChosenStrandId] = useState<number | null>(null);
  const [moduleId, setModuleId] = useState<number | null>(null);
  const initialStrandCode = pendingInitial.current?.strandCode;
  const strandId = chosenStrandId ?? strandItems.find((strand) => strand.code === initialStrandCode)?.id ?? null;

  // Keyed on the strand: a slow tree for an earlier strand is dropped by the hook.
  const tree = useFetch(() => getCurriculum(strandId as number), [strandId], {
    enabled: strandId !== null,
    fallbackError: "Unable to load this strand's lessons.",
  });
  const modules = tree.data?.modules ?? [];
  const selectedModule = modules.find((item) => item.module_id === moduleId) ?? null;
  const lessons = selectedModule?.lessons ?? [];
  const strandHasNoLessons = tree.data !== null && modules.every((item) => item.lessons.length === 0);

  // Start on the initial lesson once its strand's tree has arrived.
  useEffect(() => {
    const pending = pendingInitial.current;
    if (!pending || !tree.data) return;
    pendingInitial.current = null;
    setChosenStrandId(tree.data.strand_id);
    const home = tree.data.modules.find((item) => item.lessons.some((lesson) => lesson.lesson_id === pending.lessonId));
    if (home) {
      setModuleId(home.module_id);
      onChange(pending.lessonId);
    }
    // Runs when the tree arrives; onChange is the caller's setter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree.data]);

  const selectStrand = (value: string) => {
    pendingInitial.current = null;
    setChosenStrandId(value === "" ? null : Number(value));
    setModuleId(null);
    onChange(null);
  };

  const selectModule = (value: string) => {
    setModuleId(value === "" ? null : Number(value));
    onChange(null);
  };

  const treeLoading = strandId !== null && !tree.data && !tree.error;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor={`${id}-strand`} className={`text-[#1B1D26] ${LABEL} mb-2 block`}>Strand</label>
          <select
            id={`${id}-strand`}
            value={strandId ?? ""}
            onChange={(event) => selectStrand(event.target.value)}
            disabled={disabled || !strands.data}
            className={FIELD_CLASS}
          >
            <option value="">{strands.data ? "Choose a strand" : "Loading…"}</option>
            {strandItems.map((strand) => (
              <option key={strand.id} value={strand.id}>{strand.code} · {strand.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-module`} className={`text-[#1B1D26] ${LABEL} mb-2 block`}>Module</label>
          <select
            id={`${id}-module`}
            value={selectedModule ? selectedModule.module_id : ""}
            onChange={(event) => selectModule(event.target.value)}
            disabled={disabled || !tree.data || modules.length === 0}
            className={FIELD_CLASS}
          >
            <option value="">{treeLoading ? "Loading…" : "Choose a module"}</option>
            {modules.map((item) => (
              <option key={item.module_id} value={item.module_id}>{item.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-lesson`} className={`text-[#1B1D26] ${LABEL} mb-2 block`}>Lesson</label>
          <select
            id={`${id}-lesson`}
            value={lessons.some((lesson) => lesson.lesson_id === lessonId) ? (lessonId as number) : ""}
            onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
            disabled={disabled || selectedModule === null || lessons.length === 0}
            className={FIELD_CLASS}
          >
            <option value="">{selectedModule && lessons.length === 0 ? "No lessons in this module" : "Choose a lesson"}</option>
            {lessons.map((lesson) => (
              <option key={lesson.lesson_id} value={lesson.lesson_id}>{lesson.title}</option>
            ))}
          </select>
        </div>
      </div>

      {strands.error && (
        <p className="text-[#7A1A12] text-[0.9375rem] flex items-center gap-2" role="alert">
          {strands.error} <Button variant="link" onClick={strands.reload}>Try again</Button>
        </p>
      )}
      {strands.data && strandItems.length === 0 && <p className="text-[#4A4F5C] text-[0.9375rem]">There are no active learning strands.</p>}
      {tree.error && (
        <p className="text-[#7A1A12] text-[0.9375rem] flex items-center gap-2" role="alert">
          {tree.error} <Button variant="link" onClick={tree.reload}>Try again</Button>
        </p>
      )}
      {strandHasNoLessons && (
        <p className="text-[#4A4F5C] text-[0.9375rem] flex items-center gap-2 flex-wrap">
          This strand has no lessons yet. Modules and lessons are added in Learning Contents.
          <Button variant="link" onClick={onOpenCurriculum} disabled={disabled}>Go to Learning Contents</Button>
        </p>
      )}
    </div>
  );
}
