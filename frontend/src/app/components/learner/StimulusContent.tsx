import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, BookOpen, Check, Circle, CircleCheck, Clock, Headphones, Video, type LucideIcon } from "lucide-react";
import { getMyCohorts, getMyCurriculum, getMyStrands } from "../../../lib/api/learningContents";
import type { CurriculumLesson, LearningContentNode, LearningStrandProgress, MyCohort, MyCurriculumResponse } from "../../../lib/api/types";
import { getErrorMessage } from "../../../lib/api/errors";
import { AppLayout } from "../shared/AppLayout";
import { Ring } from "../diagnostic/DiagnosticTest";
import { secondaryButton } from "../diagnostic/StrandTestCard";

// Learning Content: a course outline. Strands on top (tabs), the selected strand's modules and lessons below like a
// workbook's table of contents. Type roles and colors follow DESIGN.md: serif headings, Atkinson Hyperlegible for
// sentences, indigo for strand codes, deep blue for progress, amber ink for "in progress".

const display = { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 } as const;
const reading = { fontFamily: "'Atkinson Hyperlegible', 'DM Sans', system-ui, sans-serif" } as const;
const easeOut = "ease-[cubic-bezier(0.23,1,0.32,1)]";
const cardTitle = "text-2xl leading-[1.25] text-[#1B1D26]";
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A]";

/**
 * Readiness-matched delivery does not exist yet, so nothing is recommended and `stimulus_level` is never shown to learners.
 * Once it does, put the recommended content ids in this set and the "Recommended for you" badge appears on those items.
 */
const RECOMMENDED_CONTENT_IDS: ReadonlySet<number> = new Set<number>();

type Status = "not_started" | "in_progress" | "done";

const STATUS: Record<Status, { label: string; icon: LucideIcon; className: string }> = {
  not_started: { label: "Not started", icon: Circle, className: "text-[#4A4F5C]" },
  in_progress: { label: "In progress", icon: Clock, className: "text-[#835500] font-bold" },
  done: { label: "Done", icon: CircleCheck, className: "text-[#00538A] font-bold" },
};

const CONTENT_TYPE: Record<LearningContentNode["content_type"], { verb: string; icon: LucideIcon }> = {
  audio: { verb: "Listen", icon: Headphones },
  video: { verb: "Watch", icon: Video },
  reading: { verb: "Read", icon: BookOpen },
};

const ITEM_STATUS: Record<LearningContentNode["progress_status"], Status> = {
  not_opened: "not_started",
  in_progress: "in_progress",
  completed: "done",
};

function lessonStatus(lesson: CurriculumLesson): Status {
  const statuses = lesson.contents.map((content) => ITEM_STATUS[content.progress_status]);
  if (statuses.length > 0 && statuses.every((status) => status === "done")) return "done";
  if (statuses.some((status) => status !== "not_started")) return "in_progress";
  return "not_started";
}

function StatusLabel({ status }: { status: Status }) {
  const { label, icon: Icon, className } = STATUS[status];
  return <span className={`inline-flex items-center gap-2 text-base ${className}`}><Icon className="w-5 h-5 shrink-0" strokeWidth={status === "done" ? 2.25 : 1.75} aria-hidden="true" /> {label}</span>;
}

const COMING_SOON_ID = "lesson-open-note";

