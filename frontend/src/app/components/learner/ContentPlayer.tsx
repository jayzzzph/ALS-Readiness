import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { AttemptShell } from "../diagnostic/PretestAttempts";
import { SectionError } from "../shared/SectionError";
import { openContent, updateProgress, type OpenContentResponse } from "../../../lib/api/contentPlayback";

// Focused player for one video lesson item, in the AttemptShell frame the tests use (header with the lesson title and
// Exit). Type roles from DESIGN.md: serif title, Atkinson Hyperlegible for the note. No autoplay: the learner presses
// play. The video sits on ink, not instrument navy, because navy is reserved for sensor readings.

const display = { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 } as const;
const reading = { fontFamily: "'Atkinson Hyperlegible', 'DM Sans', system-ui, sans-serif" } as const;

const PLAYER_ERROR = "This video can't play right now. Try again or tell your facilitator.";
const NOTE_ID = "player-note";

type Phase = "opening" | "loading" | "ready" | "error";

export function ContentPlayer({ contentId, title, lessonTitle, onClose }: { contentId: number; title: string; lessonTitle: string; onClose: () => void }) {
  const [source, setSource] = useState<OpenContentResponse | null>(null);
  const [phase, setPhase] = useState<Phase>("opening");
  // A new element for every open, even if the fresh URL equals the old one, so the browser really reloads it.
  const [attemptKey, setAttemptKey] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // A signed URL can expire while the page is open. The first playback error therefore gets one fresh URL; a second
  // error is shown to the learner. `resumeAt` puts them back where they were after the swap.
  const refreshed = useRef(false);
  const resumeAt = useRef(0);
  const started = useRef(false);
  const alive = useRef(true);

  const load = useCallback(() => {
    setPhase("opening");
    openContent(contentId)
      .then((next) => { if (alive.current) { setSource(next); setAttemptKey((n) => n + 1); setPhase("loading"); } })
      .catch(() => { if (alive.current) setPhase("error"); });
  }, [contentId]);

  useEffect(() => {
    alive.current = true;
    load();
    // Screen readers and keyboard users start at the title, not wherever the Open button was.
    headingRef.current?.focus();
    return () => { alive.current = false; };
  }, [load]);

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
    void updateProgress(contentId, "in_progress");
  }

  const showVideo = source && phase !== "opening" && phase !== "error";
  const busy = phase === "opening" || phase === "loading";

  return (
    <AttemptShell title={lessonTitle} onClose={onClose} exitLabel="Exit" wide>
      <h1 ref={headingRef} tabIndex={-1} className="text-[2rem] leading-[1.15] text-[#1B1D26] focus:outline-none" style={display}>{title}</h1>

      <div className="mt-5 mx-auto w-full aspect-video max-h-[56dvh] overflow-hidden rounded-2xl bg-[#1B1D26] relative has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#00538A]">
        {showVideo && (
          <video
            key={attemptKey}
            ref={videoRef}
            src={source.url}
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
            onEnded={() => { void updateProgress(contentId, "completed"); }}
            onError={handleError}
          />
        )}
        {busy && (
          <div role="status" className="absolute inset-0 flex items-center justify-center gap-3 text-lg text-white" style={reading}>
            <LoaderCircle className="w-6 h-6 motion-safe:animate-spin" aria-hidden="true" /> Getting your video ready...
          </div>
        )}
        {phase === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-white p-6">
            <SectionError message={PLAYER_ERROR} onRetry={retry} />
          </div>
        )}
      </div>

      {phase !== "error" && (
        <p id={NOTE_ID} className="mt-5 max-w-[40rem] text-lg leading-relaxed text-[#4A4F5C]" style={reading}>
          Press play when you are ready. You can pause or replay any time. The controls under the video change the volume and open full screen.
        </p>
      )}
    </AttemptShell>
  );
}
