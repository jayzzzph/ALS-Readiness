import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, BatteryMedium, Check, ChevronDown, CircleCheck, Info, LoaderCircle, Minus, Pause, Play, TriangleAlert } from "lucide-react";
import { AttemptShell } from "./PretestAttempts";
import { primaryButton, secondaryButton } from "./StrandTestCard";
import { useEegSession, WINDOW_SEC, type ConnState, type Level, type SignalBuffer } from "../../features/eeg/useEegSession";
import { CHANNELS, SAMPLE_RATE } from "../../features/eeg/muse2-ble.js";
import museStep1 from "../../../assets/illustrations/muse-step-1.webp";
import museStep2 from "../../../assets/illustrations/muse-step-2.webp";
import museStep3 from "../../../assets/illustrations/muse-step-3.webp";

// Part IV of the pre-test flow: a resting baseline recorded with the Muse 2 headband, run by the facilitator.
// Three modes, each one fits a 1366x768 screen without scrolling:
//  - setup: a rail of the four steps (put on, pair, check the fit, record) beside the head map;
//  - recording: a focused countdown, like the test question screen;
//  - done: a plain success card, like AttemptSuccess.
// The recording logic lives in useEegSession; this file is only the screen. Type roles and colors follow DESIGN.md.

/**
 * Length of the baseline recording, in seconds. The 15 came from `RECORD_DURATION_MS = 15_000` in the simulated screen this
 * replaces, where it was commented "hardcoded baseline recording length - 15s (testing)". It is a placeholder, not a value
 * from the study protocol. Confirm the real length and change it here only.
 */
export const BASELINE_SECONDS = 15;

const display = { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 } as const;
const reading = { fontFamily: "'Atkinson Hyperlegible', 'DM Sans', system-ui, sans-serif" } as const;
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A]";
const easeOut = "ease-[cubic-bezier(0.23,1,0.32,1)]";
const cardTitle = "text-2xl leading-[1.25]";
/** Fades and lifts a panel in when it mounts. Off under reduced motion. */
const enter = `motion-safe:starting:opacity-0 motion-safe:starting:translate-y-1 transition-[opacity,translate] duration-200 motion-reduce:transition-none ${easeOut}`;

/** One color per sensor, each at least 4.5:1 on white (6.4, 5.8, 8.0, 6.4) so the trace labels read. */
const CHANNEL_COLORS = ["#0E6B5C", "#A8480A", "#7A2E8E", "#2B5EA7"];
const WHERE = ["Behind left ear", "Left forehead", "Right forehead", "Behind right ear"];
/** What to do about a poor sensor, by position in CHANNELS (TP9, AF7, AF8, TP10). */
const FIX = [
  "Tuck the left ear piece behind the ear.",
  "Move hair off the left forehead sensor.",
  "Move hair off the right forehead sensor.",
  "Tuck the right ear piece behind the ear.",
];

// Readiness scale from DESIGN.md: blue = good, amber ink = fair, red = poor. The word and an icon always come with it.
const LEVEL_WORD: Record<Level, string> = { waiting: "Waiting", good: "Good", fair: "Fair", poor: "Poor" };
const LEVEL_COLOR: Record<Level, string> = { waiting: "#4A4F5C", good: "#00538A", fair: "#835500", poor: "#B42318" };
const LEVEL_ICON = { waiting: LoaderCircle, good: Check, fair: Minus, poor: TriangleAlert } as const;

const CONN_WORD: Record<ConnState, string> = {
  idle: "Not connected", connecting: "Connecting…", connected: "Connected", reconnecting: "Reconnecting…", disconnected: "Disconnected",
};
const CONN_COLOR: Record<ConnState, string> = {
  idle: "#4A4F5C", connecting: "#835500", connected: "#00538A", reconnecting: "#B42318", disconnected: "#B42318",
};

const STEP_NAMES = ["Put on the headband", "Pair the Muse 2", "Check the fit", "Record"];

