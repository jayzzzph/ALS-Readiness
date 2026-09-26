import { useEffect, useState } from "react";
import { CheckCircle, ChevronLeft, ChevronRight, Radio, Wifi, WifiOff } from "lucide-react";

// Part IV of the pre-test flow: a short baseline EEG recording taken after the
// test proper (Parts I-III) using the Muse 2 headband. This reuses the visual
// language of the old standalone EEG Profiling page, but:
//  - no live waveform is drawn (device: Muse 2 headband, not NeuroSky MindWave)
//  - the waveform is replaced with a simple pulsing "recording" indicator
//  - the capture stage has a countdown timer (hardcoded duration for now)

const RECORD_DURATION_MS = 15_000; // hardcoded baseline recording length - 15s (testing)

const STAGES = [
  { id: "connect", label: "Connect Muse 2 Headband", duration: 0 },
  { id: "calibrate", label: "Calibrating Signal", duration: 3_000 },
  { id: "record", label: "Recording Baseline EEG", duration: RECORD_DURATION_MS },
  { id: "analyze", label: "Processing Baseline Data", duration: 4_000 },
  { id: "done", label: "Baseline Recording Complete", duration: 0 },
];

function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function BaselineEegRecording({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [connected, setConnected] = useState(false);
  const [stageIdx, setStageIdx] = useState(0); // 0=connect, 1=calibrate, 2=record, 3=analyze, 4=done
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!running || stageIdx === 0 || stageIdx === 4) return;
    const stage = STAGES[stageIdx];
    if (!stage.duration) return;

    const start = Date.now();
    const tick = setInterval(() => setElapsedMs(Date.now() - start), 200);
    const next = setTimeout(() => {
      clearInterval(tick);
      setStageIdx((i) => i + 1);
      setElapsedMs(0);
    }, stage.duration);

    return () => { clearInterval(tick); clearTimeout(next); };
  }, [running, stageIdx]);

  const handleConnect = () => {
    setConnected(true);
    setRunning(true);
    setStageIdx(1);
  };

  const stage = STAGES[stageIdx];
  const stagePct = stageIdx >= 1 && stageIdx <= 3 ? Math.min(100, Math.round((elapsedMs / stage.duration) * 100)) : stageIdx === 4 ? 100 : 0;
  const overallPct = stageIdx === 4 ? 100 : Math.round(((stageIdx - 1) / 3 + stagePct / 100 / 3) * 100);

  const recordTotalSec = RECORD_DURATION_MS / 1000;
  const recordRemainingSec = stageIdx === 2 ? Math.max(0, recordTotalSec - Math.floor(elapsedMs / 1000)) : recordTotalSec;

  return (
    <div className="min-h-screen bg-[#F0F4F8] p-4 sm:p-8">
      <main className="max-w-5xl mx-auto">
        <button onClick={onClose} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#3535C5] mb-5">
          <ChevronLeft className="w-4 h-4" /> Back to pre-test
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1a2f4a] rounded-2xl p-5 text-white flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-white/15 px-2 py-0.5 rounded font-mono">Part IV</span>
              <span className="text-blue-300 text-xs">Baseline EEG Recording — Muse 2 Headband</span>
            </div>
            <h2 className="mb-1" style={{ fontSize: "1.25rem", fontWeight: 700 }}>Baseline EEG Capture</h2>
            <p className="text-blue-200/70 text-sm">Put on the Muse 2 headband, then start the baseline recording session.</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${connected ? "bg-green-500/20 border border-green-500/40" : "bg-white/10 border border-white/20"}`}>
              {connected ? <Wifi className="w-7 h-7 text-green-400" /> : <WifiOff className="w-7 h-7 text-blue-300" />}
            </div>
            <span className={`text-xs font-semibold ${connected ? "text-green-400" : "text-blue-300"}`}>{connected ? "Connected" : "Not Connected"}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Left: Device + stages ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-gray-800 font-semibold text-sm mb-4">Muse 2 Headband</h3>
              <div className="flex items-center justify-center mb-4">
                <svg viewBox="0 0 120 70" className="w-28 h-16" fill="none">
                  {/* Curved band over the head */}
                  <path d="M 16 42 Q 60 -6 104 42" stroke="#D1D5DB" strokeWidth="6" strokeLinecap="round" fill="none" />
                  {/* Left paddle (behind-ear sensor module) */}
                  <rect x="3" y="30" width="17" height="28" rx="8.5" fill="#D1D5DB" />
                  {/* Right paddle (forehead / power module) */}
                  <rect x="100" y="30" width="17" height="28" rx="8.5" fill="#D1D5DB" />
                  {/* Power LED */}
                  <circle cx="108.5" cy="38" r="3" fill={connected ? "#4ADE80" : "#9CA3AF"}
                    style={connected ? { animation: "pulse 1.5s ease-in-out infinite" } : {}} />
                </svg>
              </div>
              <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                {[["Device", "Muse 2 Headband"], ["Protocol", "Bluetooth Low Energy"], ["Sampling", "256 Hz"], ["Channels", "4-channel EEG (TP9, AF7, AF8, TP10)"]].map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span>{k}</span><span className="text-gray-700 font-medium">{v}</span></div>
                ))}
              </div>
              {!connected ? (
                <button onClick={handleConnect}
                  className="w-full py-3 bg-[#3535C5] hover:bg-[#2929a8] text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Wifi className="w-4 h-4" /> Connect Headband
                </button>
              ) : stageIdx === 4 ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-xs font-medium justify-center">
                  <CheckCircle className="w-4 h-4" /> Session complete
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs justify-center">
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  {stage?.label}…
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-gray-800 font-semibold text-sm mb-3">Capture Stages</h3>
              <div className="space-y-2">
                {STAGES.slice(1).map((s, i) => {
                  const idx = i + 1;
                  const isDone = stageIdx > idx;
                  const isActive = stageIdx === idx;
                  return (
                    <div key={s.id} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${isDone ? "bg-green-500 text-white" : isActive ? "bg-[#3535C5] text-white" : "bg-gray-100 text-gray-400"}`}>
                        {isDone ? "✓" : idx}
                      </div>
                      <span className={`text-xs ${isDone ? "text-green-700" : isActive ? "text-[#3535C5] font-medium" : "text-gray-400"}`}>{s.label}</span>
                      {isActive && <div className="w-3 h-3 border-2 border-[#3535C5] border-t-transparent rounded-full animate-spin ml-auto" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Center/right: recording indicator (replaces live waveform) ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0B1F3A] rounded-2xl p-8 flex flex-col items-center justify-center min-h-[240px]">
              <div className="flex items-center gap-2 mb-6 self-start">
                <div className={`w-2 h-2 rounded-full ${running && stageIdx < 4 ? "bg-green-400 animate-pulse" : "bg-gray-500"}`} />
                <span className="text-white text-sm font-medium">Device Recording</span>
              </div>

              <div className="relative w-24 h-24 flex items-center justify-center mb-5">
                {running && stageIdx < 4 && <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400/30 animate-ping" />}
                <span className={`relative inline-flex rounded-full h-14 w-14 items-center justify-center ${running && stageIdx < 4 ? "bg-gradient-to-br from-blue-500 to-cyan-400" : "bg-white/10"}`}>
                  <Radio className="w-6 h-6 text-white" />
                </span>
              </div>

              {stageIdx === 2 ? (
                <div className="text-center">
                  <div className="text-white text-3xl font-bold font-mono tabular-nums">{formatMMSS(recordRemainingSec)}</div>
                  <p className="text-blue-300 text-xs mt-2">Baseline recording in progress — stay relaxed and still</p>
                </div>
              ) : stageIdx === 4 ? (
                <p className="text-green-400 text-sm font-medium">Recording captured</p>
              ) : (
                <p className="text-blue-300 text-sm">{running ? `${stage?.label}…` : "Waiting to start"}</p>
              )}
            </div>

            {connected && stageIdx < 4 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 text-sm font-medium">Overall Progress</span>
                  <span className="text-[#3535C5] font-bold text-sm">{overallPct}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#3535C5] to-cyan-400 rounded-full transition-all duration-300" style={{ width: `${overallPct}%` }} />
                </div>
              </div>
            )}

            {stageIdx === 4 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-50 border border-green-200 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-gray-800 font-bold">Baseline Recording Complete</h3>
                    <p className="text-gray-500 text-xs">{recordTotalSec}-second baseline EEG captured</p>
                  </div>
                </div>

                <button onClick={onComplete}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  Finish Pre-test <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {!connected && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-gray-700 font-semibold text-sm mb-3">Setup Instructions</h3>
                <div className="space-y-2.5">
                  {[
                    "Place the Muse 2 headband on your forehead, sensors resting flat against your skin.",
                    "Turn on the headband using the button on the right arm.",
                    "Wait for the LED to blink blue — this indicates Bluetooth is ready.",
                    "Click 'Connect Headband' to pair and begin the baseline session.",
                    `Sit still and relax during the ${recordTotalSec}-second baseline recording.`,
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#3535C5]/10 text-[#3535C5] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                      <span className="text-gray-600 text-xs leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
