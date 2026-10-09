import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, Headphones, ListVideo, LoaderCircle, Video, X, type LucideIcon } from "lucide-react";
import { AttemptShell } from "../diagnostic/PretestAttempts";
import { SectionError } from "../shared/SectionError";
import { openContent, updateProgress, type ContentProgress } from "../../../lib/api/contentPlayback";
import type { CurriculumModule, LearningContentNode } from "../../../lib/api/types";

// Course view for a strand's video lessons, in the AttemptShell frame the tests use (header with the lesson title and
// Exit). Left: the strand outline as a side panel (modules open and close, the current one starts open), right: the
// video with its title, note and Previous / Next. Type roles from DESIGN.md: serif title, Atkinson Hyperlegible for the
// note, DM Sans for the panel chrome. Nothing is under 15px. No autoplay: the learner presses play. The video sits on
// ink, not instrument navy, because navy is reserved for sensor readings.
//
// Under 1100px wide the panel leaves the page and opens from a "Lessons" button instead.

const display = { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 } as const;
const reading = { fontFamily: "'Atkinson Hyperlegible', 'DM Sans', system-ui, sans-serif" } as const;
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A]";
const easeOut = "ease-[cubic-bezier(0.23,1,0.32,1)]";

const PLAYER_ERROR = "This video can't play right now. Try again or tell your facilitator.";
const NOTE_ID = "player-note";
const NOTE = "Press play when you are ready. You can pause or replay any time.";

const TYPE_ICON: Record<LearningContentNode["content_type"], LucideIcon> = { video: Video, audio: Headphones, reading: BookOpen };

type Phase = "opening" | "loading" | "ready" | "error";

/** One item of the strand with where it sits in the outline, in the order the learner meets it. */
type Entry = { content: LearningContentNode; moduleId: number; lessonTitle: string };

// Only video has a player so far. Previous and Next skip the rest; the panel shows them as not available yet.
const isPlayable = (content: LearningContentNode) => content.content_type === "video";

/** A check and "Done" on a finished item, the current one too (it also keeps its "Now playing" label). */
function CompletionMark({ content, nowPlaying }: { content: LearningContentNode; nowPlaying: boolean }) {
  if (!content.completed_at) return null;
  return (
    <span className={`mt-0.5 inline-flex shrink-0 items-center gap-1.5 text-[0.9375rem] font-bold ${nowPlaying ? "text-[#1B1D26]" : "text-[#00538A]"}`}>
      <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" /> Done
    </span>
  );
}