// Motion only where the user allows it: the waiting halo on a sensor still finding contact.
const css = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes eeg-halo { from { transform: scale(1); opacity: .9; } to { transform: scale(1.8); opacity: 0; } }
  .eeg-halo { animation: eeg-halo 1.6s cubic-bezier(0.23, 1, 0.32, 1) infinite; transform-box: fill-box; transform-origin: center; }
}
`;

const fmt = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

export function BaselineEegRecording({ onClose, learnerId }: { onClose: () => void; learnerId: string | null }) {
  const eeg = useEegSession({ learnerId, seconds: BASELINE_SECONDS });
  const { conn, recording, result } = eeg;
  const lost = conn.state === "disconnected" && conn.reason === "lost";

  // Development only: the demo signal never reports a poor sensor, so this lets a developer see that state.
  const [demoPoor, setDemoPoor] = useState(false);
  const showDemoTools = import.meta.env.DEV && eeg.source === "demo";
  const levels: Level[] = eeg.levels.map((l, i) => (showDemoTools && demoPoor && i === 0 ? "poor" : l));
  const ready = levels.filter((l) => l === "good" || l === "fair").length;

  const mode = recording ? "recording" : result ? "done" : "setup";
  const handleExit = () => {
    if (recording && !window.confirm("Leave now? The recording will stop. What was recorded stays on this computer.")) return;
    onClose();
  };

  const banners = (
    <div className="grid gap-3 empty:hidden">
      {conn.state === "reconnecting" && (
        <Banner tone="error" role="status" icon={<LoaderCircle className="w-5 h-5 motion-safe:animate-spin" aria-hidden="true" />}>
          The connection to the headband dropped. Reconnecting ({conn.reason}).
        </Banner>
      )}
      {lost && (
        <Banner tone="error" role="alert" icon={<AlertCircle className="w-5 h-5" aria-hidden="true" />}
          action={<button onClick={() => eeg.pair(false)} className={primaryButton}>Pair Muse 2</button>}>
          The headband disconnected. Check that it is on and nearby, then pair it again.
        </Banner>
      )}
      {mode === "setup" && eeg.recovered && (
        <Banner tone="info" role="status" icon={<Info className="w-5 h-5" aria-hidden="true" />}
          action={<>
            <button onClick={eeg.exportRecovered} className={secondaryButton}>Export CSV</button>
            <button onClick={eeg.discardRecovered} className={secondaryButton}>Discard</button>
          </>}>
          A recording from {eeg.recovered.when} ({fmt(eeg.recovered.duration)}) was not exported. It is still on this computer.
        </Banner>
      )}
    </div>
  );

  return (
    <AttemptShell title="Part IV: Baseline EEG recording" onClose={handleExit} exitLabel="Exit" compact maxWidth={mode === "setup" ? "max-w-[90rem]" : "max-w-3xl"}>
      <style>{css}</style>
      <h1 className="sr-only">Baseline EEG recording</h1>

      {mode === "setup" && (
        <div className="grid gap-4">
          {banners}
          <div className="grid gap-6 xl:grid-cols-[30rem_minmax(0,1fr)] xl:items-start">
            <Rail eeg={eeg} levels={levels} ready={ready} />
            <div className="grid gap-4 min-w-0">
              <SensorCard eeg={eeg} levels={levels} />
              <SignalCard signal={eeg.signal} connected={conn.state === "connected" || conn.state === "reconnecting"} />
            </div>
          </div>
        </div>
      )}
      {mode === "recording" && <RecordingView eeg={eeg} levels={levels} banners={banners} />}
      {mode === "done" && result && <DoneView eeg={eeg} result={result} banners={banners} onBack={onClose} />}

      {/* Quiet announcements for screen readers. */}
      <p className="sr-only" role="status" aria-live="polite">
        {recording ? "Recording started." : result ? (result.completed ? "Recording complete." : "Recording stopped early.") : ""}
      </p>
      {eeg.toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 max-w-[calc(100vw-2rem)] rounded-xl bg-[#1B1D26] px-5 py-3 text-[0.9375rem] font-bold text-white">
          {eeg.toast}
        </div>
      )}
      {showDemoTools && (
        <button onClick={() => setDemoPoor((v) => !v)} aria-pressed={demoPoor}
          className={`fixed bottom-4 left-4 z-20 h-11 rounded-lg border border-dashed border-[#8A8F9C] bg-white px-3 text-[0.9375rem] font-bold text-[#1B1D26] ${focus}`}>
          Demo: {demoPoor ? "clear" : "make"} TP9 poor
        </button>
      )}
    </AttemptShell>
  );
}

type Eeg = ReturnType<typeof useEegSession>;

function Banner({ tone, icon, action, role, children }: { tone: "error" | "info"; icon: ReactNode; action?: ReactNode; role: "alert" | "status"; children: ReactNode }) {
  const palette = tone === "error" ? "border-[#B42318] bg-[#FDECEA] text-[#7A1A12]" : "border-[#E2E0DA] bg-[#F2F1ED] text-[#1B1D26]";
  return (
    <div role={role} className={`flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border p-4 ${palette}`}>
      <span className="shrink-0" aria-hidden="true">{icon}</span>
      <p className="flex-1 min-w-[16rem] text-base leading-snug">{children}</p>
      {action && <div className="flex flex-wrap gap-3">{action}</div>}
    </div>
  );
}