export function StimulusContent({ navigate, user, onLogout }) {
  const [cohorts, setCohorts] = useState<MyCohort[]>([]);
  const [strands, setStrands] = useState<LearningStrandProgress[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [curriculum, setCurriculum] = useState<MyCurriculumResponse | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A slow response for a strand the learner has already moved away from must not replace the current one.
  const latestStrand = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadPage() {
      setLoadingPage(true);
      setError(null);
      try {
        const [cohortResponse, strandResponse] = await Promise.all([getMyCohorts(), getMyStrands()]);
        if (!cancelled) {
          setCohorts(cohortResponse.cohorts);
          setStrands(strandResponse);
        }
      } catch (requestError) {
        if (!cancelled) setError(getErrorMessage(requestError, "Your lessons could not be loaded. Please try again."));
      } finally {
        if (!cancelled) setLoadingPage(false);
      }
    }
    void loadPage();
    return () => { cancelled = true; };
  }, []);

  async function openStrand(strand: LearningStrandProgress) {
    latestStrand.current = strand.strand_id;
    setSelectedId(strand.strand_id);
    setLoadingCurriculum(true);
    setError(null);
    try {
      // The id, rather than a display label, is the backend's curriculum key.
      const result = await getMyCurriculum(strand.strand_id);
      if (latestStrand.current === strand.strand_id) setCurriculum(result);
    } catch (requestError) {
      if (latestStrand.current === strand.strand_id) {
        setCurriculum(null);
        setError(getErrorMessage(requestError, "This strand could not be loaded. Please try again."));
      }
    } finally {
      if (latestStrand.current === strand.strand_id) setLoadingCurriculum(false);
    }
  }

  // Show the first strand's outline right away, so the page is never just a row of tabs.
  useEffect(() => {
    if (strands.length > 0 && selectedId === null) void openStrand(strands[0]);
  }, [strands]);

  const selected = strands.find((strand) => strand.strand_id === selectedId) ?? null;
  const noCohort = !loadingPage && cohorts.length === 0 && strands.length === 0;
  const hasContents = curriculum?.modules.some((module) => module.lessons.some((lesson) => lesson.contents.length > 0)) ?? false;

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="stimulus-content">
      <main className="w-full max-w-[90rem] px-6 lg:px-8 py-10">
        <h1 className="text-[3rem] leading-[1.1] text-[#1B1D26]" style={display}>Learning Content</h1>
        <p className="mt-3 max-w-[40rem] text-lg leading-relaxed text-[#4A4F5C]" style={reading}>Lessons for each of your learning strands.</p>

        <div className="mt-8">
          {loadingPage ? <PageSkeleton /> : noCohort && !error ? (
            <Notice title="No lessons yet">Your lessons will appear here after your facilitator adds you to a cohort.</Notice>
          ) : strands.length === 0 && !error ? (
            <Notice title="No lessons yet">No learning strands are available for your cohort yet.</Notice>
          ) : (
            <>
              {error && (
                <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-[#B42318] bg-[#FDECEA] p-5 text-[#7A1A12]">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-lg leading-snug" style={reading}>{error}</p>
                    {selected && <button type="button" onClick={() => void openStrand(selected)} className={`mt-3 ${secondaryButton}`}>Try again</button>}
                  </div>
                </div>
              )}

              <div role="tablist" aria-label="Learning strands" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {strands.map((strand) => <StrandTab key={strand.strand_id} strand={strand} selected={strand.strand_id === selectedId} disabled={loadingCurriculum} onSelect={() => void openStrand(strand)} />)}
              </div>

              {/* Same two-column grid as the other learner pages: the outline in the main column, the aside from xl, under it below that. */}
              <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <div role="tabpanel" aria-label={selected ? `${selected.name} lessons` : "Lessons"} aria-busy={loadingCurriculum} className="min-w-0 space-y-6">
                  {loadingCurriculum ? <OutlineSkeleton /> : curriculum ? (
                    <>
                      <p id={COMING_SOON_ID} className="flex items-start gap-2 text-lg leading-snug text-[#4A4F5C]" style={reading}>
                        <Clock className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden="true" /> Opening lessons is coming soon.
                      </p>
                      {!hasContents ? (
                        <Notice title="Nothing here yet">This strand has no lessons yet. Check back soon.</Notice>
                      ) : curriculum.modules.map((module, moduleIndex) => (
                        <section key={module.module_id} aria-labelledby={`module-${module.module_id}`} className="rounded-2xl border border-[#E2E0DA] bg-white p-6">
                          <h2 id={`module-${module.module_id}`} className={cardTitle} style={display}>Module {moduleIndex + 1}: {module.title}</h2>
                          {module.lessons.length === 0 ? (
                            <p className="mt-3 text-lg text-[#4A4F5C]" style={reading}>No lessons in this module yet.</p>
                          ) : (
                            <ol className="mt-4 divide-y divide-[#E2E0DA] border-t border-[#E2E0DA]">
                              {module.lessons.map((lesson, lessonIndex) => <LessonRow key={lesson.lesson_id} lesson={lesson} number={lessonIndex + 1} />)}
                            </ol>
                          )}
                        </section>
                      ))}
                    </>
                  ) : null}
                </div>

                <div className="grid gap-6 content-start lg:grid-cols-2 xl:grid-cols-1">
                  {selected && (
                    <section aria-labelledby="strand-progress-title" className="rounded-2xl border border-[#E2E0DA] bg-white p-6">
                      <h2 id="strand-progress-title" className={`${cardTitle} mb-6`} style={display}>Your progress</h2>
                      <div className="flex justify-center">
                        <Ring value={selected.completed_lessons} total={selected.total_lessons}>
                          <span className="text-[2rem] leading-none tabular-nums text-[#1B1D26]" style={display}>{selected.completed_lessons} of {selected.total_lessons}</span>
                          <span className="mt-1.5 text-base font-bold text-[#4A4F5C]">lessons done</span>
                        </Ring>
                      </div>
                      <p className="mt-4 text-center text-base text-[#4A4F5C]">{selected.code}: {selected.name}</p>
                    </section>
                  )}
                  <section aria-labelledby="how-lessons-title" className="rounded-2xl border border-[#E2E0DA] bg-white p-6">
                    <h2 id="how-lessons-title" className={cardTitle} style={display}>How lessons work</h2>
                    <p className="mt-3 text-lg leading-relaxed text-[#4A4F5C]" style={reading}>
                      Each lesson comes as audio, video or reading. Finish your lessons before you take your post-test.
                    </p>
                  </section>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </AppLayout>
  );
}

function StrandTab({ strand, selected, disabled, onSelect }: { strand: LearningStrandProgress; selected: boolean; disabled: boolean; onSelect: () => void }) {
  const percent = strand.total_lessons > 0 ? Math.round((strand.completed_lessons / strand.total_lessons) * 100) : 0;
  return (
    <button
      type="button" role="tab" aria-selected={selected} onClick={onSelect} disabled={disabled && !selected}
      className={`text-left rounded-2xl p-6 transition-[background-color,border-color] duration-150 ${easeOut} ${focus} disabled:cursor-wait ${selected ? "border-2 border-[#00538A] bg-[#CFE4FF] p-[calc(1.5rem-1px)]" : "border border-[#E2E0DA] bg-white hover:border-[#00538A]"}`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-[0.9375rem] font-bold uppercase tracking-[0.06em] leading-snug text-[#4D35BD]">{strand.code}</span>
        {selected && <span className="inline-flex items-center gap-1.5 text-base font-bold text-[#00538A]"><Check className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" /> Selected</span>}
      </span>
      <span className="mt-1 block text-lg font-bold leading-snug text-[#1B1D26]" style={reading}>{strand.name}</span>
      <span className="mt-4 block h-2 rounded-full bg-[#E1E2E7]" aria-hidden="true">
        <span className="block h-full rounded-full bg-[#00538A]" style={{ width: `${percent}%` }} />
      </span>
      <span className="mt-2 block text-base text-[#4A4F5C] tabular-nums">{strand.completed_lessons} of {strand.total_lessons} lessons done</span>
    </button>
  );
}

function LessonRow({ lesson, number }: { lesson: CurriculumLesson; number: number }) {
  const status = lessonStatus(lesson);
  const count = lesson.contents.length;
  return (
    <li className="py-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-snug text-[#1B1D26]" style={reading}>Lesson {number}: {lesson.title}</h3>
          <p className="text-base text-[#4A4F5C]">{count === 0 ? "No items yet" : `${count} ${count === 1 ? "item" : "items"}`}</p>
        </div>
        <StatusLabel status={status} />
      </div>
      {count > 0 && (
        <ul className="mt-3 sm:ml-4 divide-y divide-[#E2E0DA] rounded-xl bg-[#F2F1ED] px-4">
          {lesson.contents.map((content) => <ItemRow key={content.content_id} content={content} />)}
        </ul>
      )}
    </li>
  );
}

function ItemRow({ content }: { content: LearningContentNode }) {
  const { verb, icon: Icon } = CONTENT_TYPE[content.content_type] ?? CONTENT_TYPE.reading;
  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:gap-4">
      <span className="inline-flex w-24 shrink-0 items-center gap-2 text-base font-bold text-[#1B1D26]"><Icon className="w-5 h-5 shrink-0" strokeWidth={1.75} aria-hidden="true" /> {verb}</span>
      <div className="min-w-0 flex-1">
        <p className="text-lg leading-snug text-[#1B1D26]" style={reading}>{content.title}</p>
        {RECOMMENDED_CONTENT_IDS.has(content.content_id) && <p className="mt-1 text-[0.8125rem] font-bold uppercase tracking-[0.06em] text-[#835500]">Recommended for you</p>}
      </div>
      <div className="sm:w-36 shrink-0"><StatusLabel status={ITEM_STATUS[content.progress_status] ?? "not_started"} /></div>
      {/* There is no learner endpoint to open content yet, so this stays disabled. */}
      <button type="button" disabled aria-describedby={COMING_SOON_ID} className="h-12 px-6 shrink-0 inline-flex items-center justify-center rounded-xl border border-[#8A8F9C] bg-white text-[0.9375rem] font-bold text-[#4A4F5C] cursor-not-allowed">Open</button>
    </li>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#E2E0DA] bg-white p-6">
      <h2 className={cardTitle} style={display}>{title}</h2>
      <p className="mt-3 max-w-[34rem] text-lg leading-relaxed text-[#4A4F5C]" style={reading}>{children}</p>
    </section>
  );
}

const pulse = "rounded-xl bg-[#E1E2E7] motion-safe:animate-pulse";

function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading your lessons">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-40 rounded-2xl border border-[#E2E0DA] bg-white p-6"><div className={`${pulse} h-4 w-16`} /><div className={`${pulse} mt-3 h-6 w-3/4`} /><div className={`${pulse} mt-6 h-2 w-full`} /></div>)}
      </div>
      <div className="mt-8"><OutlineSkeleton /></div>
    </div>
  );
}

function OutlineSkeleton() {
  return (
    <div role="status" aria-label="Loading lessons" className="rounded-2xl border border-[#E2E0DA] bg-white p-6">
      <div className={`${pulse} h-7 w-2/3`} />
      <div className="mt-6 space-y-5">{[0, 1, 2].map((i) => <div key={i} className={`${pulse} h-14 w-full`} />)}</div>
    </div>
  );
}
