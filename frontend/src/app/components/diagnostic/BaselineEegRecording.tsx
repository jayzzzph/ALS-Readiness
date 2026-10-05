import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, BatteryMedium, Check, Info, LoaderCircle } from "lucide-react";
import { AttemptShell } from "./PretestAttempts";
import { primaryButton, secondaryButton } from "./StrandTestCard";
import { useEegSession, WINDOW_SEC, type ConnState, type Level, type SignalBuffer } from "../../features/eeg/useEegSession";
import { CHANNELS, SAMPLE_RATE } from "../../features/eeg/muse2-ble.js";

// Part IV of the pre-test flow: a resting baseline recorded with the Muse 2 headband, run by the
// facilitator. Connects over Web Bluetooth (Chrome or Edge), checks the fit, records a fixed length
// that stops by itself, and exports the recording as CSV. The recording length is fixed, taken from
// the screen this replaces. Type roles and colors follow DESIGN.md.

export const BASELINE_RECORD_SECONDS = 15;

const display = { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 } as const;
const reading = { fontFamily: "'Atkinson Hyperlegible', 'DM Sans', system-ui, sans-serif" } as const;
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A]";
const easeOut = "ease-[cubic-bezier(0.23,1,0.32,1)]";
const cardTitle = "text-2xl leading-[1.25]";
const label = "text-[0.9375rem] font-bold tracking-[0.01em]";

/** One color per sensor, each at least 4.5:1 on white (6.4, 5.8, 8.0, 6.4) so the trace labels read. */
const CHANNEL_COLORS = ["#0E6B5C", "#A8480A", "#7A2E8E", "#2B5EA7"];
const WHERE = ["Behind left ear", "Left forehead", "Right forehead", "Behind right ear"];

// Readiness scale from DESIGN.md: blue = good, amber ink = fair, red = poor. The word always comes with it.
const LEVEL_WORD: Record<Level, string> = { waiting: "Waiting", good: "Good", fair: "Fair", poor: "Poor" };
const LEVEL_COLOR: Record<Level, string> = { waiting: "#6B7080", good: "#00538A", fair: "#835500", poor: "#B42318" };
const LEVEL_GLYPH: Record<Level, string> = { waiting: "", good: "✓", fair: "~", poor: "!" };

const CONN_WORD: Record<ConnState, string> = {
  idle: "Not connected", connecting: "Connecting…", connected: "Connected", reconnecting: "Reconnecting…", disconnected: "Disconnected",
};
const CONN_COLOR: Record<ConnState, string> = {
  idle: "#6B7080", connecting: "#835500", connected: "#00538A", reconnecting: "#B42318", disconnected: "#B42318",
};

const STEP_NAMES = ["Put on the headband", "Connect the Muse 2", "Check the fit", "Record"];

