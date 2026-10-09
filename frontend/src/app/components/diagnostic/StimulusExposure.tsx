import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, Info, LoaderCircle, Pause, Play } from "lucide-react";
import { AttemptShell } from "./PretestAttempts";
import { primaryButton, secondaryButton } from "./StrandTestCard";
import { useEegSession, type Level } from "../../features/eeg/useEegSession";
import { useEegSave } from "../../features/eeg/useEegSave";
import { DEMO_UPLOAD_ALLOWED, EXPOSURE_RECORD_END, EXPOSURE_RECORD_SECONDS, EXPOSURE_RECORD_START } from "../../features/eeg/constants";
import { getStimulusUrl } from "../../../lib/api/eegSessions";
import { SectionError } from "../shared/SectionError";
import { Banner, DemoForce, SensorCard, Rail, applyDemoForce, css, display, easeOut, enter, focus, fmt, reading } from "./BaselineEegRecording";

// Part V of Readiness Profiling, "Stimulus Content Exposure": the learner watches the stimulus video while the Muse 2 records.
// Same frame and sensor card as Part IV. The video's own clock drives the recording:
//   0 to START          the video plays, nothing is recorded;
//   START to END        recording starts by itself; it only keeps samples while the video is actually playing;
//   at END              the recording stops and is saved (type "exposed"); the video keeps playing to its end.
// The fit check is the same as Part IV: the facilitator can continue with a weak signal, so nobody is stuck here.
// There is no seek bar and seeking is undone, so the five minutes of samples are five minutes of watching.

type Stimulus = { status: "idle" | "loading" } | { status: "ready"; url: string } | { status: "error" };

export function StimulusExposure({ onClose, learnerId }: { onClose: () => void; learnerId: string | null }) {
  // "Start again" after the headband dropped mid-recording remounts the whole screen.
  const [attempt, setAttempt] = useState(0);
  return <ExposureScreen key={attempt} onClose={onClose} learnerId={learnerId} onRestart={() => setAttempt((n) => n + 1)} />;
}

