import { useState, useEffect, useRef } from "react";
import { Brain, Wifi, WifiOff, CheckCircle, AlertCircle, ChevronRight, Activity, Zap, Clock } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";

/* EEG waveform animation data */
const generateWave = (len = 60) =>
  Array.from({ length: len }, (_, i) => 28 + Math.sin(i * 0.6) * 10 + Math.sin(i * 1.8) * 5 + (Math.random() - 0.5) * 8);

const STAGES = [
  { id:"connect",  label:"Connect NeuroSky Headset",   duration:0     },
  { id:"calibrate",label:"Calibrating EEG Sensors",    duration:4000  },
  { id:"capture",  label:"Capturing EEG Signal",       duration:8000  },
  { id:"analyze",  label:"Analyzing Brain Response",   duration:5000  },
  { id:"done",     label:"Readiness Profile Complete", duration:0     },
];

const readinessFactors = [
  { label:"Attention Level",      value:82, color:"bg-blue-500",   icon:"🧠" },
  { label:"Meditation Score",     value:74, color:"bg-teal-500",   icon:"🌊" },
  { label:"Cognitive Load",       value:68, color:"bg-purple-500", icon:"⚡" },
  { label:"Affective State",      value:78, color:"bg-green-500",  icon:"😊" },
  { label:"Focus Index",          value:85, color:"bg-indigo-500", icon:"🎯" },
];

const affectiveLabel = (v) => v >= 80 ? "Engaged" : v >= 60 ? "Neutral" : "Anxious";
const affectiveColor = (v) => v >= 80 ? "text-green-600 bg-green-50" : v >= 60 ? "text-yellow-600 bg-yellow-50" : "text-red-600 bg-red-50";