// Motion only where the user allows it: the waiting halo and the recording dot.
const css = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes eeg-halo { from { transform: scale(1); opacity: .9; } to { transform: scale(1.9); opacity: 0; } }
  .eeg-halo { animation: eeg-halo 1.6s cubic-bezier(0.23, 1, 0.32, 1) infinite; transform-box: fill-box; transform-origin: center; }
}
`;

const fmt = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

export function BaselineEegRecording({ onClose, onComplete, learnerId }: { onClose: () => void; onComplete: () => void; learnerId: string | null }) {
  const eeg = useEegSession({ learnerId, seconds: BASELINE_RECORD_SECONDS });
  const { step, conn, recording, result } = eeg;
  const lost = conn.state === "disconnected" && conn.reason === "lost";

  const handleExit = () => {
    if (recording && !window.confirm("Leave now? The recording will stop. What was recorded stays on this computer.")) return;
    onClose();
  };

  return (
    <AttemptShell title="Part IV: Baseline EEG recording" onClose={handleExit} exitLabel="Exit" wide>
      <style>{css}</style>
      <h1 className="text-[2rem] leading-[1.2] text-[#1B1D26]" style={display}>Baseline recording</h1>
      <p className="mt-2 max-w-[40rem] text-lg leading-relaxed text-[#4A4F5C]" style={reading}>
        Sit still while the Muse 2 headband records a {BASELINE_RECORD_SECONDS}-second resting baseline.
      </p>

      <div className="mt-6 grid gap-4 empty:hidden">
        {conn.state === "reconnecting" && (
          <Banner tone="error" role="status" icon={<LoaderCircle className="w-5 h-5 motion-safe:animate-spin" aria-hidden="true" />}>
            The connection to the headband dropped. Reconnecting ({conn.reason}).
          </Banner>
        )}
        {lost && (
          <Banner tone="error" role="alert" icon={<AlertCircle className="w-5 h-5" aria-hidden="true" />}
            action={<button onClick={() => eeg.pair(false)} className={primaryButton}>Connect Muse 2</button>}>
            The headband disconnected. Check that it is on and nearby, then connect it again.
          </Banner>
        )}
        {eeg.recovered && (
          <Banner tone="info" role="status" icon={<Info className="w-5 h-5" aria-hidden="true" />}
            action={<>
              <button onClick={eeg.exportRecovered} className={secondaryButton}>Export CSV</button>
              <button onClick={eeg.discardRecovered} className={secondaryButton}>Discard</button>
            </>}>
            A recording from {eeg.recovered.when} ({fmt(eeg.recovered.duration)}) was not exported. It is still on this computer.
          </Banner>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <StepCard eeg={eeg} lost={lost} onFinish={onComplete} />
        <div className="grid gap-6 content-start min-w-0">
          <SensorCard eeg={eeg} />
          <SignalCard signal={eeg.signal} connected={conn.state === "connected" || conn.state === "reconnecting"} />
        </div>
      </div>

      {/* Quiet announcements for screen readers. */}
      <p className="sr-only" role="status" aria-live="polite">
        {recording ? "Recording started." : result ? (result.completed ? "Recording complete." : "Recording stopped early.") : ""}
      </p>
      {eeg.toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 max-w-[calc(100vw-2rem)] rounded-xl bg-[#1B1D26] px-5 py-3 text-[0.9375rem] font-bold text-white">
          {eeg.toast}
        </div>
      )}
    </AttemptShell>
  );
}

function Banner({ tone, icon, action, role, children }: { tone: "error" | "info"; icon: ReactNode; action?: ReactNode; role: "alert" | "status"; children: ReactNode }) {
  const palette = tone === "error" ? "border-[#B42318] bg-[#FDECEA] text-[#7A1A12]" : "border-[#E2E0DA] bg-[#F2F1ED] text-[#1B1D26]";
  return (
    <div role={role} className={`flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border p-5 ${palette}`}>
      <span className="shrink-0" aria-hidden="true">{icon}</span>
      <p className="flex-1 min-w-[16rem] text-lg leading-snug" style={reading}>{children}</p>
      {action && <div className="flex flex-wrap gap-3">{action}</div>}
    </div>
  );
}

type Eeg = ReturnType<typeof useEegSession>;

function StepCard({ eeg, lost, onFinish }: { eeg: Eeg; lost: boolean; onFinish: () => void }) {
  const { step, recording, result } = eeg;
  const finished = !!result && !recording;
  const body = (text: ReactNode) => <p className="mt-3 text-lg leading-relaxed text-[#1B1D26]" style={reading}>{text}</p>;

  let content: ReactNode;
  if (finished && result) {
    content = (
      <>
        <div className="flex items-center gap-3">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-white ${result.completed ? "bg-[#00538A]" : "bg-[#B42318]"}`}>
            {result.completed ? <Check className="w-5 h-5" aria-hidden="true" /> : <AlertCircle className="w-5 h-5" aria-hidden="true" />}
          </span>
          <h2 className={`${cardTitle} text-[#1B1D26]`} style={display}>{result.completed ? "Recording complete" : "Recording stopped early"}</h2>
        </div>
        {body(result.completed
          ? `${fmt(result.recordedSec)} recorded.`
          : `Stopped at ${fmt(result.recordedSec)} of ${fmt(BASELINE_RECORD_SECONDS)} because the headband disconnected. What was recorded is kept.`)}
        <div className="mt-6 flex flex-wrap gap-3">
          {result.completed ? (
            <>
              <button onClick={eeg.exportCsv} className={eeg.exported ? secondaryButton : primaryButton}>Export CSV</button>
              <button onClick={onFinish} className={eeg.exported ? primaryButton : secondaryButton}>Finish pre-test</button>
            </>
          ) : (
            <>
              <button onClick={eeg.startRecording} disabled={eeg.conn.state !== "connected"} className={primaryButton}>Record again</button>
              <button onClick={eeg.exportCsv} className={secondaryButton}>Export CSV</button>
            </>
          )}
        </div>
        {result.completed && !eeg.exported && (
          <p className="mt-4 text-lg leading-relaxed text-[#4A4F5C]" style={reading}>
            Export the CSV before you finish. ALSense can’t upload recordings yet.
          </p>
        )}
      </>
    );
  } else if (recording) {
    content = (
      <>
        <h2 className={`${cardTitle} text-[#1B1D26]`} style={display}>Recording</h2>
        {body("Stay relaxed and still. The recording stops by itself.")}
        <p className="mt-6 flex items-baseline gap-3 tabular-nums">
          <span className="text-[3rem] leading-none text-[#1B1D26]" style={display} aria-label={`${eeg.secondsLeft} seconds left`}>{fmt(eeg.secondsLeft)}</span>
          <span className="inline-flex items-center gap-2 text-[0.9375rem] font-bold text-[#B42318]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#B42318] motion-safe:animate-pulse" aria-hidden="true" /> Recording, time left
          </span>
        </p>
        <div role="progressbar" aria-label="Recording progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(eeg.progress * 100)}
          className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#E1E2E7]">
          <div className={`h-full rounded-full bg-[#00538A] transition-[width] duration-[250ms] motion-reduce:transition-none ${easeOut}`} style={{ width: `${eeg.progress * 100}%` }} />
        </div>
        <div className="mt-6">
          <button onClick={eeg.cancelRecording} className={`${secondaryButton} border-[#B42318]! text-[#B42318]! hover:bg-[#FDECEA]!`}>Cancel recording</button>
        </div>
      </>
    );
  } else if (step === 1) {
    content = (
      <>
        <h2 className={`${cardTitle} text-[#1B1D26]`} style={display}>Put on the headband</h2>
        {body("Turn on the Muse 2 until its lights blink. Rest the band on the forehead, above the eyebrows, and tuck the rubber ear pieces behind both ears.")}
        <div className="mt-6"><button onClick={eeg.continueFromStep1} className={primaryButton}>The headband is on</button></div>
      </>
    );
  } else if (step === 2) {
    const note = eeg.connectNote === "unsupported"
      ? "This browser can’t connect to Bluetooth devices. Open this page in Chrome or Edge on a laptop or desktop. Phones and iPads aren’t supported."
      : eeg.connectNote === "cancelled" ? "No device was chosen. Press Connect Muse 2 to try again." : eeg.connectNote;
    const connecting = eeg.conn.state === "connecting";
    content = (
      <>
        <h2 className={`${cardTitle} text-[#1B1D26]`} style={display}>Connect the Muse 2</h2>
        {body("Keep the headband within 1 meter of this computer. Choose the device named “Muse” in the window that opens.")}
        {note && !lost && (
          <p role="alert" className="mt-4 flex items-start gap-3 rounded-xl border border-[#B42318] bg-[#FDECEA] p-4 text-lg leading-snug text-[#7A1A12]" style={reading}>
            <AlertCircle className="w-5 h-5 shrink-0 mt-1" aria-hidden="true" /> {note}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button onClick={() => eeg.pair(false)} disabled={connecting || eeg.connectNote === "unsupported"} aria-busy={connecting} className={`${primaryButton} gap-2`}>
            {connecting && <LoaderCircle className="w-5 h-5 motion-safe:animate-spin" aria-hidden="true" />}
            {connecting ? "Connecting…" : "Connect Muse 2"}
          </button>
          {import.meta.env.DEV && <button onClick={() => eeg.pair(true)} disabled={connecting} className={secondaryButton}>Use a demo signal</button>}
        </div>
      </>
    );
  } else if (step === 3) {
    content = (
      <>
        <h2 className={`${cardTitle} text-[#1B1D26]`} style={display}>Check the fit</h2>
        {body("Wait until every sensor says Good or Fair. If one says Poor, move hair out of the way or dampen the sensor slightly.")}
        <p className="mt-4 text-lg font-bold text-[#1B1D26] tabular-nums" style={reading} aria-live="polite">{eeg.ready} of 4 sensors ready</p>
        <div className="mt-6">
          <button onClick={eeg.skipFit} className={`${secondaryButton}`}>Continue with a weak signal</button>
        </div>
      </>
    );
  } else {
    content = (
      <>
        <h2 className={`${cardTitle} text-[#1B1D26]`} style={display}>Record</h2>
        {body(`Ask the learner to sit still and relax. The recording lasts ${BASELINE_RECORD_SECONDS} seconds and stops by itself.`)}
        {!eeg.fitReady && (
          <p className="mt-4 flex items-start gap-3 text-lg leading-snug text-[#7A1A12]" style={reading}>
            <AlertCircle className="w-5 h-5 shrink-0 mt-1 text-[#B42318]" aria-hidden="true" /> At least one sensor is not Good or Fair yet.
          </p>
        )}
        <div className="mt-6">
          <button onClick={eeg.startRecording} disabled={eeg.conn.state !== "connected"} className={primaryButton}>
            {eeg.fitReady ? `Start ${BASELINE_RECORD_SECONDS}-second recording` : `Record ${BASELINE_RECORD_SECONDS} seconds anyway`}
          </button>
        </div>
      </>
    );
  }

  const doneStep = finished || recording ? 4 : step;
  return (
    <section aria-label="Setup" className="rounded-2xl border border-[#E2E0DA] bg-white p-8">
      <p className="mb-4 text-[0.9375rem] font-bold uppercase tracking-[0.06em] text-[#4A4F5C]">Step {doneStep} of 4 · {STEP_NAMES[doneStep - 1]}</p>
      {content}
    </section>
  );
}

function LevelPill({ level }: { level: Level }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[0.9375rem] font-bold text-[#1B1D26]">
      <span className="h-2.5 w-2.5 rounded-full" style={level === "waiting" ? { border: `2px solid ${LEVEL_COLOR.waiting}` } : { background: LEVEL_COLOR[level] }} aria-hidden="true" />
      {LEVEL_WORD[level]}
    </span>
  );
}

/** Navy is reserved for the sensor: connection, battery, and contact quality. */
function SensorCard({ eeg }: { eeg: Eeg }) {
  const { conn, levels } = eeg;
  const connected = conn.state === "connected";
  return (
    <section aria-labelledby="eeg-sensor-title" className="rounded-2xl bg-[#1C1D33] p-8 text-white">
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
            {connected ? `Connected to ${conn.name}` : CONN_WORD[conn.state]}
          </span>
        </div>
      </div>
      <p className="mt-3 text-lg leading-relaxed text-[#D9DBEA]" style={reading}>Seen from above, front of the head at the top.</p>

      <div className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-6">
        <HeadMap levels={levels} />
        <ul className="min-w-[14rem] flex-1 divide-y divide-white/20">
          {CHANNELS.map((c: string, i: number) => (
            <li key={c} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-[0.9375rem] font-bold tabular-nums">{c}</p>
                <p className="text-[0.9375rem] text-[#D9DBEA]">{WHERE[i]}</p>
              </div>
              <LevelPill level={levels[i]} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function HeadMap({ levels }: { levels: Level[] }) {
  const sensors = [[46, 186], [76, 81], [164, 81], [194, 186]];
  return (
    <svg viewBox="0 0 240 262" className="w-[240px] h-[262px] shrink-0" role="img" aria-label={`Head seen from above. ${CHANNELS.map((c: string, i: number) => `${c} ${LEVEL_WORD[levels[i]]}`).join(", ")}.`}>
      <text x="120" y="14" textAnchor="middle" fontSize="15" fontWeight="700" fill="#D9DBEA" fontFamily="'DM Sans', system-ui, sans-serif">Front</text>
      <path d="M108 42 L120 24 L132 42 Z" fill="#191A2E" stroke="#D9DBEA" strokeOpacity=".6" strokeWidth="2" />
      <ellipse cx="22" cy="146" rx="11" ry="24" fill="#191A2E" stroke="#D9DBEA" strokeOpacity=".6" strokeWidth="2" />
      <ellipse cx="218" cy="146" rx="11" ry="24" fill="#191A2E" stroke="#D9DBEA" strokeOpacity=".6" strokeWidth="2" />
      <circle cx="120" cy="142" r="100" fill="#191A2E" stroke="#D9DBEA" strokeOpacity=".6" strokeWidth="2" />
      <path d="M46 186 C 40 20, 200 20, 194 186" fill="none" stroke="#D9DBEA" strokeOpacity=".6" strokeWidth="3" strokeDasharray="2 6" strokeLinecap="round" />
      {sensors.map(([x, y], i) => {
        const level = levels[i];
        return (
          <g key={CHANNELS[i]}>
            {level === "waiting" && <circle className="eeg-halo" cx={x} cy={y} r="14" fill="none" stroke="#D9DBEA" strokeWidth="2" />}
            {/* White ring: it keeps the fill readable on navy (blue and red fills alone would not be). */}
            <circle cx={x} cy={y} r="14" fill={level === "waiting" ? "#191A2E" : LEVEL_COLOR[level]} stroke="#FFFFFF" strokeWidth="3" strokeDasharray={level === "waiting" ? "4 3" : undefined} />
            <text x={x} y={y + 6} textAnchor="middle" fontSize="16" fontWeight="700" fill="#FFFFFF" fontFamily="'DM Sans', system-ui, sans-serif" aria-hidden="true">{LEVEL_GLYPH[level]}</text>
            <text x={x} y={i === 1 || i === 2 ? y - 24 : y + 38} textAnchor="middle" fontSize="15" fontWeight="700" fill="#FFFFFF" fontFamily="'DM Sans', system-ui, sans-serif">{CHANNELS[i]}</text>
          </g>
        );
      })}
      <text x="120" y="258" textAnchor="middle" fontSize="15" fontWeight="700" fill="#D9DBEA" fontFamily="'DM Sans', system-ui, sans-serif">Back</text>
    </svg>
  );
}

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
        ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x, H - 4); ctx.stroke();
      }
      for (let ch = 0; ch < 4; ch++) {
        const mid = laneH * (ch + 0.5), k = (laneH / 2 - 4) / uv;
        ctx.strokeStyle = "#E2E0DA"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(left, mid); ctx.lineTo(W - 12, mid); ctx.stroke();
        ctx.fillStyle = CHANNEL_COLORS[ch];
        ctx.font = "700 15px 'DM Sans', system-ui, sans-serif";
        ctx.textBaseline = "middle";
        ctx.fillText(CHANNELS[ch], 12, mid);
        ctx.strokeStyle = CHANNEL_COLORS[ch]; ctx.lineWidth = 1.6; ctx.lineJoin = "round";
        ctx.beginPath();
        let pen = false;
        for (let i = 0; i < N; i++) {
          const v = sig.ring[ch][(sig.pos + i) % N];
          if (!Number.isFinite(v)) { pen = false; continue; }
          const x = left + (i / (N - 1)) * plotW;
          const y = mid - Math.max(-laneH / 2 + 2, Math.min(laneH / 2 - 2, v * k));
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
    <section aria-labelledby="eeg-signal-title" className="rounded-2xl border border-[#E2E0DA] bg-white p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="eeg-signal-title" className={`${cardTitle} text-[#1B1D26]`} style={display}>Live signal</h2>
        <label className={`inline-flex items-center gap-3 ${label} text-[#1B1D26]`}>
          Scale
          <select value={scale} onChange={(e) => { setScale(Number(e.target.value)); signal.current.dirty = true; }}
            className={`h-11 rounded-xl border border-[#8A8F9C] bg-white px-3 text-[0.9375rem] font-medium text-[#1B1D26] ${focus}`}>
            <option value={50}>±50 µV</option><option value={100}>±100 µV</option><option value={200}>±200 µV</option>
          </select>
        </label>
      </div>
      <div className="relative mt-5 h-[18rem] overflow-hidden rounded-xl border border-[#E2E0DA] bg-white">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" role="img" aria-label={`Live EEG traces for ${CHANNELS.join(", ")}, last ${WINDOW_SEC} seconds`} />
        {!connected && (
          <p className="absolute inset-0 grid place-items-center p-6 text-center text-lg text-[#4A4F5C]" style={reading}>
            The signal appears here after you connect the headband.
          </p>
        )}
      </div>
    </section>
  );
}
