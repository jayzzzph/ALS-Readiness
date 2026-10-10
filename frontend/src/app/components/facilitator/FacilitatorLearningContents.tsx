import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Archive, BookOpen, Calendar, ChevronDown, ChevronLeft, ChevronRight, FileCheck2, FileX2, Plus } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import type { PageProps } from "../../routes/ProtectedPage";
import { getErrorCode, getErrorMessage, getErrorStatus } from "../../../lib/api/errors";
import {
  createLesson,
  createModule,
  getCurriculum,
  getStrands,
  reorderLessons,
  reorderModules,
  unassignContent,
  updateLesson,
  updateModule,
} from "../../../lib/api/facilitatorCurriculum";
import type {
  FacilitatorCohortItem,
  FacilitatorContentNode,
  FacilitatorCurriculumResponse,
  FacilitatorLessonNode,
  FacilitatorModuleNode,
  StrandItem,
} from "../../../lib/api/types";
import {
  ARCHIVE_UNDO_HINT,
  TITLE_MAX_LENGTH,
  activeIds,
  archiveLessonText,
  archiveModuleText,
  canMove,
  curriculumControls,
  curriculumErrorMessage,
  lessonActions,
  lessonPillText,
  moduleActions,
  moveId,
  shouldReloadTree,
  strandTabLabel,
  structureFormValues,
  treeFailureText,
  type CurriculumControls,
  type MoveDirection,
  type StructureFormValues,
} from "../../../lib/curriculumText";
import { formatCalendarDate } from "../../../lib/dates";
import { requiredError } from "../../../lib/formText";
import { useFetch } from "../../../lib/hooks/useFetch";
import { cohortStatusLabel, contentTypeLabel, orDash } from "../../../lib/labels";
import { useCohortSelection } from "../../../lib/store/cohortStore";
import { toast, type ToastAction } from "../../../lib/toast";
import { AssignContentModal } from "./AssignContentModal";
import {
  ActionMenu,
  Button,
  Chip,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FIELD_CLASS,
  HeaderButton,
  LoadingState,
  Modal,
  NoCohortsState,
  Notice,
  PageHeader,
  Pill,
  Tabs,
  type ActionMenuItem,
} from "./shared";
import { DISPLAY_FONT } from "./shared/tokens";

// Learning Contents: the selected cohort's details, the learning strands, and
// each strand's curriculum (modules, lessons, and the content assigned to the
// cohort). It replaced the separate Curriculum page (FacilitatorCurriculum.tsx,
// now parked) and carries all of its authoring and assignment features.

const CONTENT_LIBRARY_PAGE = "facilitator-content";

// ── What is open, remembered for the browser session ─────────────────────────

const STRAND_STORAGE_KEY = "alsense.facilitator.learningContents.strand";

function readRememberedStrand(): number | null {
  try {
    const id = Number(window.sessionStorage.getItem(STRAND_STORAGE_KEY));
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  } catch {
    // Blocked storage - behave as if nothing was remembered.
    return null;
  }
}

/** Null forgets the strand, so the page opens on the strand cards again. */
function rememberStrand(strandId: number | null) {
  try {
    if (strandId === null) window.sessionStorage.removeItem(STRAND_STORAGE_KEY);
    else window.sessionStorage.setItem(STRAND_STORAGE_KEY, String(strandId));
  } catch {
    // Storage is a convenience; the page still works for this visit.
  }
}

// "Show archived" is remembered the same way.
const SHOW_ARCHIVED_STORAGE_KEY = "alsense.facilitator.learningContents.showArchived";