function ExposureScreen({ onClose, learnerId, onRestart }: { onClose: () => void; learnerId: string | null; onRestart: () => void }) {
  const eeg = useEegSession({ learnerId, seconds: EXPOSURE_RECORD_SECONDS, kind: "exposed" });
  const save = useEegSave("exposed", eeg.markSaved);
  const { conn, recording, result } = eeg;
  const lost = conn.state === "disconnected" && conn.reason === "lost";

  const [demoForce, setDemoForce] = useState<DemoForce>("live");
  const showDemoTools = import.meta.env.DEV && eeg.source === "demo";
  const levels: Level[] = showDemoTools ? applyDemoForce(eeg.levels, demoForce) : eeg.levels;
  const ready = levels.filter((l) => l === "good" || l === "fair").length;

  const mode = result ? (result.completed ? "watching" : "stopped") : eeg.step === 4 ? "watching" : "setup";

  // ── The stimulus URL ──
  const [stim, setStim] = useState<Stimulus>({ status: "idle" });
  const loadStimulus = useCallback(async () => {
    setStim({ status: "loading" });
    try { setStim({ status: "ready", url: await getStimulusUrl() }); }
    catch { setStim({ status: "error" }); }
  }, []);
  useEffect(() => { if (mode === "watching" && stim.status === "idle") void loadStimulus(); }, [mode, stim.status, loadStimulus]);

  // ── The video ──
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTime = useRef(0);
  const recStarted = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [everPlayed, setEverPlayed] = useState(false);
  const [time, setTime] = useState(0);
  const [ended, setEnded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    if (!v.seeking) lastTime.current = v.currentTime;
    setTime(v.currentTime);
    if (v.currentTime >= EXPOSURE_RECORD_START && !recStarted.current && conn.state === "connected") {
      recStarted.current = true;
      void eeg.startRecording();
    }
    // The recording stops by itself at the planned sample count; this is only a safety net.
    if (v.currentTime >= EXPOSURE_RECORD_END + 2 && recording) void eeg.stopNow();
  };
  // No scrubbing: any jump is undone.
  const onSeeking = () => {
    const v = videoRef.current;
    if (v && Math.abs(v.currentTime - lastTime.current) > 0.5) v.currentTime = lastTime.current;
  };
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => {}); else v.pause();
  };
  // A paused or stalled video keeps no samples.
  const onPlaying = () => { setPlaying(true); setEverPlayed(true); eeg.setCollecting(true); };
  const onStopped = () => { setPlaying(false); eeg.setCollecting(false); };
  const onEnded = () => { setPlaying(false); setEnded(true); eeg.setCollecting(false); if (recording) void eeg.stopNow(); };

  // The recording is saved once, as soon as it is complete.
  const demoNotSaved = eeg.source === "demo" && !DEMO_UPLOAD_ALLOWED;
  useEffect(() => {
    if (!result?.completed || demoNotSaved) return;
    const snap = eeg.snapshot();
    if (snap) save.begin(snap.csv, snap.startedAt);
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  // If the recording stopped early, the video stops too.
  useEffect(() => { if (mode === "stopped") videoRef.current?.pause(); }, [mode]);

  const handleExit = () => {
    if (recording && !window.confirm("Leave now? The recording will stop and will not be saved.")) return;
    if (save.state.status === "saving" && !window.confirm("Your recording is still being saved. Leave anyway?")) return;
    onClose();
  };

  const banners = (
    <div className="grid gap-3 empty:hidden">
      {conn.state === "reconnecting" && (
        <Banner tone="error" role="status" icon={<LoaderCircle className="w-5 h-5 motion-safe:animate-spin" aria-hidden="true" />}>
          The connection to the headband dropped. Reconnecting ({conn.reason}).
        </Banner>
      )}
      {lost && mode !== "stopped" && (
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

  // What the learner reads under the video. Calm sentences, no clock.
  const inWindow = time >= EXPOSURE_RECORD_START;
  let line: ReactNode;
  if (!everPlayed) line = "When you are ready, press Play. Sit comfortably and watch.";
  else if (demoNotSaved && result?.completed) line = "Demo recording finished. It uses the demo signal, so it is not saved.";
  else if (save.state.status === "saved") line = "Saved, you can keep watching.";
  else if (save.state.status === "saving") line = "Saving your recording. You can keep watching.";
  else if (save.state.status === "failed") line = null;
  else if (ended) line = "The video has ended.";
  else if (!inWindow) line = "Watch the video. Recording will start soon.";
  else if (recording && !playing) line = "Paused. Recording waits until the video plays again.";
  else if (recording) line = "Recording. Just keep watching.";
  else line = "Just keep watching.";

  return (
    <AttemptShell title="Readiness Profiling · Part V: Stimulus Content Exposure" onClose={handleExit} exitLabel="Exit" compact maxWidth={mode === "stopped" ? "max-w-3xl" : "max-w-[90rem]"}>
      <style>{css}</style>
      <h1 className="sr-only">Stimulus Content Exposure</h1>

      {mode === "setup" && (
        <div className="grid gap-4">
          {banners}
          <div className="grid gap-6 xl:grid-cols-[32rem_minmax(0,1fr)] xl:items-start">
            <Rail eeg={eeg} levels={levels} ready={ready} finalStep={{ name: "Watch the video", body: null }} />
            <SensorCard eeg={eeg} levels={levels} />
          </div>
        </div>
      )}

      {mode === "watching" && (
        <div className={`grid gap-4 ${enter}`}>
          {banners}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_34rem] xl:items-start">
            <section aria-label="Stimulus video" className="min-w-0 rounded-2xl border border-[#E2E0DA] bg-white p-4">
              {stim.status === "error" ? (
                <div className="py-10 px-2"><SectionError message="The video could not be loaded right now. Check the internet connection and try again." onRetry={loadStimulus} /></div>
              ) : stim.status === "ready" ? (
                <div className="relative aspect-video overflow-hidden rounded-xl bg-[#1B1D26]">
                  <video
                    key={stim.url}
                    ref={videoRef}
                    src={stim.url}
                    aria-label="Stimulus video"
                    className="h-full w-full"
                    playsInline
                    preload="auto"
                    disablePictureInPicture
                    controlsList="nodownload noremoteplayback"
                    onContextMenu={(e) => e.preventDefault()}
                    onTimeUpdate={onTimeUpdate}
                    onSeeking={onSeeking}
                    onPlaying={onPlaying}
                    onPause={onStopped}
                    onWaiting={onStopped}
                    onEnded={onEnded}
                    onError={() => setVideoError(true)}
                  />
                </div>
              ) : (
                <div role="status" className="py-16 flex items-center justify-center gap-3 text-lg text-[#4A4F5C]" style={reading}>
                  <LoaderCircle className="w-6 h-6 text-[#00538A] motion-safe:animate-spin" aria-hidden="true" /> Getting the video ready…
                </div>
              )}

              {videoError && (
                <div className="mt-4"><SectionError message="This video can't play right now." onRetry={() => { setVideoError(false); void loadStimulus(); }} /></div>
              )}

              {stim.status === "ready" && !videoError && (
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <button onClick={togglePlay} disabled={ended} className={`${primaryButton} gap-2`}>
                    {playing ? <Pause className="w-5 h-5" aria-hidden="true" /> : <Play className="w-5 h-5" aria-hidden="true" />}
                    {playing ? "Pause" : "Play"}
                  </button>
                  {line && <p role="status" className="flex-1 min-w-[16rem] text-[18px] leading-[1.6] text-[#1B1D26]" style={reading}>{line}</p>}
                </div>
              )}

              {save.state.status === "failed" && (
                <div className="mt-4">
                  <SectionError message={save.state.message} onRetry={save.retry} />
                </div>
              )}

              {save.state.status === "saved" && (
                <div className="mt-4 flex justify-end">
                  <button onClick={onClose} className={secondaryButton}>Back to Readiness Profiling</button>
                </div>
              )}
            </section>
            <SensorCard eeg={eeg} levels={levels} />
          </div>
        </div>
      )}

      {mode === "stopped" && (
        <section className={`rounded-2xl border border-[#E2E0DA] bg-white px-6 py-12 text-center sm:px-8 ${enter}`}>
          <h2 className="text-[2rem] leading-[1.2] text-[#1B1D26]" style={display}>The recording stopped early</h2>
          <div className="mx-auto mt-3 max-w-[46ch] text-lg leading-[1.6] text-[#4A4F5C]" style={reading} role="status">
            <p>The headband disconnected, so this recording was not saved. Check that it is on and nearby, then start again.</p>
          </div>
          {banners}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button onClick={onRestart} className={primaryButton}>Start again</button>
            <button onClick={onClose} className={`h-12 rounded-xl px-4 text-[0.9375rem] font-bold text-[#00538A] hover:bg-[#CFE4FF] ${focus}`}>Back to Readiness Profiling</button>
          </div>
        </section>
      )}

      {import.meta.env.DEV && showDemoTools && (
        <label className="fixed bottom-4 left-4 z-20 flex items-center gap-2 rounded-lg border border-dashed border-[#8A8F9C] bg-white px-3 py-2 text-[0.9375rem] font-bold text-[#1B1D26]">
          Demo sensors
          <select value={demoForce} onChange={(e) => setDemoForce(e.target.value as DemoForce)}
            className={`h-9 rounded-md border border-[#8A8F9C] bg-white px-2 text-[0.9375rem] font-medium ${focus} ${easeOut}`}>
            <option value="live">Live demo signal</option>
            <option value="tp9">TP9 Poor</option>
            <option value="af7">AF7 Poor</option>
            <option value="good">All Good</option>
          </select>
        </label>
      )}
      {eeg.toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 max-w-[calc(100vw-2rem)] rounded-xl bg-[#1B1D26] px-5 py-3 text-[0.9375rem] font-bold text-white">
          {eeg.toast}
        </div>
      )}
    </AttemptShell>
  );
}
