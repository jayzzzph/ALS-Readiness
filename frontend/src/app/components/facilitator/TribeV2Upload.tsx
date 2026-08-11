import { useState, useEffect, useRef } from "react";
import {
  X, Upload, ChevronDown, Eye, BookOpen, Headphones,
  CheckCircle, Clock, Download, FileText, Send, Cpu,
  Play, ChevronLeft
} from "lucide-react";

/* ── constants ── */
const strands = [
  "LS1 — Communication",
  "LS2 — Critical Thinking",
  "LS3 — Mathematics",
  "LS4 — Life & Career",
  "LS5 — Understanding the Self",
  "LS6 — The Philippine Society",
];
const readinessLevels = ["All levels", "Low (0–40%)", "Moderate (41–75%)", "High (76–100%)"];
const frameColors = ["#2563EB","#7C3AED","#0D9488","#B45309","#1D4ED8","#6D28D9","#047857","D97706","#1D4ED8"];

/* ── Step progress bar ── */
function StepBar({ current }) {
  const labels = ["Upload", "Analyze", "Publish"];
  return (
    <div className="flex items-center gap-3 mb-8">
      {[1, 2, 3].map((n, i) => (
        <div key={n} className="flex items-center gap-2 flex-1 last:flex-none">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 flex-shrink-0 transition-all duration-300 ${current > n ? "bg-green-500 border-green-500 text-white" : current === n ? "bg-[#3535C5] border-[#3535C5] text-white" : "bg-[#e8edf5] border-[#c8d4e8] text-gray-400"}`}>
            {current > n ? <CheckCircle className="w-3.5 h-3.5" /> : n}
          </div>
          <span className={`text-xs font-medium ${current === n ? "text-[#3535C5]" : current > n ? "text-green-600" : "text-gray-400"}`}>{labels[i]}</span>
          {i < 2 && <div className={`flex-1 h-0.5 transition-all duration-500 ${current > n ? "bg-green-400" : "bg-gray-200"}`} />}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 1 — Upload Form
══════════════════════════════════════════ */
function StepUpload({ onNext, onCancel }) {
  const [title,     setTitle]     = useState("Basic Operations & Word Problems");
  const [strand,    setStrand]    = useState("LS3 — Mathematics");
  const [stimType,  setStimType]  = useState("visual");
  const [readiness, setReadiness] = useState("All levels");
  const [fileName,  setFileName]  = useState("word_problems_v2.mp4");
  const [fileSize,  setFileSize]  = useState("~142 MB");
  const [dragging,  setDragging]  = useState(false);
  const fileRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFileName(f.name); setFileSize(`~${Math.round(f.size / 1024 / 1024)} MB`); }
  };
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) { setFileName(f.name); setFileSize(`~${Math.round(f.size / 1024 / 1024)} MB`); }
  };

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded font-mono">M05</span>
            <span className="text-gray-400 text-xs">TRIBE v2 Upload Flow — Step 1 of 3</span>
          </div>
          <h2 className="text-gray-800" style={{ fontSize: "1.4rem", fontWeight: 700 }}>Upload stimulus content</h2>
          <p className="text-gray-500 text-sm mt-0.5">Content will be processed by TRIBE v2 before being published to learners.</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1.5">
          <Cpu className="w-3.5 h-3.5 text-[#3535C5]" />
          <span className="text-[#3535C5] text-xs font-bold tracking-wide">TRIBE V2</span>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-2xl">
        <StepBar current={1} />

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-2 block">Content Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-200 bg-gray-50 text-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#3535C5] transition-colors"
              placeholder="Enter content title" />
          </div>
          <div>
            <label className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-2 block">Learning Strand</label>
            <div className="relative">
              <select value={strand} onChange={e => setStrand(e.target.value)}
                className="w-full border border-gray-200 bg-gray-50 text-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#3535C5] transition-colors appearance-none">
                {strands.map(s => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-2 block">Stimulus Type</label>
            <div className="flex gap-2">
              {[
                { val: "visual",  Icon: Eye,        label: "Visual"  },
                { val: "reading", Icon: BookOpen,   label: "Reading" },
                { val: "audio",   Icon: Headphones, label: "Audio"   },
              ].map(({ val, Icon, label }) => (
                <button key={val} onClick={() => setStimType(val)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${stimType === val ? "border-[#3535C5] bg-indigo-50 text-[#3535C5]" : "border-gray-200 bg-gray-50 text-gray-500 hover:border-indigo-200"}`}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-2 block">Target Readiness Level</label>
            <div className="relative">
              <select value={readiness} onChange={e => setReadiness(e.target.value)}
                className="w-full border border-gray-200 bg-gray-50 text-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#3535C5] transition-colors appearance-none">
                {readinessLevels.map(r => <option key={r}>{r}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Drop zone */}
        <div className="mb-4">
          <label className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-2 block">Upload File</label>
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${dragging ? "border-[#3535C5] bg-indigo-50" : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/40"}`}>
            <input ref={fileRef} type="file" className="hidden" accept=".mp4,.mov,.pdf,.mp3,.wav" onChange={handleFile} />
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-700 text-sm font-medium mb-0.5">Drop your file here or browse</p>
            <p className="text-gray-400 text-xs">Supports MP4, MOV, PDF, MP3, WAV — max 500MB</p>
            {fileName && (
              <div className="inline-flex items-center gap-2 mt-3 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm" onClick={e => e.stopPropagation()}>
                <FileText className="w-3.5 h-3.5 text-[#3535C5]" />
                <span className="text-gray-700 text-xs font-medium">{fileName}</span>
                <span className="text-gray-400 text-xs">{fileSize}</span>
                <button onClick={() => setFileName("")} className="text-gray-300 hover:text-red-400 ml-1 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-6">
          <Cpu className="w-4 h-4 text-[#3535C5] flex-shrink-0 mt-0.5" />
          <p className="text-indigo-700 text-xs leading-relaxed">
            After uploading, TRIBE v2 will analyze this content and generate a brain response visualization per timestep. This typically takes 1–3 minutes depending on file length.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button onClick={onCancel} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm transition-colors">
            Cancel
          </button>
          <button onClick={() => onNext({ title, strand, stimType, readiness, fileName })} disabled={!fileName}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#3535C5] hover:bg-[#2929a8] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-40">
            <Cpu className="w-4 h-4" /> Upload &amp; analyze with TRIBE v2
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 2 — Processing
══════════════════════════════════════════ */
const processingTasks = [
  { id: "frames",  label: "Extracting video frames",               duration: 3000 },
  { id: "audio",   label: "Processing audio waveform",             duration: 4000 },
  { id: "brain",   label: "Generating brain response per timestep", duration: 8000 },
  { id: "compile", label: "Compiling output visualization",         duration: 2500 },
];

function StepProcessing({ fileName, onDone }) {
  const [taskIdx,  setTaskIdx]  = useState(0);
  const [done,     setDone]     = useState([]);
  const [elapsed,  setElapsed]  = useState(0);
  const [subStep,  setSubStep]  = useState(0);
  const total = processingTasks.reduce((a, t) => a + t.duration, 0);

  useEffect(() => {
    let totalElapsed = 0, current = 0;
    const doneList = [];

    const advance = () => {
      if (current >= processingTasks.length) { onDone(); return; }
      const task = processingTasks[current];
      const t = setTimeout(() => {
        doneList.push(task.id);
        setDone([...doneList]);
        current++;
        setTaskIdx(current);
        advance();
      }, task.duration);
      return t;
    };

    const ticker   = setInterval(() => { totalElapsed += 200; setElapsed(e => e + 200); }, 200);
    const brainTkr = setInterval(() => setSubStep(s => s < 8 ? s + 1 : s), 1000);
    advance();
    return () => { clearInterval(ticker); clearInterval(brainTkr); };
  }, []);

  const estSec = Math.max(0, Math.round((total - elapsed) / 1000));

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded font-mono">M05</span>
        <span className="text-gray-400 text-xs">TRIBE v2 Upload Flow — Step 2 of 3</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-2xl flex flex-col items-center">
        <StepBar current={2} />

        {/* Animated icon */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-5">
          <Cpu className="w-8 h-8 text-[#3535C5]" style={{ animation: "spin 2s linear infinite" }} />
        </div>

        <h2 className="text-gray-800 text-xl font-bold mb-1">TRIBE v2 is analyzing your content</h2>
        <p className="text-gray-500 text-sm text-center mb-8">
          Generating brain response visualizations per timestep for{" "}
          <span className="text-gray-800 font-medium">{fileName}</span>. Do not close this page.
        </p>

        <div className="w-full space-y-3 mb-6">
          {processingTasks.map((task, i) => {
            const isDone   = done.includes(task.id);
            const isActive = taskIdx === i;
            const isPend   = taskIdx < i;
            const taskElapsed = isActive ? Math.min(elapsed - processingTasks.slice(0, i).reduce((a, t) => a + t.duration, 0), task.duration) : 0;

            return (
              <div key={task.id}
                className={`rounded-xl border px-4 py-3 transition-all duration-300 ${isDone ? "border-green-200 bg-green-50" : isActive ? "border-indigo-200 bg-indigo-50" : "border-gray-100 bg-gray-50"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    {isDone
                      ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      : isActive
                        ? <div className="w-4 h-4 border-2 border-[#3535C5] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        : <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />}
                    <span className={`text-sm font-medium ${isDone ? "text-green-700" : isActive ? "text-[#3535C5]" : "text-gray-400"}`}>
                      {task.label}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDone ? "text-green-600 bg-green-100" : isActive ? "text-[#3535C5] bg-indigo-100" : "text-gray-400 bg-gray-200"}`}>
                    {isDone ? "✓ DONE" : isActive ? (task.id === "brain" ? `RUNNING… T=${subStep}S` : "RUNNING…") : "PENDING"}
                  </span>
                </div>

                <div className="h-1.5 bg-white rounded-full overflow-hidden border border-gray-200">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${isDone ? "bg-green-500 w-full" : isActive ? "bg-[#3535C5]" : "w-0"}`}
                    style={isActive ? { width: `${Math.min(100, (taskElapsed / task.duration) * 100)}%` } : {}}
                  />
                </div>

                {isActive && task.id === "brain" && (
                  <p className="text-indigo-500 text-xs mt-1.5">
                    Processing {subStep} of 8 seconds — EEG activation mapping in progress
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Clock className="w-4 h-4" />
          {estSec > 60
            ? `Est. ${Math.ceil(estSec / 60)}–${Math.ceil(estSec / 60) + 1} minutes remaining`
            : `Est. ${estSec} seconds remaining`}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 3 — Results
══════════════════════════════════════════ */
const waveSegs = "0,32 12,26 24,40 36,16 48,44 60,18 72,38 84,10 96,34 108,20 120,44 132,14 144,36 156,26 168,42 180,16 192,38 204,22 216,44 228,30 240,38";

function StepResults({ fileName, strand, stimType, onClose }) {
  const [saved,     setSaved]     = useState(false);
  const [published, setPublished] = useState(false);
  const [activeFrame, setActiveFrame] = useState(3);
  const timestamps = [0,1,2,3,4,5,6,7,8];

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded font-mono">M05</span>
        <span className="text-gray-400 text-xs">TRIBE v2 Upload Flow — Step 3 of 3 — completed output</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-2xl">
        <StepBar current={3} />

        {/* Completion header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-green-50 border border-green-200 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h2 className="text-gray-800 text-lg font-bold">TRIBE v2 analysis complete</h2>
              <p className="text-gray-500 text-sm">{fileName} · {strand} · {stimType} · 2 min 18 sec</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span className="text-green-600 text-xs font-semibold">COMPLETED</span>
          </div>
        </div>

        {/* Brain response output – dark panel */}
        <div className="bg-[#0B1F3A] rounded-2xl p-4 mb-4">
          <p className="text-[#6b8aad] text-xs font-semibold uppercase tracking-wider mb-1">TRIBE V2 Brain Response Output</p>
          <p className="text-[#3d5a7a] text-xs mb-3">VIDEO FRAMES + AUDIO + BRAIN ACTIVATION OVER TIME</p>

          {/* Frame thumbnails */}
          <div className="flex gap-1 mb-2">
            {timestamps.map((t, i) => (
              <button key={t} onClick={() => setActiveFrame(i)}
                className={`flex-1 h-10 rounded-lg flex items-center justify-center transition-all ${i === activeFrame ? "ring-2 ring-white ring-offset-1 ring-offset-[#0B1F3A]" : "opacity-70 hover:opacity-90"}`}
                style={{ background: frameColors[i % frameColors.length] }}>
                {i === activeFrame && <Play className="w-3 h-3 text-white" />}
              </button>
            ))}
          </div>

          {/* Waveform */}
          <div className="bg-[#060f1a] rounded-xl py-1.5 px-2 mb-2">
            <svg viewBox="0 0 240 52" className="w-full h-7" preserveAspectRatio="none">
              <polyline points={waveSegs} fill="none" stroke="#3535C5" strokeWidth="1.5" strokeLinecap="round" />
              <line x1={activeFrame * 27 + 4} y1="0" x2={activeFrame * 27 + 4} y2="52"
                stroke="#F5A623" strokeWidth="1" strokeDasharray="2,3" opacity="0.8" />
            </svg>
          </div>

          {/* Timestamps + dots */}
          <div className="flex gap-1">
            {timestamps.map((t, i) => (
              <div key={t} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${(i === 3 || i === 4) ? "bg-orange-500" : "bg-[#1e2d45] border border-[#2e4060]"}`} />
                <span className="text-[#3d5a7a] text-xs">t={t}s</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
            <div className="text-gray-800 text-2xl font-bold">8</div>
            <div className="text-gray-500 text-xs mt-0.5">Timesteps analyzed</div>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
            <div className="text-green-600 text-2xl font-bold">High</div>
            <div className="text-gray-500 text-xs mt-0.5">Peak brain activation</div>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
            <div className="text-orange-500 text-sm font-bold leading-tight">t=3s–t=4s</div>
            <div className="text-gray-500 text-xs mt-0.5">Peak engagement window</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm transition-colors">
            <Download className="w-4 h-4" /> Download report
          </button>
          <button onClick={() => setSaved(true)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm transition-all ${saved ? "bg-green-50 border-green-200 text-green-600" : "bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700"}`}>
            {saved ? <CheckCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            {saved ? "Saved!" : "Save as draft"}
          </button>
          <button onClick={() => setPublished(true)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${published ? "bg-green-500 text-white" : "bg-[#3535C5] hover:bg-[#2929a8] text-white"}`}>
            {published ? <><CheckCircle className="w-4 h-4" /> Published!</> : <><Send className="w-4 h-4" /> Publish to learners</>}
          </button>
        </div>

        {published && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <p className="text-green-700 text-sm">Content published! Learners will see it in their Stimulus Content feed.</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100">
          <button onClick={onClose} className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Content Library
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Main export — no layout wrapper
   Parent (FacilitatorDashboard) renders this
   inside AppLayout so the real sidebar shows.
══════════════════════════════════════════ */
export function TribeV2Upload({ onClose }) {
  const [step,     setStep]     = useState(1);
  const [meta,     setMeta]     = useState({ fileName: "word_problems_v2.mp4", strand: "LS3 Mathematics", stimType: "Visual" });

  const handleUploadNext = (data) => {
    setMeta({
      fileName: data.fileName,
      strand:   data.strand.replace(/^LS\d — /, "LS") || "LS3 Mathematics",
      stimType: data.stimType.charAt(0).toUpperCase() + data.stimType.slice(1),
    });
    setStep(2);
  };

  return (
    <div className="min-h-full">
      {step === 1 && <StepUpload onNext={handleUploadNext} onCancel={onClose} />}
      {step === 2 && <StepProcessing fileName={meta.fileName} onDone={() => setStep(3)} />}
      {step === 3 && <StepResults fileName={meta.fileName} strand={meta.strand} stimType={meta.stimType} onClose={onClose} />}
    </div>
  );
}
