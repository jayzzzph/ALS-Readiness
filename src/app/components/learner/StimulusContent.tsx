import { useState } from "react";
import { BookOpen, Headphones, Play, Download, CheckCircle, Clock, Star, Search, Lock, Volume2, Video, SlidersHorizontal, Filter, Pause, X } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";

const initialContent = [
  { id: 1, title: "Understanding Basic Algebra", subject: "Math", type: "auditory", duration: "18 min", level: "Beginner", status: "available", progress: 0, rating: 4.5, icon: "🎧" },
  { id: 2, title: "English Grammar: Verb Tenses", subject: "English", type: "visual", duration: "22 min", level: "Intermediate", status: "in-progress", progress: 65, rating: 4.8, icon: "📹" },
  { id: 3, title: "Philippine History: Pre-Colonial Era", subject: "AP", type: "reading", duration: "15 min", level: "Beginner", status: "completed", progress: 100, rating: 4.2, icon: "📖" },
  { id: 4, title: "Photosynthesis Explained", subject: "Science", type: "visual", duration: "20 min", level: "Intermediate", status: "available", progress: 0, rating: 4.7, icon: "📹" },
  { id: 5, title: "Filipino Literature: Balagtasan", subject: "Filipino", type: "auditory", duration: "25 min", level: "Advanced", status: "available", progress: 0, rating: 4.4, icon: "🎧" },
  { id: 6, title: "Basic Statistics and Probability", subject: "Math", type: "reading", duration: "30 min", level: "Intermediate", status: "locked", progress: 0, rating: 4.1, icon: "📖" },
];

const typeColors = {
  auditory: "text-blue-600 bg-blue-50 border-blue-200",
  visual: "text-purple-600 bg-purple-50 border-purple-200",
  reading: "text-green-600 bg-green-50 border-green-200",
};

const statusColors = {
  available: "text-blue-600 bg-blue-50",
  "in-progress": "text-orange-600 bg-orange-50",
  completed: "text-green-600 bg-green-50",
  locked: "text-gray-400 bg-gray-100",
};

const typeFilters = ["All", "Auditory", "Visual", "Reading"];
const subjectFilters = ["All", "Math", "English", "Science", "Filipino", "AP"];

const accessibilityOptions = [
  { label: "Screen Reader", active: false },
  { label: "High Contrast", active: false },
  { label: "Large Text", active: false },
  { label: "Slow Audio", active: false },
  { label: "Captions", active: true },
  { label: "Audio Description", active: false },
  { label: "Keyboard Nav", active: false },
  { label: "Dyslexia Font", active: false },
];