export function EEGProfiling({ navigate, user, onLogout }) {
  const [connected,    setConnected]    = useState(false);
  const [stageIdx,     setStageIdx]     = useState(0); // 0=connect, 1..3=processing, 4=done
  const [running,      setRunning]      = useState(false);
  const [waveData,     setWaveData]     = useState(generateWave());
  const [signalQuality,setSignalQuality]= useState(0);
  const [captureT,     setCaptureT]     = useState(0);
  const [elapsedMs,    setElapsedMs]    = useState(0);
  const waveRef = useRef(null);

  /* Animate waveform while running */
  useEffect(() => {
    if (!running || stageIdx === 4) return;
    const id = setInterval(() => {
      setWaveData(prev => [...prev.slice(1), 28 + Math.sin(Date.now() * 0.006) * 12 + Math.sin(Date.now() * 0.018) * 5 + (Math.random() - 0.5) * 9]);
    }, 80);
    return () => clearInterval(id);
  }, [running, stageIdx]);

  /* Stage sequencer */
  useEffect(() => {
    if (!running || stageIdx === 0 || stageIdx === 4) return;
    const stage    = STAGES[stageIdx];
    if (!stage.duration) return;

    const start    = Date.now();
    const tick     = setInterval(() => {
      const elapsed = Date.now() - start;
      setElapsedMs(elapsed);
      if (stageIdx === 2) setCaptureT(Math.min(8, Math.round(elapsed / 1000)));
      if (stage.id === "capture") setSignalQuality(Math.min(100, Math.round((elapsed / stage.duration) * 100)));
    }, 100);

    const next = setTimeout(() => {
      clearInterval(tick);
      setStageIdx(i => i + 1);
      setElapsedMs(0);
    }, stage.duration);

    return () => { clearInterval(tick); clearTimeout(next); };
  }, [running, stageIdx]);

  const handleConnect = () => {
    setConnected(true);
    setRunning(true);
    setStageIdx(1); // jump to calibrate
  };

  const pct = stageIdx >= 1 && stageIdx <= 3
    ? Math.round((elapsedMs / STAGES[stageIdx].duration) * 100)
    : stageIdx === 4 ? 100 : 0;

  const overallPct = stageIdx === 4 ? 100 : Math.round(((stageIdx - 1) / 3 + (pct / 100) / 3) * 100);

  /* SVG wave path */
  const W = 400, H = 60;
  const path = waveData.map((y, i) => `${i === 0 ? "M" : "L"} ${(i / (waveData.length - 1)) * W} ${y}`).join(" ");

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="eeg-profiling">
      <div className="p-5 space-y-5">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1a2f4a] rounded-2xl p-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-white/15 px-2 py-0.5 rounded font-mono">M03</span>
              <span className="text-blue-300 text-xs">EEG Readiness Profiling — NeuroSky Headset</span>
            </div>
            <h2 className="mb-1" style={{ fontSize:"1.25rem", fontWeight:700 }}>EEG Signal Capture</h2>
            <p className="text-blue-200/70 text-sm">Put on the NeuroSky MindWave headset, then start the capture session.</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${connected ? "bg-green-500/20 border border-green-500/40" : "bg-white/10 border border-white/20"}`}>
              {connected ? <Wifi className="w-7 h-7 text-green-400" /> : <WifiOff className="w-7 h-7 text-blue-300" />}
            </div>
            <span className={`text-xs font-semibold ${connected ? "text-green-400" : "text-blue-300"}`}>{connected ? "Connected" : "Not Connected"}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">

          {/* ── Left: Device + Controls ── */}
          <div className="space-y-4">
            {/* Device card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-gray-800 font-semibold text-sm mb-4">NeuroSky MindWave</h3>
              {/* Headset illustration */}
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-28 h-28">
                  <div className="w-28 h-16 border-4 border-gray-300 rounded-t-full border-b-0 absolute top-2" />
                  <div className="w-4 h-8 bg-gray-300 rounded-full absolute -left-1 top-10" />
                  <div className="w-4 h-8 bg-gray-300 rounded-full absolute -right-1 top-10" />
                  <div className="w-3 h-6 bg-[#3535C5] rounded-sm absolute -right-2 top-16" />
                  <div className={`w-3 h-3 rounded-full absolute -right-1 top-[88px] ${connected ? "bg-green-400 shadow-lg shadow-green-400/50" : "bg-gray-400"}`}
                    style={connected ? { animation:"pulse 1.5s ease-in-out infinite" } : {}} />
                </div>
              </div>
              {/* Signal quality */}
              {connected && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Signal Quality</span><span className="font-semibold">{signalQuality}%</span></div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${signalQuality >= 70 ? "bg-green-500" : signalQuality >= 40 ? "bg-yellow-400" : "bg-red-400"}`} style={{ width:`${signalQuality}%` }} />
                  </div>
                </div>
              )}
              <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                {[["Device","NeuroSky MindWave Mobile 2"], ["Protocol","ThinkGear via Bluetooth"], ["Sampling","512 Hz"], ["Channels","Single-channel EEG"]].map(([k,v]) => (
                  <div key={k} className="flex justify-between"><span>{k}</span><span className="text-gray-700 font-medium">{v}</span></div>
                ))}
              </div>
              {!connected ? (
                <button onClick={handleConnect}
                  className="w-full py-3 bg-[#3535C5] hover:bg-[#2929a8] text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Wifi className="w-4 h-4" /> Connect Headset
                </button>
              ) : stageIdx === 4 ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-xs font-medium justify-center">
                  <CheckCircle className="w-4 h-4" /> Session complete
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs justify-center">
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  {STAGES[stageIdx]?.label}…
                </div>
              )}
            </div>

            {/* Pipeline stages */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-gray-800 font-semibold text-sm mb-3">Capture Stages</h3>
              <div className="space-y-2">
                {STAGES.slice(1).map((stage, i) => {
                  const idx     = i + 1;
                  const isDone  = stageIdx > idx;
                  const isActive= stageIdx === idx;
                  return (
                    <div key={stage.id} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${isDone ? "bg-green-500 text-white" : isActive ? "bg-[#3535C5] text-white" : "bg-gray-100 text-gray-400"}`}>
                        {isDone ? "✓" : idx}
                      </div>
                      <span className={`text-xs ${isDone ? "text-green-700" : isActive ? "text-[#3535C5] font-medium" : "text-gray-400"}`}>{stage.label}</span>
                      {isActive && <div className="w-3 h-3 border-2 border-[#3535C5] border-t-transparent rounded-full animate-spin ml-auto" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Center: Live EEG Feed ── */}
          <div className="col-span-2 space-y-4">
            <div className="bg-[#0B1F3A] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${running && stageIdx < 4 ? "bg-green-400" : "bg-gray-500"}`}
                    style={running && stageIdx < 4 ? { animation:"pulse 1s ease-in-out infinite" } : {}} />
                  <span className="text-white text-sm font-medium">Live EEG Signal</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-blue-300">
                  {stageIdx === 2 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />T={captureT}s / 8s</span>}
                  <span>512 Hz</span>
                  <span>1 Ch</span>
                </div>
              </div>
              {/* Wave */}
              <div className="bg-[#060f1a] rounded-xl p-3 mb-3">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height:80 }}>
                  <defs>
                    <linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3535C5" stopOpacity="0.3" />
                      <stop offset="50%" stopColor="#818cf8" stopOpacity="1" />
                      <stop offset="100%" stopColor="#3535C5" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                  {running && stageIdx < 4 ? (
                    <path d={path} fill="none" stroke="url(#waveGrad)" strokeWidth="1.5" strokeLinecap="round" />
                  ) : (
                    <line x1="0" y1="30" x2={W} y2="30" stroke="#1e2d45" strokeWidth="1" strokeDasharray="4,4" />
                  )}
                  {/* Vertical scan line */}
                  {running && stageIdx < 4 && (
                    <line x1={W * 0.85} y1="0" x2={W * 0.85} y2={H} stroke="#F5A623" strokeWidth="0.5" opacity="0.5" />
                  )}
                </svg>
              </div>
              {/* Channel labels */}
              <div className="flex gap-3 text-xs text-blue-400">
                {["Fp1 (Frontal)", "Alpha", "Beta", "Theta"].map(ch => (
                  <span key={ch} className="flex items-center gap-1">
                    <div className="w-2 h-0.5 bg-indigo-400 rounded" />{ch}
                  </span>
                ))}
              </div>
            </div>

            {/* Overall progress */}
            {connected && stageIdx < 4 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 text-sm font-medium">Overall Capture Progress</span>
                  <span className="text-[#3535C5] font-bold text-sm">{overallPct}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                  <div className="h-full bg-gradient-to-r from-[#3535C5] to-cyan-400 rounded-full transition-all duration-300" style={{ width:`${overallPct}%` }} />
                </div>
                <p className="text-gray-400 text-xs">Est. {Math.ceil(((100 - overallPct) / 100) * 17)} seconds remaining</p>
              </div>
            )}

            {/* ── Results (stage 4) ── */}
            {stageIdx === 4 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-50 border border-green-200 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-gray-800 font-bold">EEG Capture Complete</h3>
                    <p className="text-gray-500 text-xs">Brain response profile generated for {user?.name?.split(" ")[0]}</p>
                  </div>
                  <div className="ml-auto text-center">
                    <div className="text-2xl font-bold text-[#3535C5]">74%</div>
                    <div className="text-xs text-gray-500">Readiness Index</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {readinessFactors.map(f => (
                    <div key={f.label} className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-base">{f.icon}</span>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600 text-xs">{f.label}</span>
                            <span className="text-gray-800 text-xs font-bold">{f.value}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full ${f.color} rounded-full`} style={{ width:`${f.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-center">
                    <div className="text-blue-600 font-bold">Engaged</div>
                    <div className="text-gray-500 text-xs">Affective State</div>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-center">
                    <div className="text-green-600 font-bold">82</div>
                    <div className="text-gray-500 text-xs">Attention Score</div>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-center">
                    <div className="text-purple-600 font-bold">Auditory</div>
                    <div className="text-gray-500 text-xs">Stimulus Match</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => navigate("readiness-profiling")}
                    className="flex-1 py-3 bg-[#3535C5] hover:bg-[#2929a8] text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    View Full Readiness Profile <ChevronRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => navigate("stimulus-content")}
                    className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    Receive Personalized Content <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Instructions (pre-connect) */}
            {!connected && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-gray-700 font-semibold text-sm mb-3">Setup Instructions</h3>
                <div className="space-y-2.5">
                  {[
                    "Place the NeuroSky MindWave headset on your head with the sensor touching your forehead.",
                    "Clip the ear sensor to your earlobe for grounding.",
                    "Turn on the headset using the power switch on the left ear pad.",
                    "Wait for the LED to blink blue — this indicates Bluetooth is ready.",
                    "Click 'Connect Headset' to pair and begin signal capture.",
                    "Sit still and relax during the 8-second EEG capture session.",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#3535C5]/10 text-[#3535C5] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</div>
                      <span className="text-gray-600 text-xs leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