/* ───────────────────────── Setup: the rail ───────────────────────── */

type StepStatus = "done" | "current" | "upcoming";

/** The four steps like the pre-test hub timeline: a check when done, the current one expanded, the rest collapsed. */
function Rail({ eeg, levels, ready }: { eeg: Eeg; levels: Level[]; ready: number }) {
  const { step } = eeg;
  return (
    <ol aria-label="Setup steps" className="min-w-0">
      {STEP_NAMES.map((name, i) => {
        const n = i + 1;
        const status: StepStatus = n < step ? "done" : n === step ? "current" : "upcoming";
        const last = n === 4;
        const markerTop = status === "current" ? "top-5" : "top-1";
        const lineTop = status === "current" ? "top-[3.75rem]" : "top-11";
        const look = status === "done" ? "bg-[#00538A] border-[#00538A] text-white" : status === "current" ? "bg-[#FFAB2E] border-[#FFAB2E] text-[#1B1D26]" : "bg-white border-[#8A8F9C] text-[#4A4F5C]";
        return (
          <li key={name} className={`relative pl-16 ${last ? "" : "pb-5"}`} aria-current={status === "current" ? "step" : undefined}>
            {!last && <span className={`absolute left-[19px] bottom-0 w-0.5 rounded-full ${lineTop} ${status === "done" ? "bg-[#00538A]" : "bg-[#E1E2E7]"}`} aria-hidden="true" />}
            <span className={`absolute left-0 ${markerTop} flex h-10 w-10 items-center justify-center rounded-full border-2 text-[1.0625rem] font-bold tabular-nums ${look}`} aria-hidden="true">
              {status === "done" ? <Check className="w-5 h-5" strokeWidth={2.5} /> : n}
            </span>
            {status === "current" ? (
              <section aria-label={name} className={`rounded-2xl border border-[#E2E0DA] bg-white p-6 ${enter}`}>
                <h2 className={`${cardTitle} text-[#1B1D26]`} style={display}>{name}</h2>
                <StepBody eeg={eeg} levels={levels} ready={ready} />
              </section>
            ) : (
              <div className="min-h-12 flex flex-col justify-center">
                <h2 className={`text-base font-bold leading-snug ${status === "done" ? "text-[#1B1D26]" : "text-[#4A4F5C]"}`}>{name}</h2>
                {status === "done" && <p className="text-[0.9375rem] font-bold leading-snug text-[#00538A]">Done</p>}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function StepBody({ eeg, levels, ready }: { eeg: Eeg; levels: Level[]; ready: number }) {
  const { step } = eeg;
  const p = "mt-3 text-base leading-[1.55] text-[#1B1D26]";
  if (step === 1) {
    return (
      <>
        <StepGuide action={<button onClick={eeg.continueFromStep1} className={primaryButton}>The headband is on</button>} />
      </>
    );
  }
  if (step === 2) {
    const note = eeg.connectNote === "unsupported"
      ? "This browser can’t connect to Bluetooth devices. Open this page in Chrome or Edge on a laptop or desktop. Phones and iPads aren’t supported."
      : eeg.connectNote === "cancelled" ? "No device was chosen. Click Pair Muse 2 to try again." : eeg.connectNote;
    const connecting = eeg.conn.state === "connecting";
    return (
      <>
        <p className={p}>Keep the headband within 1 meter of this computer. Click Pair Muse 2, then choose the device named “Muse” in the window that opens.</p>
        {note && (
          <p role="alert" className="mt-4 flex items-start gap-3 rounded-xl border border-[#B42318] bg-[#FDECEA] p-4 text-base leading-snug text-[#7A1A12]">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" /> {note}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={() => eeg.pair(false)} disabled={connecting || eeg.connectNote === "unsupported"} aria-busy={connecting} className={`${primaryButton} gap-2`}>
            {connecting && <LoaderCircle className="w-5 h-5 motion-safe:animate-spin" aria-hidden="true" />}
            {connecting ? "Pairing…" : "Pair Muse 2"}
          </button>
          {import.meta.env.DEV && <button onClick={() => eeg.pair(true)} disabled={connecting} className={secondaryButton}>Use a demo signal</button>}
        </div>
      </>
    );
  }
  if (step === 3) {
    const poor = levels.map((l, i) => (l === "poor" ? i : -1)).filter((i) => i >= 0);
    return (
      <>
        <p className={p}>Wait until all four sensors say Good or Fair. It moves on by itself once they hold.</p>
        <p className="mt-3 text-base font-bold text-[#1B1D26] tabular-nums" aria-live="polite">{ready} of 4 sensors ready</p>
        {poor.length > 0 && (
          <ul className="mt-3 grid gap-2">
            {poor.map((i) => (
              <li key={i} className="flex items-start gap-2 text-base leading-snug text-[#7A1A12]">
                <TriangleAlert className="w-5 h-5 shrink-0 text-[#B42318]" aria-hidden="true" />
                <span><b>{CHANNELS[i]}:</b> {FIX[i]}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={eeg.skipFit} disabled={ready < 4} className={primaryButton}>Continue</button>
          <button onClick={eeg.skipFit} className={`h-11 rounded-lg px-3 text-[0.9375rem] font-bold text-[#00538A] hover:bg-[#CFE4FF] ${focus}`}>Continue with a weak signal</button>
        </div>
      </>
    );
  }
  return (
    <>
      <p className={p}>Check that the learner is seated and still, then start. The recording lasts {BASELINE_SECONDS} seconds and stops by itself.</p>
      {ready < 4 && (
        <ul className="mt-3 grid gap-2">
          {levels.map((l, i) => (l === "poor" ? (
            <li key={i} className="flex items-start gap-2 text-base leading-snug text-[#7A1A12]">
              <TriangleAlert className="w-5 h-5 shrink-0 text-[#B42318]" aria-hidden="true" />
              <span><b>{CHANNELS[i]}:</b> {FIX[i]}</span>
            </li>
          ) : null))}
          {!levels.includes("poor") && <li className="text-base leading-snug text-[#4A4F5C]">Some sensors are still settling.</li>}
        </ul>
      )}
      <button onClick={eeg.startRecording} disabled={eeg.conn.state !== "connected"} className={`mt-4 ${primaryButton}`}>
        {ready === 4 ? `Start ${BASELINE_SECONDS}-second recording` : `Record ${BASELINE_SECONDS} seconds anyway`}
      </button>
    </>
  );
}

/* ───────────────────────── Setup: how to wear it ───────────────────────── */

const GUIDE = [
  { src: museStep1, caption: "Turn it on", alt: "The learner presses the power button on the Muse 2 band until its light comes on." },
  { src: museStep2, caption: "Rest it above the eyebrows", alt: "The learner holds the band with both hands and rests it across the forehead, above the eyebrows." },
  { src: museStep3, caption: "Tuck the ear pieces behind the ears", alt: "The learner tucks the two ends of the band behind the ears." },
];
/** How long each frame stays up before the next one fades in. */
const GUIDE_FRAME_MS = 2500;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/**
 * Three pictures of how to put the band on. They crossfade one at a time and loop, with a caption, three dots and a
 * pause button. The loop only runs while this is mounted (step 1), the tab is visible and the guide is not paused.
 * Under reduced motion nothing fades or loops: the three pictures sit side by side, each with its number and caption.
 * `action` is the step's one button, shown on the same row as the dots.
 */
function StepGuide({ action }: { action: ReactNode }) {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tabHidden, setTabHidden] = useState(() => typeof document !== "undefined" && document.visibilityState === "hidden");

  useEffect(() => {
    const on = () => setTabHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  useEffect(() => {
    if (reduced || paused || tabHidden) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % GUIDE.length), GUIDE_FRAME_MS);
    return () => clearTimeout(t);
  }, [index, reduced, paused, tabHidden]);

  if (reduced) {
    return (
      <>
        <ol aria-label="How to put the band on" className="mt-3 grid grid-cols-3 gap-3">
          {GUIDE.map((g, i) => (
            <li key={g.caption} className="min-w-0">
              <img src={g.src} width={528} height={470} alt={g.alt} className="block aspect-[528/470] w-full rounded-lg" />
              <p className="mt-2 text-[18px] leading-[1.35] text-[#1B1D26]" style={reading}><b className="tabular-nums">{i + 1}.</b> {g.caption}</p>
            </li>
          ))}
        </ol>
        <div className="mt-4">{action}</div>
      </>
    );
  }

  const fade = `transition-opacity duration-[600ms] ${easeOut}`;
  return (
    <>
      <div role="group" aria-roledescription="carousel" aria-label="How to put the band on" className="mt-3">
        <div className="relative mx-auto aspect-[528/470] w-[16.5rem] overflow-hidden rounded-xl">
          {GUIDE.map((g, i) => (
            <img key={g.caption} src={g.src} width={528} height={470} alt={g.alt} aria-hidden={i !== index}
              className={`absolute inset-0 h-full w-full ${i === index ? `z-10 opacity-100 ${fade}` : "z-0 opacity-0 transition-opacity duration-0 delay-[600ms]"}`} />
          ))}
        </div>
        {/* The incoming picture fades in over the outgoing one, which is hidden only once it is fully covered. */}
        <p className="mt-2 text-center text-[18px] leading-[1.6] text-[#1B1D26]" style={reading} aria-live={paused ? "polite" : "off"}>
          {GUIDE[index].caption}
        </p>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex items-center">
          <ul className="flex items-center" aria-label="Pictures">
            {GUIDE.map((g, i) => (
              <li key={g.caption}>
                <button onClick={() => { setIndex(i); setPaused(true); }} aria-label={`Show picture ${i + 1}: ${g.caption}`} aria-current={i === index ? "true" : undefined}
                  className={`grid h-10 w-8 place-items-center rounded-lg ${focus}`}>
                  <span className={`block h-2.5 rounded-full transition-[width,background-color] duration-200 ${easeOut} ${i === index ? "w-6 bg-[#00538A]" : "w-2.5 bg-[#8A8F9C]"}`} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <button onClick={() => setPaused((v) => !v)} aria-label={paused ? "Play guide" : "Pause guide"}
            className={`ml-1 grid h-10 w-10 place-items-center rounded-lg text-[#00538A] hover:bg-[#CFE4FF] active:scale-[0.97] transition-[background-color,scale] duration-150 ${easeOut} ${focus}`}>
            {paused ? <Play className="w-4 h-4" fill="currentColor" aria-hidden="true" /> : <Pause className="w-4 h-4" fill="currentColor" aria-hidden="true" />}
          </button>
        </div>
        {action}
      </div>
    </>
  );
}

/* ───────────────────────── Setup: the head map (the sensor card) ───────────────────────── */

/** Navy is reserved for the sensor: connection, battery, and the head map with each sensor's word beside it. */
function SensorCard({ eeg, levels }: { eeg: Eeg; levels: Level[] }) {
  const { conn } = eeg;
  return (
    <section aria-labelledby="eeg-sensor-title" className="rounded-2xl bg-[#1C1D33] p-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="eeg-sensor-title" className={cardTitle} style={display}>Sensor contact</h2>
        <div className="flex flex-wrap items-center gap-3">
          {eeg.battery !== null && (
            <span className="inline-flex items-center gap-1.5 text-[0.9375rem] font-bold text-[#D9DBEA]">
              <BatteryMedium className="w-5 h-5" aria-hidden="true" /> Battery {Math.round(eeg.battery)}%
            </span>
          )}
          <span role="status" className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[0.9375rem] font-bold text-[#1B1D26]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: CONN_COLOR[conn.state] }} aria-hidden="true" />
            {conn.state === "connected" ? `Connected to ${conn.name}` : CONN_WORD[conn.state]}
          </span>
        </div>
      </div>
      <div className="mt-2 flex justify-center overflow-x-auto"><HeadMap levels={levels} /></div>
    </section>
  );
}

// Head seen from above, front at the top. Drawn at 1.1x (572 wide), so every label is about 17px. The sensors sit on the
// head; each one's name, place and word sit outside it, joined by a thin leader line, so nothing crosses a label.
const MAP_SENSORS: { cx: number; cy: number; side: "left" | "right" }[] = [
  { cx: 178, cy: 200, side: "left" },   // TP9
  { cx: 218, cy: 98, side: "left" },    // AF7
  { cx: 302, cy: 98, side: "right" },   // AF8
  { cx: 342, cy: 200, side: "right" },  // TP10
];
const SVG_FONT = "'DM Sans', system-ui, sans-serif";

function HeadMap({ levels }: { levels: Level[] }) {
  const outline = { fill: "#191A2E", stroke: "#D9DBEA", strokeOpacity: 0.6, strokeWidth: 2 };
  return (
    <svg viewBox="0 0 520 300" width={572} height={330} className="shrink-0" role="img"
      aria-label={`Head seen from above, front at the top. ${CHANNELS.map((c: string, i: number) => `${c} ${LEVEL_WORD[levels[i]]}`).join(", ")}.`}>
      <text x="260" y="17" textAnchor="middle" fontSize="16" fontWeight="700" fill="#D9DBEA" fontFamily={SVG_FONT}>Front</text>
      <path d="M248 46 L260 27 L272 46 Z" {...outline} />
      <ellipse cx="155" cy="150" rx="12" ry="26" {...outline} />
      <ellipse cx="365" cy="150" rx="12" ry="26" {...outline} />
      <circle cx="260" cy="150" r="105" {...outline} />
      {MAP_SENSORS.map(({ cx, cy, side }, i) => {
        const level = levels[i];
        const Icon = LEVEL_ICON[level];
        const left = side === "left";
        const edge = left ? 124 : 396;                 // where the label column starts
        const anchor = left ? "end" : "start";
        const textX = left ? edge : edge;
        const pillX = left ? edge - 100 : edge;
        return (
          <g key={CHANNELS[i]}>
            <line x1={left ? cx - 17 : cx + 17} y1={cy} x2={left ? edge + 12 : edge - 12} y2={cy} stroke="#D9DBEA" strokeOpacity=".45" strokeWidth="1.5" />
            {level === "waiting" && <circle className="eeg-halo" cx={cx} cy={cy} r="15" fill="none" stroke="#D9DBEA" strokeWidth="2" />}
            {/* White ring: it keeps a blue or red fill readable on navy. */}
            <circle cx={cx} cy={cy} r="15" fill={level === "waiting" ? "#191A2E" : LEVEL_COLOR[level]} stroke="#FFFFFF" strokeWidth="3" strokeDasharray={level === "waiting" ? "4 3" : undefined} />
            {level !== "waiting" && <Icon x={cx - 9} y={cy - 9} width={18} height={18} color="#FFFFFF" strokeWidth={3} aria-hidden="true" />}
            <text x={textX} y={cy - 16} textAnchor={anchor} fontSize="16" fontWeight="700" fill="#FFFFFF" fontFamily={SVG_FONT}>{CHANNELS[i]}</text>
            <text x={textX} y={cy + 2} textAnchor={anchor} fontSize="16" fill="#D9DBEA" fontFamily={SVG_FONT}>{WHERE[i]}</text>
            <rect x={pillX} y={cy + 10} width="100" height="30" rx="15" fill="#FFFFFF" />
            <Icon x={pillX + 10} y={cy + 17} width={16} height={16} color={LEVEL_COLOR[level]} strokeWidth={3} aria-hidden="true" />
            <text x={pillX + 32} y={cy + 30} fontSize="16" fontWeight="700" fill="#1B1D26" fontFamily={SVG_FONT}>{LEVEL_WORD[level]}</text>
          </g>
        );
      })}
      <text x="260" y="292" textAnchor="middle" fontSize="16" fontWeight="700" fill="#D9DBEA" fontFamily={SVG_FONT}>Back</text>
    </svg>
  );
}

/* ───────────────────────── Live signal ───────────────────────── */

/** Live trace of the last 5 seconds, 1 Hz high-pass for display only (the CSV holds the raw signal). */
function SignalCard({ signal, connected }: { signal: { current: SignalBuffer }; connected: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(100);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    // Under reduced motion the trace refreshes once a second instead of scrolling continuously.
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0, last = 0;
    const N = SAMPLE_RATE * WINDOW_SEC;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (calm.matches && now - last < 1000) return;
      const sig = signal.current;
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth, H = canvas.clientHeight;
      if (!W || !H) return;
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); sig.dirty = true;
      }
      if (!sig.dirty) return;
      sig.dirty = false; last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const laneH = H / 4, left = 64, plotW = W - left - 12, uv = scaleRef.current;

      ctx.strokeStyle = "#E2E0DA"; ctx.lineWidth = 1;
      for (let s = 1; s < WINDOW_SEC; s++) {
        const x = left + (s / WINDOW_SEC) * plotW;
        ctx.beginPath(); ctx.moveTo(x, 2); ctx.lineTo(x, H - 2); ctx.stroke();
      }
      for (let ch = 0; ch < 4; ch++) {
        const mid = laneH * (ch + 0.5), k = (laneH / 2 - 2) / uv;
        ctx.strokeStyle = "#E2E0DA"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(left, mid); ctx.lineTo(W - 12, mid); ctx.stroke();
        ctx.fillStyle = CHANNEL_COLORS[ch];
        ctx.font = `700 15px ${SVG_FONT}`;
        ctx.textBaseline = "middle";
        ctx.fillText(CHANNELS[ch], 12, mid);
        ctx.strokeStyle = CHANNEL_COLORS[ch]; ctx.lineWidth = 1.6; ctx.lineJoin = "round";
        ctx.beginPath();
        let pen = false;
        for (let i = 0; i < N; i++) {
          const v = sig.ring[ch][(sig.pos + i) % N];
          if (!Number.isFinite(v)) { pen = false; continue; }
          const x = left + (i / (N - 1)) * plotW;
          const y = mid - Math.max(-laneH / 2 + 1, Math.min(laneH / 2 - 1, v * k));
          if (pen) ctx.lineTo(x, y); else { ctx.moveTo(x, y); pen = true; }
        }
        ctx.stroke();
      }
    };
    signal.current.dirty = true;
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [signal]);

  return (
    <section aria-labelledby="eeg-signal-title" className={`rounded-2xl border border-[#E2E0DA] bg-white p-5 ${enter}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="eeg-signal-title" className="text-xl leading-[1.25] text-[#1B1D26]" style={display}>Live signal</h2>
        <label className="inline-flex items-center gap-3 text-[0.9375rem] font-bold text-[#1B1D26]">
          Scale
          <select value={scale} onChange={(e) => { setScale(Number(e.target.value)); signal.current.dirty = true; }}
            className={`h-10 rounded-lg border border-[#8A8F9C] bg-white px-3 text-[0.9375rem] font-medium text-[#1B1D26] ${focus}`}>
            <option value={50}>±50 µV</option><option value={100}>±100 µV</option><option value={200}>±200 µV</option>
          </select>
        </label>
      </div>
      <div className={`relative mt-3 overflow-hidden rounded-xl border border-[#E2E0DA] bg-white h-24`}>
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" role="img" aria-label={`Live EEG traces for ${CHANNELS.join(", ")}, last ${WINDOW_SEC} seconds`} />
        {!connected && (
          <p className="absolute inset-0 grid place-items-center p-3 text-center text-base text-[#4A4F5C]">The signal appears here after you pair the headband.</p>
        )}
      </div>
    </section>
  );
}

/* ───────────────────────── Recording: a focused view ───────────────────────── */

function CountdownRing({ progress, secondsLeft, size = 200, stroke = 12 }: { progress: number; secondsLeft: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="progressbar" aria-label={`${secondsLeft} seconds left`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E1E2E7" strokeWidth={stroke} />
        {/* The blue arc is the time left, so it drains as the recording runs. */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#00538A" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * progress}
          className={`transition-[stroke-dashoffset] duration-[250ms] motion-reduce:transition-none ${easeOut}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[3.5rem] leading-none tabular-nums text-[#1B1D26]" style={display}>{fmt(secondsLeft)}</span>
        <span className="mt-2 text-[0.9375rem] font-bold text-[#4A4F5C]">left</span>
      </div>
    </div>
  );
}

function SensorChip({ name, level }: { name: string; level: Level }) {
  const Icon = LEVEL_ICON[level];
  const look = level === "poor" ? "border-[#B42318] bg-[#FDECEA] text-[#7A1A12]"
    : level === "good" ? "border-transparent bg-[#CFE4FF] text-[#00538A]"
    : level === "fair" ? "border-transparent bg-[#FFDEB5] text-[#835500]"
    : "border-[#E2E0DA] bg-white text-[#4A4F5C]";
  return (
    <li className={`inline-flex h-10 items-center gap-2 rounded-full border px-3 text-[0.9375rem] font-bold transition-[background-color,border-color,color] duration-200 motion-reduce:transition-none ${easeOut} ${look}`}>
      <Icon className="w-4 h-4 shrink-0" strokeWidth={3} aria-hidden="true" />
      <span className="tabular-nums">{name}</span>
      <span>{LEVEL_WORD[level]}</span>
    </li>
  );
}

function RecordingView({ eeg, levels, banners }: { eeg: Eeg; levels: Level[]; banners: ReactNode }) {
  const [showSignal, setShowSignal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const poor = levels.map((l, i) => (l === "poor" ? i : -1)).filter((i) => i >= 0);
  return (
    <div className={`grid justify-items-center gap-4 ${enter}`}>
      <div className="w-full empty:hidden">{banners}</div>
      <CountdownRing progress={eeg.progress} secondsLeft={eeg.secondsLeft} />
      <p className="text-[18px] leading-[1.6] text-[#1B1D26]" style={reading}>Sit still and relax.</p>

      <ul aria-label="Sensor contact" className="flex flex-wrap justify-center gap-2">
        {CHANNELS.map((c: string, i: number) => <SensorChip key={c} name={c} level={levels[i]} />)}
      </ul>
      {poor.length > 0 && (
        <ul role="status" className="grid gap-1 text-base leading-snug text-[#7A1A12]">
          {poor.map((i) => (
            <li key={i} className="flex items-start gap-2"><TriangleAlert className="w-5 h-5 shrink-0 text-[#B42318]" aria-hidden="true" /><span><b>{CHANNELS[i]}:</b> {FIX[i]}</span></li>
          ))}
        </ul>
      )}

      {showSignal && <div className="w-full"><SignalCard signal={eeg.signal} connected /></div>}

      <div className="flex w-full items-center justify-between gap-3">
        <button onClick={() => setShowSignal((v) => !v)} aria-expanded={showSignal}
          className={`inline-flex h-11 items-center gap-1.5 rounded-lg px-3 text-[0.9375rem] font-bold text-[#00538A] hover:bg-[#CFE4FF] active:scale-[0.97] motion-reduce:active:scale-100 transition-[background-color,scale] duration-150 ${easeOut} ${focus}`}>
          {showSignal ? "Hide signal" : "Show signal"}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 motion-reduce:transition-none ${easeOut} ${showSignal ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        {confirming ? (
          <span className="flex items-center gap-1 text-[0.9375rem] font-bold text-[#1B1D26]">
            Delete this recording?
            <button onClick={() => { setConfirming(false); void eeg.cancelRecording(); }} className={`h-11 rounded-lg px-3 text-[#B42318] hover:bg-[#FDECEA] ${focus}`}>Delete</button>
            <button onClick={() => setConfirming(false)} className={`h-11 rounded-lg px-3 text-[#00538A] hover:bg-[#CFE4FF] ${focus}`}>Keep recording</button>
          </span>
        ) : (
          <button onClick={() => setConfirming(true)} className={`h-11 rounded-lg px-3 text-[0.9375rem] font-bold text-[#4A4F5C] underline underline-offset-4 hover:text-[#B42318] ${focus}`}>Cancel recording</button>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── Done ───────────────────────── */

function DoneView({ eeg, result, banners, onBack }: { eeg: Eeg; result: { completed: boolean; recordedSec: number }; banners: ReactNode; onBack: () => void }) {
  const ok = result.completed;
  return (
    <div className="grid gap-4">
      <div className="empty:hidden">{banners}</div>
      <section className={`rounded-2xl border border-[#E2E0DA] bg-white px-6 py-12 text-center sm:px-8 ${enter}`}>
        <span className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${ok ? "bg-[#CFE4FF] text-[#00538A]" : "bg-[#FDECEA] text-[#B42318]"}`}>
          {ok ? <CircleCheck className="w-8 h-8" aria-hidden="true" /> : <TriangleAlert className="w-8 h-8" aria-hidden="true" />}
        </span>
        <h2 className="mt-6 text-[2rem] leading-[1.2] text-[#1B1D26]" style={display}>{ok ? "Baseline recorded" : "Recording stopped early"}</h2>
        <div className="mx-auto mt-3 max-w-[46ch] space-y-1 text-lg leading-[1.6] text-[#4A4F5C]" style={reading}>
          <p>{ok ? `${Math.round(result.recordedSec)} seconds recorded.` : `Stopped at ${fmt(result.recordedSec)} of ${fmt(BASELINE_SECONDS)} because the headband disconnected. What was recorded is kept.`}</p>
          {ok && !eeg.exported && <p>Export the CSV before you go. ALSense can’t upload recordings yet.</p>}
          {ok && eeg.exported && <p>The CSV is saved.</p>}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {ok ? (
            <>
              <button onClick={onBack} className={primaryButton}>Back to pre-test</button>
              <button onClick={eeg.exportCsv} className={secondaryButton}>Export CSV</button>
            </>
          ) : (
            <>
              <button onClick={eeg.startRecording} disabled={eeg.conn.state !== "connected"} className={primaryButton}>Record again</button>
              <button onClick={eeg.exportCsv} className={secondaryButton}>Export CSV</button>
              <button onClick={onBack} className={`h-12 rounded-xl px-4 text-[0.9375rem] font-bold text-[#00538A] hover:bg-[#CFE4FF] ${focus}`}>Back to pre-test</button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