function readRememberedShowArchived(): boolean {
  try {
    return window.sessionStorage.getItem(SHOW_ARCHIVED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberShowArchived(show: boolean) {
  try {
    window.sessionStorage.setItem(SHOW_ARCHIVED_STORAGE_KEY, show ? "1" : "0");
  } catch {
    // Storage is a convenience; the toggle still works for this visit.
  }
}

// ── Dialogs ──────────────────────────────────────────────────────────────────

type DialogState =
  | { kind: "module-form"; module: FacilitatorModuleNode | null }
  | { kind: "lesson-form"; module: FacilitatorModuleNode; lesson: FacilitatorLessonNode | null }
  | { kind: "archive-module"; module: FacilitatorModuleNode }
  | { kind: "archive-lesson"; lesson: FacilitatorLessonNode }
  | { kind: "assign"; lesson: FacilitatorLessonNode }
  | { kind: "unassign"; content: FacilitatorContentNode };

interface StructureFormDialogProps {
  /** "Add Module", "Edit Lesson", ... */
  heading: string;
  /** What it is added to or which item is edited. */
  subtitle: string;
  initialTitle: string;
  initialDescription: string;
  saving: boolean;
  onSubmit: (values: StructureFormValues) => void;
  onClose: () => void;
}

/** The one form behind add and edit, for modules and lessons alike: a title and an optional description. */
function StructureFormDialog({ heading, subtitle, initialTitle, initialDescription, saving, onSubmit, onClose }: StructureFormDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  // A blank title is pointed out once the field was left or Save was tried, not while the dialog is first open.
  const [titleTouched, setTitleTouched] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const values = structureFormValues(title, description);
  const titleError = requiredError("Title", title, titleTouched || attempted);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    if (values && !saving) onSubmit(values);
  };

  return (
    <Modal title={heading} subtitle={subtitle} onClose={onClose} busy={saving} initialFocusRef={titleRef}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="structure-title" className="text-[#1B1D26] text-[0.9375rem] font-bold mb-2 block">Title</label>
          <input
            id="structure-title"
            ref={titleRef}
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => setTitleTouched(true)}
            maxLength={TITLE_MAX_LENGTH}
            aria-required="true"
            aria-invalid={titleError !== null}
            disabled={saving}
            className={FIELD_CLASS}
          />
          {titleError && <p className="text-[#7A1A12] text-[0.9375rem] mt-2" role="alert">{titleError}</p>}
        </div>
        <div>
          <label htmlFor="structure-description" className="text-[#1B1D26] text-[0.9375rem] font-bold mb-2 block">Description (optional)</label>
          <textarea
            id="structure-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            disabled={saving}
            className={FIELD_CLASS}
          />
        </div>
        <div className="flex gap-3">
          <Button onClick={onClose} disabled={saving} className="flex-1">Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving} className="flex-1">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Cohort info and strand cards (the page's first view) ─────────────────────

function InfoField({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="text-[#4A4F5C] text-[0.9375rem] flex items-center gap-1">{label}</div>
      <div className="text-[#1B1D26] text-[0.9375rem] font-medium">{children}</div>
    </div>
  );
}

/** The selected cohort, as the top bar has it. Every value comes from GET /api/facilitator/cohorts. */
function CohortInfoCard({ cohort }: { cohort: FacilitatorCohortItem }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E0DA] p-6">
      <h3 className="text-[1.5rem] leading-[1.25] text-[#1B1D26] mb-3" style={DISPLAY_FONT}>Cohort Info</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <InfoField label="Cohort Name">{cohort.name}</InfoField>
        <InfoField label="Cohort Code"><span className="tabular-nums">{orDash(cohort.code)}</span></InfoField>
        <InfoField label="School Year">{cohort.school_year}</InfoField>
        <InfoField label={<><Calendar className="w-4 h-4" aria-hidden="true" /> Start / End Date</>}>
          {orDash(formatCalendarDate(cohort.start_date))} – {orDash(formatCalendarDate(cohort.end_date))}
        </InfoField>
        <InfoField label="Status">
          <Pill tone={cohort.status === "active" ? "success" : "muted"}>{cohortStatusLabel(cohort.status)}</Pill>
        </InfoField>
      </div>
    </div>
  );
}

function LearningStrandCard({ strand, onOpen }: { strand: StrandItem; onOpen: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E0DA] p-5 hover:border-[#00538A] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]">
      <div className="flex items-start justify-between mb-2">
        <div className="w-11 h-11 bg-[#F2F1ED] rounded-xl flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-5 h-5 text-[#4D35BD]" aria-hidden="true" />
        </div>
      </div>
      <div className="text-[#4D35BD] text-[0.8125rem] font-bold uppercase tracking-[0.06em]">{strand.code}</div>
      <h4 className="text-[#1B1D26] text-base font-bold mb-3">{strand.name}</h4>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${strand.name}`}
        className="w-full min-h-11 py-2 text-[0.9375rem] bg-white border border-[#00538A] hover:bg-[#CFE4FF] text-[#00538A] rounded-xl transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A]"
      >
        Open
      </button>
    </div>
  );
}

// ── The tree (the view of one open strand) ───────────────────────────────────

interface TreeActions {
  editModule: (module: FacilitatorModuleNode) => void;
  moveModule: (module: FacilitatorModuleNode, direction: MoveDirection) => void;
  archiveModule: (module: FacilitatorModuleNode) => void;
  restoreModule: (module: FacilitatorModuleNode) => void;
  addLesson: (module: FacilitatorModuleNode) => void;
  editLesson: (module: FacilitatorModuleNode, lesson: FacilitatorLessonNode) => void;
  moveLesson: (module: FacilitatorModuleNode, lesson: FacilitatorLessonNode, direction: MoveDirection) => void;
  archiveLesson: (lesson: FacilitatorLessonNode) => void;
  restoreLesson: (lesson: FacilitatorLessonNode) => void;
  assign: (lesson: FacilitatorLessonNode) => void;
  unassign: (content: FacilitatorContentNode) => void;
}

/**
 * Edit, Move up, Move down, Archive - the same four for a module and a lesson.
 * `ids` are the ACTIVE siblings only, so the first and last active item have
 * the matching Move disabled even with archived items shown around them.
 */
function structureMenu(
  ids: readonly number[],
  id: number,
  handlers: { edit: () => void; move: (direction: MoveDirection) => void; archive: () => void },
): ActionMenuItem[] {
  return [
    { key: "edit", label: "Edit", onSelect: handlers.edit },
    { key: "up", label: "Move up", onSelect: () => handlers.move("up"), disabled: !canMove(ids, id, "up") },
    { key: "down", label: "Move down", onSelect: () => handlers.move("down"), disabled: !canMove(ids, id, "down") },
    { key: "archive", label: "Archive", onSelect: handlers.archive, tone: "danger" },
  ];
}

interface ContentRowProps {
  content: FacilitatorContentNode;
  canUnassign: boolean;
  busy: boolean;
  onUnassign: () => void;
}

/** One file under a lesson, on the line the page has always used: an icon and "File (Evaluated)" or "File (Not Evaluated)". */
function ContentRow({ content, canUnassign, busy, onUnassign }: ContentRowProps) {
  const Icon = content.has_evaluation ? FileCheck2 : FileX2;
  return (
    <li className="flex items-center gap-2 flex-wrap text-[0.9375rem]">
      <Icon className={`w-4 h-4 flex-shrink-0 ${content.has_evaluation ? "text-[#00538A]" : "text-[#4A4F5C]"}`} aria-hidden="true" />
      <span className="text-[#4A4F5C]">{content.has_evaluation ? "File (Evaluated):" : "File (Not Evaluated):"}</span>
      <span className="text-[#1B1D26] font-medium min-w-0 truncate">{content.title}</span>
      <span className="text-[#4A4F5C]">{contentTypeLabel(content.content_type)}</span>
      {!content.is_own && <Pill tone="neutral">Shared</Pill>}
      {canUnassign && (
        <Button variant="outline" size="sm" onClick={onUnassign} disabled={busy} className="ml-auto">
          Unassign
        </Button>
      )}
    </li>
  );
}

interface LessonItemProps {
  module: FacilitatorModuleNode;
  lesson: FacilitatorLessonNode;
  controls: CurriculumControls;
  busy: boolean;
  actions: TreeActions;
}

function LessonItem({ module, lesson, controls, busy, actions }: LessonItemProps) {
  const count = lesson.contents.length;
  // What this lesson offers: everything, Restore only, or nothing (see lessonActions).
  const offers = lessonActions(lesson, module, controls);
  const activeLessonIds = activeIds(module.lessons, (item) => item.lesson_id);

  return (
    <AccordionItem value={String(lesson.lesson_id)}>
      {/* The buttons sit beside the trigger, not inside it: a button cannot hold another. */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <AccordionTrigger className="text-[#1B1D26] text-[0.9375rem]">
            <span className={`min-w-0 ${offers.muted ? "opacity-60" : ""}`}>
              <span className="block">{lesson.title}</span>
              {lesson.description && <span className="block text-[#4A4F5C] text-[0.9375rem] font-normal">{lesson.description}</span>}
              {offers.note && <span className="block text-[#4A4F5C] text-[0.9375rem] font-normal">{offers.note}</span>}
            </span>
          </AccordionTrigger>
        </div>
        {offers.archived && <Pill tone="muted">Archived</Pill>}
        <Pill tone={count > 0 && !offers.muted ? "success" : "muted"}>{lessonPillText(count, controls.hasCohort)}</Pill>
        {offers.canAssign && (
          <Button variant="outline" size="sm" onClick={() => actions.assign(lesson)} disabled={busy} className="flex-shrink-0">
            <Plus className="w-3 h-3" /> Assign
          </Button>
        )}
        {offers.canRestore && (
          <Button variant="outline" size="sm" onClick={() => actions.restoreLesson(lesson)} disabled={busy} className="flex-shrink-0">
            Restore
          </Button>
        )}
        {offers.canEdit && (
          <ActionMenu
            label={`Actions for lesson ${lesson.title}`}
            disabled={busy}
            items={structureMenu(activeLessonIds, lesson.lesson_id, {
              edit: () => actions.editLesson(module, lesson),
              move: (direction) => actions.moveLesson(module, lesson, direction),
              archive: () => actions.archiveLesson(lesson),
            })}
          />
        )}
      </div>
      <AccordionContent>
        {count === 0 ? (
          <p className="pl-1 text-[#4A4F5C] text-[0.9375rem]">
            {controls.hasCohort ? "No content is assigned to this cohort for this lesson." : "No content to show for this lesson."}
          </p>
        ) : (
          <ul className={`space-y-2 pl-1 ${offers.muted ? "opacity-60" : ""}`}>
            {lesson.contents.map((content) => (
              <ContentRow
                key={content.content_id}
                content={content}
                canUnassign={offers.canUnassign}
                busy={busy}
                onUnassign={() => actions.unassign(content)}
              />
            ))}
          </ul>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

interface ModuleCardProps {
  module: FacilitatorModuleNode;
  /** The active modules of the strand, in order: what Move up and Move down work within. */
  activeModuleIds: readonly number[];
  collapsed: boolean;
  onToggle: () => void;
  /** The lessons whose content is showing, as accordion values (lesson ids as strings). */
  openLessons: string[];
  onOpenLessonsChange: (values: string[]) => void;
  controls: CurriculumControls;
  busy: boolean;
  actions: TreeActions;
}

function ModuleCard({ module, activeModuleIds, collapsed, onToggle, openLessons, onOpenLessonsChange, controls, busy, actions }: ModuleCardProps) {
  const Chevron = collapsed ? ChevronRight : ChevronDown;
  const offers = moduleActions(module, controls);

  return (
    // No overflow-hidden here: the action menus open past the card's edge.
    <div className="bg-white rounded-2xl border border-[#E2E0DA]">
      <div className={`flex items-center gap-2 px-5 py-4 ${collapsed ? "" : "border-b border-[#E2E0DA]"}`}>
        <button type="button" onClick={onToggle} aria-expanded={!collapsed} className="flex items-center gap-2 min-w-0 flex-1 text-left rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A]">
          <Chevron className="w-5 h-5 text-[#4A4F5C] flex-shrink-0" aria-hidden="true" />
          <span className={`min-w-0 ${offers.archived ? "opacity-60" : ""}`}>
            <span className="block text-[#1B1D26] font-bold text-base truncate">{module.title}</span>
            {module.description && <span className="block text-[#4A4F5C] text-[0.9375rem] truncate">{module.description}</span>}
          </span>
        </button>
        {offers.archived && <Pill tone="muted">Archived</Pill>}
        {offers.canRestore && (
          <Button variant="outline" size="sm" onClick={() => actions.restoreModule(module)} disabled={busy} className="flex-shrink-0">
            Restore
          </Button>
        )}
        {offers.canEdit && (
          <ActionMenu
            label={`Actions for module ${module.title}`}
            disabled={busy}
            items={structureMenu(activeModuleIds, module.module_id, {
              edit: () => actions.editModule(module),
              move: (direction) => actions.moveModule(module, direction),
              archive: () => actions.archiveModule(module),
            })}
          />
        )}
      </div>

      {!collapsed && (
        <>
          {module.lessons.length === 0 ? (
            <p className="px-5 py-3 text-[#4A4F5C] text-[0.9375rem]">No lessons yet</p>
          ) : (
            <Accordion type="multiple" value={openLessons} onValueChange={onOpenLessonsChange} className="px-5">
              {module.lessons.map((lesson) => (
                <LessonItem key={lesson.lesson_id} module={module} lesson={lesson} controls={controls} busy={busy} actions={actions} />
              ))}
            </Accordion>
          )}
          {offers.canAddLesson && (
            <div className="border-t border-[#E2E0DA] px-5 py-2.5">
              <Button variant="link" onClick={() => actions.addLesson(module)} disabled={busy}>
                <Plus className="w-3 h-3" /> Add Lesson
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function toggled(ids: ReadonlySet<number>, id: number): Set<number> {
  const next = new Set(ids);
  if (!next.delete(id)) next.add(id);
  return next;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function FacilitatorLearningContents({ navigate, user, onLogout }: PageProps) {
  // Assignment is per cohort, so "All cohorts" is not offered here.
  const selection = useCohortSelection({ allowAll: false });
  const cohort: FacilitatorCohortItem | null = selection.cohort;
  const cohortId = selection.cohortId;
  const cohortsSettled = selection.ready && !selection.loading && !selection.error;
  const controls = curriculumControls(cohort);

  const strands = useFetch(getStrands, [], { fallbackError: "Unable to load the learning strands." });
  const strandItems = strands.data?.items ?? [];
  // The strand whose curriculum is open; null shows the cohort info and the strand cards.
  const [openStrandId, setOpenStrandId] = useState<number | null>(readRememberedStrand);
  const selectedStrand = strandItems.find((strand) => strand.id === openStrandId) ?? null;
  const strandId = selectedStrand?.id ?? null;

  // Off by default: archived modules and lessons are asked for only when wanted.
  const [showArchived, setShowArchived] = useState<boolean>(readRememberedShowArchived);
  const toggleShowArchived = () => {
    const next = !showArchived;
    setShowArchived(next);
    rememberShowArchived(next);
  };

  // Keyed on the strand, the cohort, and the toggle: a slow response for an
  // earlier strand, cohort, or toggle state is dropped by the hook. A facilitator
  // with no cohort gets the structure alone (no cohort_id). A reload keeps the
  // tree on screen, so the scroll position and what is expanded survive every action.
  const tree = useFetch(
    () => getCurriculum(strandId as number, cohortId ?? undefined, showArchived),
    [strandId, cohortId, showArchived],
    { enabled: strandId !== null && cohortsSettled, fallbackError: "Unable to load the curriculum." },
  );
  const data: FacilitatorCurriculumResponse | null = tree.data;

  const [collapsedModules, setCollapsedModules] = useState<ReadonlySet<number>>(new Set());
  // Lessons start closed, as the accordion always has; what was opened stays open across actions.
  const [openLessons, setOpenLessons] = useState<string[]>([]);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [busy, setBusy] = useState(false);

  const openStrand = (id: number | null) => {
    setOpenStrandId(id);
    rememberStrand(id);
  };

  /**
   * Every action goes through here: a toast and a tree reload on success; on
   * failure the reason in a toast, and a reload when the screen no longer
   * matches the server. Resolves to whether it worked, so a dialog can stay open.
   */
  const run = async (request: () => Promise<unknown>, done: string, fallback: string, undo?: ToastAction): Promise<boolean> => {
    setBusy(true);
    try {
      await request();
      toast.success(done, undo);
      tree.reload();
      return true;
    } catch (requestError) {
      const code = getErrorCode(requestError);
      const status = getErrorStatus(requestError);
      toast.error(curriculumErrorMessage(code, status, getErrorMessage(requestError, fallback)));
      if (shouldReloadTree(status, code)) tree.reload();
      return false;
    } finally {
      setBusy(false);
    }
  };

  const closeIfDone = async (action: Promise<boolean>) => {
    if (await action) setDialog(null);
  };

  const saveModule = (module: FacilitatorModuleNode | null, values: StructureFormValues) => {
    if (strandId === null) return;
    void closeIfDone(
      module === null
        ? run(() => createModule(strandId, values), "Module added.", "The module could not be added.")
        : run(() => updateModule(module.module_id, values), "Module saved.", "The module could not be saved."),
    );
  };

  const saveLesson = (module: FacilitatorModuleNode, lesson: FacilitatorLessonNode | null, values: StructureFormValues) => {
    void closeIfDone(
      lesson === null
        ? run(() => createLesson(module.module_id, values), "Lesson added.", "The lesson could not be added.")
        : run(() => updateLesson(lesson.lesson_id, values), "Lesson saved.", "The lesson could not be saved."),
    );
  };

  // Restoring: from the Undo on an archive's toast, or from the Restore
  // button on an archived item when "Show archived" is on. A restored item is
  // placed last by the backend. A refusal says which parent must come back first.
  const restoreModule = (module: FacilitatorModuleNode) =>
    void run(
      () => updateModule(module.module_id, { status: "active" }),
      "Module restored. It is now last in the list.",
      "The module could not be restored.",
    );

  const restoreLesson = (lesson: FacilitatorLessonNode) =>
    void run(
      () => updateLesson(lesson.lesson_id, { status: "active" }),
      "Lesson restored. It is now last in its module.",
      "The lesson could not be restored.",
    );

  const archiveModule = (module: FacilitatorModuleNode) => {
    const undo: ToastAction = { label: "Undo", onClick: () => restoreModule(module) };
    void closeIfDone(
      run(() => updateModule(module.module_id, { status: "archived" }), "Module archived.", "The module could not be archived.", undo),
    );
  };

  const archiveLesson = (lesson: FacilitatorLessonNode) => {
    const undo: ToastAction = { label: "Undo", onClick: () => restoreLesson(lesson) };
    void closeIfDone(
      run(() => updateLesson(lesson.lesson_id, { status: "archived" }), "Lesson archived.", "The lesson could not be archived.", undo),
    );
  };

  const moveModule = (module: FacilitatorModuleNode, direction: MoveDirection) => {
    if (!data) return;
    // The order endpoint takes exactly the active modules, so archived ones shown on screen are left out.
    const ids = moveId(activeIds(data.modules, (item) => item.module_id), module.module_id, direction);
    if (ids) void run(() => reorderModules(data.strand_id, ids), "Module moved.", "The module could not be moved.");
  };

  const moveLesson = (module: FacilitatorModuleNode, lesson: FacilitatorLessonNode, direction: MoveDirection) => {
    // Likewise: exactly the module's active lessons.
    const ids = moveId(activeIds(module.lessons, (item) => item.lesson_id), lesson.lesson_id, direction);
    if (ids) void run(() => reorderLessons(module.module_id, ids), "Lesson moved.", "The lesson could not be moved.");
  };

  const unassign = (content: FacilitatorContentNode) => {
    if (!cohort) return;
    void closeIfDone(
      run(
        () => unassignContent(cohort.id, content.content_id),
        `"${content.title}" unassigned from ${cohort.name}.`,
        "The content could not be unassigned.",
      ),
    );
  };

  const actions: TreeActions = {
    editModule: (module) => setDialog({ kind: "module-form", module }),
    moveModule,
    archiveModule: (module) => setDialog({ kind: "archive-module", module }),
    restoreModule,
    addLesson: (module) => setDialog({ kind: "lesson-form", module, lesson: null }),
    editLesson: (module, lesson) => setDialog({ kind: "lesson-form", module, lesson }),
    moveLesson,
    archiveLesson: (lesson) => setDialog({ kind: "archive-lesson", lesson }),
    restoreLesson,
    assign: (lesson) => setDialog({ kind: "assign", lesson }),
    unassign: (content) => setDialog({ kind: "unassign", content }),
  };

  const openAddModule = () => setDialog({ kind: "module-form", module: null });

  let treeBody;
  if (selection.error) {
    treeBody = <ErrorState title="Your cohorts could not be loaded" message={selection.error} onRetry={selection.reload} />;
  } else if (!cohortsSettled) {
    treeBody = <LoadingState label="Loading your cohorts…" />;
  } else if (tree.error) {
    const failure = treeFailureText(tree.errorStatus, tree.error);
    // A missing strand means the strand list is stale too, so both are fetched again.
    const retry = () => {
      strands.reload();
      tree.reload();
    };
    treeBody = <ErrorState title={failure.title} message={failure.message} onRetry={failure.canRetry ? retry : undefined} />;
  } else if (!data) {
    treeBody = <LoadingState label="Loading the curriculum…" />;
  } else if (data.modules.length === 0) {
    treeBody = (
      <div className="bg-white rounded-2xl border border-[#E2E0DA]">
        <EmptyState
          icon={BookOpen}
          title="No modules yet"
          description={showArchived ? "Add the first module of this learning strand." : "Add a module, or turn on Show archived to look for archived ones."}
          action={<Button variant="accent" onClick={openAddModule} disabled={busy}><Plus className="w-3.5 h-3.5" /> Add Module</Button>}
        />
      </div>
    );
  } else {
    const activeModuleIds = activeIds(data.modules, (module) => module.module_id);
    treeBody = (
      <div className="space-y-4">
        {data.modules.map((module) => (
          <ModuleCard
            key={module.module_id}
            module={module}
            activeModuleIds={activeModuleIds}
            collapsed={collapsedModules.has(module.module_id)}
            onToggle={() => setCollapsedModules((current) => toggled(current, module.module_id))}
            openLessons={openLessons}
            onOpenLessonsChange={(values) => {
              // Each module's accordion reports only its own lessons; keep the other modules' open ones.
              const own = new Set(module.lessons.map((lesson) => String(lesson.lesson_id)));
              setOpenLessons((current) => [...current.filter((value) => !own.has(value)), ...values]);
            }}
            controls={controls}
            busy={busy}
            actions={actions}
          />
        ))}
      </div>
    );
  }

  let body;
  if (strands.error) {
    body = <ErrorState title="The learning strands could not be loaded" message={strands.error} onRetry={strands.reload} />;
  } else if (!strands.data) {
    body = <LoadingState label="Loading the learning strands…" />;
  } else if (selectedStrand) {
    // One strand's curriculum.
    body = (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => openStrand(null)}
            aria-label="Back to the learning strands"
            className="w-11 h-11 grid place-items-center rounded-xl bg-white border border-[#8A8F9C] hover:bg-[#F2F1ED] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A]"
          >
            <ChevronLeft className="w-5 h-5 text-[#1B1D26]" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <div className="text-[#4A4F5C] text-[0.9375rem] tabular-nums flex items-center gap-2 flex-wrap">
              <span>{cohort ? `${cohort.code ?? cohort.name} - ` : ""}{selectedStrand.code} - {selectedStrand.name}</span>
              {cohort && cohort.status !== "active" && <Pill tone="muted">{cohortStatusLabel(cohort.status)}</Pill>}
            </div>
            <h2 className="text-[2rem] leading-[1.2] text-[#1B1D26]" style={DISPLAY_FONT}>Learning Curriculum</h2>
          </div>
        </div>
        <Tabs
          label="Learning strands"
          tabs={strandItems.map((strand) => ({ value: strand.id, label: strandTabLabel(strand) }))}
          value={strandId}
          onChange={openStrand}
        />
        <div className="flex items-center gap-3 flex-wrap">
          <Chip selected={showArchived} onClick={toggleShowArchived}>
            <Archive className="w-4 h-4" aria-hidden="true" /> Show archived
          </Chip>
          {showArchived && <span className="text-[#4A4F5C] text-[0.9375rem]">Archived modules and lessons are shown greyed, with Restore.</span>}
        </div>
        {cohortsSettled && controls.note && <Notice>{controls.note}</Notice>}
        {treeBody}
      </div>
    );
  } else {
    // The first view: the selected cohort, then the strands to open.
    let cohortBlock;
    if (selection.error) {
      cohortBlock = <ErrorState title="Your cohorts could not be loaded" message={selection.error} onRetry={selection.reload} />;
    } else if (!cohortsSettled) {
      cohortBlock = <LoadingState label="Loading your cohorts…" />;
    } else if (cohort) {
      cohortBlock = <CohortInfoCard cohort={cohort} />;
    } else {
      cohortBlock = <div className="bg-white rounded-2xl border border-[#E2E0DA]"><NoCohortsState /></div>;
    }
    body = (
      <>
        {cohortBlock}
        <div>
          <h3 className="text-[1.5rem] leading-[1.25] text-[#1B1D26] mb-3" style={DISPLAY_FONT}>Learning Strands</h3>
          {strandItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E2E0DA]"><EmptyState icon={BookOpen} title="No active learning strands" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {strandItems.map((strand) => (
                <LearningStrandCard key={strand.id} strand={strand} onOpen={() => openStrand(strand.id)} />
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="facilitator-learning-contents">
      {dialog?.kind === "module-form" && (
        <StructureFormDialog
          heading={dialog.module ? "Edit Module" : "Add Module"}
          subtitle={selectedStrand ? strandTabLabel(selectedStrand) : ""}
          initialTitle={dialog.module?.title ?? ""}
          initialDescription={dialog.module?.description ?? ""}
          saving={busy}
          onSubmit={(values) => saveModule(dialog.module, values)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "lesson-form" && (
        <StructureFormDialog
          heading={dialog.lesson ? "Edit Lesson" : "Add Lesson"}
          subtitle={`In module: ${dialog.module.title}`}
          initialTitle={dialog.lesson?.title ?? ""}
          initialDescription={dialog.lesson?.description ?? ""}
          saving={busy}
          onSubmit={(values) => saveLesson(dialog.module, dialog.lesson, values)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "archive-module" && (
        <ConfirmDialog
          title="Archive this module?"
          subtitle={dialog.module.title}
          confirmLabel="Archive"
          busyLabel="Archiving…"
          busy={busy}
          onConfirm={() => archiveModule(dialog.module)}
          onClose={() => setDialog(null)}
        >
          <p>{archiveModuleText(dialog.module.lessons.length)}</p>
          <p className="text-[#4A4F5C] text-[0.9375rem]">{ARCHIVE_UNDO_HINT}</p>
        </ConfirmDialog>
      )}
      {dialog?.kind === "archive-lesson" && (
        <ConfirmDialog
          title="Archive this lesson?"
          subtitle={dialog.lesson.title}
          confirmLabel="Archive"
          busyLabel="Archiving…"
          busy={busy}
          onConfirm={() => archiveLesson(dialog.lesson)}
          onClose={() => setDialog(null)}
        >
          <p>{archiveLessonText()}</p>
          <p className="text-[#4A4F5C] text-[0.9375rem]">{ARCHIVE_UNDO_HINT}</p>
        </ConfirmDialog>
      )}
      {dialog?.kind === "unassign" && cohort && (
        <ConfirmDialog
          title="Unassign this content?"
          confirmLabel="Unassign"
          busyLabel="Unassigning…"
          busy={busy}
          onConfirm={() => unassign(dialog.content)}
          onClose={() => setDialog(null)}
        >
          <p>
            Learners in <strong className="font-semibold">{cohort.name}</strong> will no longer see{" "}
            <strong className="font-semibold">{dialog.content.title}</strong>. It stays in the Content Library and can be assigned again.
          </p>
        </ConfirmDialog>
      )}
      {dialog?.kind === "assign" && cohort && (
        <AssignContentModal
          lesson={dialog.lesson}
          cohort={cohort}
          availableContents={dialog.lesson.available_contents}
          onClose={(changed) => {
            setDialog(null);
            if (changed) tree.reload();
          }}
          onOpenLibrary={() => navigate(CONTENT_LIBRARY_PAGE)}
        />
      )}

      <div className="p-6 space-y-6">
        <PageHeader
          eyebrow="Learning Curriculum"
          title="Learning Contents"
          subtitle="Cohort info and per-strand learning curriculum, module by module."
          action={
            selectedStrand && (
              <HeaderButton onClick={openAddModule} disabled={busy}>
                <Plus className="w-4 h-4" /> Add Module
              </HeaderButton>
            )
          }
        />
        {body}
      </div>
    </AppLayout>
  );
}