export function ContentPlayer({ initialContentId, strandId, strandCode, strandName, modules, onProgress, onClose }: { initialContentId: number; strandId: number; strandCode: string; strandName: string; modules: CurriculumModule[]; onProgress: (progress: ContentProgress) => void; onClose: () => void }) {
  const entries = useMemo<Entry[]>(
    () => modules.flatMap((module) => module.lessons.flatMap((lesson) => lesson.contents.map((content) => ({ content, moduleId: module.module_id, lessonTitle: lesson.title })))),
    [modules],
  );
  const playable = useMemo(() => entries.filter((entry) => isPlayable(entry.content)), [entries]);

  const [currentId, setCurrentId] = useState(initialContentId);
  const current = entries.find((entry) => entry.content.content_id === currentId) ?? entries.find((entry) => entry.content.content_id === initialContentId);
  const position = playable.findIndex((entry) => entry.content.content_id === currentId);
  const previous = position > 0 ? playable[position - 1] : null;
  const next = position >= 0 && position < playable.length - 1 ? playable[position + 1] : null;

  const [url, setUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("opening");
  // A new element for every open, even if the fresh URL equals the old one, so the browser really reloads it.
  const [attemptKey, setAttemptKey] = useState(0);
  const [openModules, setOpenModules] = useState<Set<number>>(() => new Set(current ? [current.moduleId] : []));
  const [panelOpen, setPanelOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const lessonsButtonRef = useRef<HTMLButtonElement>(null);
  const closePanelRef = useRef<HTMLButtonElement>(null);
  // A signed URL can expire while the page is open. The first playback error therefore gets one fresh URL; a second
  // error is shown to the learner. `resumeAt` puts them back where they were after the swap.
  const refreshed = useRef(false);
  const resumeAt = useRef(0);
  const started = useRef(false);
  // Counts loads, so an answer for an item the learner already left (or an older load of this one) is dropped.
  const loadId = useRef(0);
  const mounted = useRef(true);

  const contentId = current?.content.content_id ?? initialContentId;
  const fileUrl = current?.content.file_url ?? "";
  const title = current?.content.title ?? "";

  // The first open of an item plays the file_url already in the outline; every later load refetches the curriculum for a fresh one.
  const load = useCallback((useKnownUrl = false) => {
    const mine = ++loadId.current;
    setPhase("opening");
    openContent(contentId, strandId, useKnownUrl ? fileUrl : undefined)
      .then((nextUrl) => { if (mounted.current && mine === loadId.current) { setUrl(nextUrl); setAttemptKey((n) => n + 1); setPhase("loading"); } })
      .catch(() => { if (mounted.current && mine === loadId.current) setPhase("error"); });
  }, [contentId, strandId, fileUrl]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Runs for the first item and again every time the learner picks another one.
  useEffect(() => {
    refreshed.current = false;
    resumeAt.current = 0;
    started.current = false;
    setUrl(null);
    load(true);
  }, [load]);

  // Screen readers and keyboard users start at the title, not wherever the Open button was.
  useEffect(() => { headingRef.current?.focus(); }, []);

  // Moving on with Next can leave the current module; open it so "Now playing" is always in view.
  useEffect(() => {
    const moduleId = current?.moduleId;
    if (moduleId !== undefined) setOpenModules((open) => (open.has(moduleId) ? open : new Set(open).add(moduleId)));
  }, [current?.moduleId]);

  // The narrow-screen panel closes on Escape and hands focus back to the button that opened it.
  useEffect(() => {
    if (!panelOpen) return;
    closePanelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") closePanel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen]);

  function closePanel() {
    setPanelOpen(false);
    lessonsButtonRef.current?.focus();
  }

  function play(id: number) {
    setCurrentId(id);
    // On a narrow screen the panel closes so the video is what the learner sees.
    if (panelOpen) { setPanelOpen(false); headingRef.current?.focus(); }
  }

  function toggleModule(moduleId: number) {
    setOpenModules((open) => {
      const copy = new Set(open);
      if (!copy.delete(moduleId)) copy.add(moduleId);
      return copy;
    });
  }

  function handleError() {
    if (!refreshed.current) {
      refreshed.current = true;
      resumeAt.current = videoRef.current?.currentTime ?? 0;
      load();
    } else {
      setPhase("error");
    }
  }

  function retry() {
    refreshed.current = false;
    resumeAt.current = 0;
    load();
  }

  function handlePlay() {
    if (started.current) return;
    started.current = true;
    report("started");
  }

  // Saves in the background: playback never waits for it, and a failed save (null) just leaves the outline as it was.
  function report(event: "started" | "completed") {
    const id = contentId;
    void updateProgress(id, event, Boolean(current?.content.last_accessed_at)).then((progress) => { if (progress) onProgress(progress); });
  }

  const showVideo = url && phase !== "opening" && phase !== "error";
  const busy = phase === "opening" || phase === "loading";
  const stepButton = `h-14 px-8 inline-flex items-center justify-center gap-2 rounded-xl text-lg font-bold transition-colors duration-150 ${focus}`;

  const panel = (
    <aside
      id="lesson-panel"
      aria-label="Lessons in this strand"
      className={`${panelOpen ? "fixed inset-y-0 left-0 z-30 flex w-[min(24rem,90vw)] rounded-r-2xl border-r" : "hidden rounded-2xl"} min-h-0 flex-col border-[#E2E0DA] bg-white min-[1100px]:static min-[1100px]:z-auto min-[1100px]:flex min-[1100px]:w-auto min-[1100px]:rounded-2xl min-[1100px]:border`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-[#E2E0DA] p-5">
        <div className="min-w-0">
          <p className="text-[0.9375rem] font-bold uppercase leading-snug tracking-[0.06em] text-[#4D35BD]">{strandCode}</p>
          <h2 className="mt-1 text-lg font-bold leading-snug text-[#1B1D26]" style={reading}>{strandName}</h2>
        </div>
        <button ref={closePanelRef} type="button" onClick={closePanel} className={`-mr-2 -mt-1 h-11 px-3 inline-flex shrink-0 items-center gap-1.5 rounded-lg text-[0.9375rem] font-bold text-[#1B1D26] hover:bg-[#F2F1ED] min-[1100px]:hidden ${focus}`}>
          <X className="h-5 w-5" aria-hidden="true" /> Close
        </button>
      </div>
      <nav aria-label="Modules and lessons" className="min-h-0 flex-1 overflow-y-auto p-3">
        {modules.map((module, moduleIndex) => {
          const open = openModules.has(module.module_id);
          const bodyId = `panel-module-${module.module_id}`;
          return (
            <section key={module.module_id} className="mb-1">
              <h3>
                <button
                  type="button" aria-expanded={open} aria-controls={bodyId} onClick={() => toggleModule(module.module_id)}
                  className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-base font-bold leading-snug text-[#1B1D26] hover:bg-[#F2F1ED] ${focus}`}
                >
                  <span>Module {moduleIndex + 1}: {module.title}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 transition-transform duration-150 ${easeOut} ${open ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
              </h3>
              {open && (
                <div id={bodyId} className="pb-2">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <div key={lesson.lesson_id} className="mt-2">
                      <h4 className="px-3 pb-1 text-base font-bold leading-snug text-[#4A4F5C]">Lesson {lessonIndex + 1}: {lesson.title}</h4>
                      {/* The rail: a line down the left with a marker at each item, amber on the one playing. */}
                      <ul className="relative ml-5 border-l-2 border-[#E1E2E7]">
                        {lesson.contents.map((content) => (
                          <PanelItem key={content.content_id} content={content} nowPlaying={content.content_id === contentId} onPlay={() => play(content.content_id)} />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <AttemptShell title={current?.lessonTitle ?? strandName} onClose={onClose} exitLabel="Exit" maxWidth="max-w-[96rem]" compact>
      <div className="grid gap-4 min-[1100px]:h-[calc(100dvh-7.0625rem)] min-[1100px]:grid-cols-[22rem_minmax(0,1fr)] min-[1100px]:gap-6">
        {panelOpen && <div className="fixed inset-0 z-20 bg-[#1B1D26]/40 min-[1100px]:hidden" onClick={closePanel} aria-hidden="true" />}
        {panel}

        {/* The column is as wide as the video can be at 16:9: the whole width, or less when the height left under the
            header (7.0625rem) after the title, note and buttons (13.5rem) would not fit it. Everything under the video
            shares that width, so Previous and Next sit at the video's edges and nothing scrolls. */}
        <div className="mx-auto flex min-w-0 w-full flex-col min-[1100px]:[max-width:min(100%,max(24rem,calc((100dvh_-_20.5625rem)*16/9)))]">
          <button
            ref={lessonsButtonRef} type="button" onClick={() => setPanelOpen(true)} aria-expanded={panelOpen} aria-controls="lesson-panel"
            className={`mb-4 h-12 self-start px-5 inline-flex items-center gap-2 rounded-xl border border-[#00538A] bg-white text-[0.9375rem] font-bold text-[#00538A] hover:bg-[#CFE4FF] min-[1100px]:hidden ${focus}`}
          >
            <ListVideo className="h-5 w-5" aria-hidden="true" /> Lessons
          </button>

          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#1B1D26] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#00538A]">
            {showVideo && (
              <video
                key={attemptKey}
                ref={videoRef}
                src={url}
                controls
                preload="metadata"
                playsInline
                aria-label={title}
                aria-describedby={NOTE_ID}
                className="h-full w-full object-contain focus:outline-none"
                onLoadedMetadata={(e) => {
                  if (resumeAt.current > 0) { e.currentTarget.currentTime = resumeAt.current; resumeAt.current = 0; }
                  setPhase("ready");
                  refreshed.current = false;
                }}
                onPlay={handlePlay}
                onEnded={() => report("completed")}
                onError={handleError}
              />
            )}
            {busy && (
              <div role="status" className="absolute inset-0 flex items-center justify-center gap-3 text-lg text-white" style={reading}>
                <LoaderCircle className="h-6 w-6 motion-safe:animate-spin" aria-hidden="true" /> Getting your video ready...
              </div>
            )}
            {phase === "error" && (
              <div className="absolute inset-0 flex items-center justify-center bg-white p-6">
                <SectionError message={PLAYER_ERROR} onRetry={retry} />
              </div>
            )}
          </div>

          <div className="mt-4 shrink-0">
            <h1 ref={headingRef} tabIndex={-1} className="line-clamp-2 text-[1.75rem] leading-[1.2] text-[#1B1D26] focus:outline-none" style={display}>{title}</h1>
            {phase !== "error" && <p id={NOTE_ID} className="mt-2 line-clamp-2 text-lg leading-snug text-[#4A4F5C]" style={reading}>{NOTE}</p>}
            <div className="mt-4 flex items-center justify-between gap-4">
              {previous ? (
                <button type="button" onClick={() => play(previous.content.content_id)} className={`${stepButton} border border-[#00538A] bg-white text-[#00538A] hover:bg-[#CFE4FF]`}>
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" /> Previous
                </button>
              ) : <span />}
              {next && (
                <button type="button" onClick={() => play(next.content.content_id)} className={`${stepButton} bg-[#00538A] text-white hover:bg-[#004270]`}>
                  Next <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">Now playing: {title}</p>
    </AttemptShell>
  );
}

function PanelItem({ content, nowPlaying, onPlay }: { content: LearningContentNode; nowPlaying: boolean; onPlay: () => void }) {
  const Icon = TYPE_ICON[content.content_type] ?? BookOpen;
  const playable = isPlayable(content);
  return (
    <li className="relative py-0.5 pl-4">
      <span aria-hidden="true" className={`absolute -left-[7px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 ${nowPlaying ? "border-[#835500] bg-[#FFAB2E]" : "border-[#8A8F9C] bg-white"}`} />
      <button
        type="button" onClick={onPlay} disabled={!playable} aria-current={nowPlaying ? "true" : undefined}
        className={`flex min-h-12 w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-base leading-snug ${focus} ${
          nowPlaying ? "bg-[#FFAB2E] font-bold text-[#1B1D26]"
          : playable ? "text-[#1B1D26] hover:bg-[#F2F1ED]"
          : "cursor-not-allowed text-[#4A4F5C]"
        }`}
      >
        <Icon className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block">{content.title}</span>
          {nowPlaying && <span className="mt-0.5 block text-[0.9375rem] font-bold">Now playing</span>}
          {!playable && <span className="mt-0.5 block text-[0.9375rem]">Not available yet</span>}
        </span>
        <CompletionMark content={content} nowPlaying={nowPlaying} />
      </button>
    </li>
  );
}