function PlayerModal({ item, onClose, onComplete }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(item.progress || 0);

  const handlePlayPause = () => {
    setPlaying(p => !p);
    if (!playing && progress < 100) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) { clearInterval(interval); setPlaying(false); return 100; }
          return prev + 2;
        });
      }, 200);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className={`h-32 flex items-center justify-center relative ${item.type === "auditory" ? "bg-gradient-to-br from-blue-400 to-blue-600" : item.type === "visual" ? "bg-gradient-to-br from-purple-400 to-purple-600" : "bg-gradient-to-br from-green-400 to-green-600"}`}>
          <div className="text-6xl">{item.icon}</div>
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded border ${typeColors[item.type]}`}>{item.type}</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{item.subject}</span>
          </div>
          <h3 className="text-gray-800 font-semibold mb-1">{item.title}</h3>
          <div className="flex items-center gap-3 text-gray-400 text-xs mb-4">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.duration}</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" />{item.rating}</span>
            <span>{item.level}</span>
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Progress</span><span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-200 ${progress === 100 ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handlePlayPause}
              className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${item.type === "auditory" ? "bg-blue-500 hover:bg-blue-600 text-white" : item.type === "visual" ? "bg-purple-500 hover:bg-purple-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}>
              {playing ? <><Pause className="w-4 h-4" /> Pause</> : progress >= 100 ? <><Play className="w-4 h-4" /> Replay</> : <><Play className="w-4 h-4" /> {progress > 0 ? "Resume" : "Start"}</>}
            </button>
            {progress >= 100 && (
              <button onClick={() => { onComplete(item.id); onClose(); }}
                className="px-5 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Mark Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StimulusContent({ navigate, user, onLogout }) {
  const [typeFilter, setTypeFilter] = useState("All");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [accessOptions, setAccessOptions] = useState(accessibilityOptions);
  const [contentItems, setContentItems] = useState(initialContent);
  const [playingItem, setPlayingItem] = useState(null);
  const [savedItems, setSavedItems] = useState([]);
  const [downloadToast, setDownloadToast] = useState(null);

  const filtered = contentItems.filter(c => {
    const matchType = typeFilter === "All" || c.type === typeFilter.toLowerCase();
    const matchSubject = subjectFilter === "All" || c.subject === subjectFilter;
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSubject && matchSearch && c.status !== "locked";
  });

  const handleComplete = (id) => {
    setContentItems(prev => prev.map(c => c.id === id ? { ...c, status: "completed", progress: 100 } : c));
  };

  const handleSave = (item) => {
    setSavedItems(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id]);
    setDownloadToast(`"${item.title}" ${savedItems.includes(item.id) ? "removed from" : "saved to"} your library`);
    setTimeout(() => setDownloadToast(null), 2500);
  };

  const toggleAccess = (idx) => {
    setAccessOptions(prev => prev.map((o, i) => i === idx ? { ...o, active: !o.active } : o));
  };

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="stimulus-content">
      {playingItem && (
        <PlayerModal item={playingItem} onClose={() => setPlayingItem(null)} onComplete={handleComplete} />
      )}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white rounded-xl shadow-2xl px-5 py-3 text-sm z-50">
          {downloadToast}
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-white/20 px-2 py-1 rounded font-mono">M04</span>
                <span className="text-green-100 text-sm">Stimulus Content Module — Personalized Delivery</span>
              </div>
              <h2 className="mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>Your Learning Content</h2>
              <p className="text-green-100 text-sm">Content personalized based on your <strong>Auditory</strong> learning profile from M03 readiness analysis.</p>
            </div>
            <button onClick={() => setAccessibilityMode(!accessibilityMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${accessibilityMode ? "bg-white text-green-700" : "bg-white/10 text-white hover:bg-white/20"}`}>
              <SlidersHorizontal className="w-4 h-4" /> Accessibility {accessibilityMode ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Type Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { type: "Auditory", icon: Headphones, count: contentItems.filter(c => c.type === "auditory").length, textCls: "text-blue-600", bgCls: "bg-blue-50", recommended: true },
            { type: "Visual", icon: Video, count: contentItems.filter(c => c.type === "visual").length, textCls: "text-purple-600", bgCls: "bg-purple-50", recommended: false },
            { type: "Reading", icon: BookOpen, count: contentItems.filter(c => c.type === "reading").length, textCls: "text-green-600", bgCls: "bg-green-50", recommended: false },
          ].map(({ type, icon: Icon, count, textCls, bgCls, recommended }) => (
            <button key={type} onClick={() => setTypeFilter(typeFilter === type ? "All" : type)}
              className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all duration-200 text-left ${typeFilter === type ? "border-blue-400 shadow-md ring-2 ring-blue-100" : "border-gray-100 hover:border-gray-200"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${bgCls} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${textCls}`} />
                </div>
                {recommended && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Primary</span>}
              </div>
              <div className="text-gray-800 font-semibold">{type}</div>
              <div className={`${textCls} text-sm font-bold mt-1`}>{count} items</div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search content..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-gray-700 focus:outline-none focus:border-blue-400 transition-colors text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              {typeFilters.map(f => (
                <button key={f} onClick={() => setTypeFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${typeFilter === f ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {subjectFilters.map(f => (
                <button key={f} onClick={() => setSubjectFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${subjectFilter === f ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
              <div className={`h-28 flex items-center justify-center cursor-pointer ${item.type === "auditory" ? "bg-gradient-to-br from-blue-400 to-blue-600" : item.type === "visual" ? "bg-gradient-to-br from-purple-400 to-purple-600" : "bg-gradient-to-br from-green-400 to-green-600"}`}
                onClick={() => setPlayingItem(item)}>
                <div className="text-center">
                  <div className="text-4xl mb-2">{item.icon}</div>
                  {item.status === "completed" && <div className="flex items-center gap-1 text-white text-sm"><CheckCircle className="w-4 h-4" /> Completed</div>}
                  {item.status !== "completed" && <div className="flex items-center gap-1 text-white/80 text-xs"><Play className="w-3 h-3" /> Click to play</div>}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded border ${typeColors[item.type]}`}>{item.type}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{item.subject}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ml-auto ${statusColors[item.status]}`}>
                    {item.status === "in-progress" ? "In Progress" : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </div>
                <h4 className="text-gray-800 font-semibold mb-1 leading-snug">{item.title}</h4>
                <div className="flex items-center gap-3 text-gray-400 text-xs mb-3">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.duration}</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" />{item.rating}</span>
                  <span>{item.level}</span>
                </div>
                {item.progress > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span><span>{item.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.progress === 100 ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => handleSave(item)}
                    className={`flex-1 py-2 text-sm rounded-xl transition-colors flex items-center justify-center gap-1 ${savedItems.includes(item.id) ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-gray-50 hover:bg-gray-100 text-gray-600"}`}>
                    <Download className="w-3.5 h-3.5" /> {savedItems.includes(item.id) ? "Saved" : "Save"}
                  </button>
                  <button onClick={() => setPlayingItem(item)}
                    className={`flex-1 py-2 text-sm rounded-xl transition-all flex items-center justify-center gap-1 ${item.type === "auditory" ? "bg-blue-500 hover:bg-blue-600 text-white" : item.type === "visual" ? "bg-purple-500 hover:bg-purple-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}>
                    {item.type === "auditory" ? <Volume2 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {item.status === "completed" ? "Review" : item.status === "in-progress" ? "Resume" : "Start"}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 py-16 text-center text-gray-400">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No content matches your filters.</p>
              <button onClick={() => { setTypeFilter("All"); setSubjectFilter("All"); setSearch(""); }} className="mt-3 text-blue-500 text-sm hover:underline">Clear filters</button>
            </div>
          )}
        </div>

        {/* Locked */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Lock className="w-5 h-5 text-gray-400" />
            <h3 className="text-gray-700" style={{ fontWeight: 600 }}>Locked Content</h3>
            <span className="text-xs text-gray-400">Complete prerequisites to unlock</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {contentItems.filter(c => c.status === "locked").map(item => (
              <div key={item.id} className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 opacity-60">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-gray-600 text-sm font-medium">{item.title}</div>
                    <div className="text-gray-400 text-xs">Complete {item.subject} basics first</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accessibility */}
        {accessibilityMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <h4 className="text-blue-800 font-semibold mb-3 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5" /> Accessibility Options
            </h4>
            <div className="grid grid-cols-4 gap-3">
              {accessOptions.map((opt, idx) => (
                <button key={opt.label} onClick={() => toggleAccess(idx)}
                  className={`p-3 border rounded-xl text-sm transition-colors flex items-center gap-2 ${opt.active ? "bg-blue-500 border-blue-500 text-white" : "bg-white border-blue-200 text-blue-700 hover:bg-blue-100"}`}>
                  {opt.active && <CheckCircle className="w-3.5 h-3.5" />} {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
