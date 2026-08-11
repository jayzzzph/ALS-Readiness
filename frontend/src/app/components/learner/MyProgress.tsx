import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import { TrendingUp, Clock, BookOpen, ClipboardList, CheckCircle, ArrowUp, ArrowDown, Target } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";

const readinessTrend = [
  { week:"Wk 1", readiness:52, avgScore:58 },
  { week:"Wk 2", readiness:58, avgScore:63 },
  { week:"Wk 3", readiness:63, avgScore:67 },
  { week:"Wk 4", readiness:69, avgScore:72 },
  { week:"Wk 5", readiness:74, avgScore:75 },
];

const subjectProgress = [
  { subject:"English",  current:78, prev:70, target:85, status:"improving" },
  { subject:"Math",     current:62, prev:68, target:80, status:"declining" },
  { subject:"Science",  current:85, prev:80, target:85, status:"achieved"  },
  { subject:"Filipino", current:71, prev:65, target:80, status:"improving" },
  { subject:"AP",       current:69, prev:62, target:80, status:"improving" },
];

const radarData = [
  { subject:"English",  A:78 }, { subject:"Math",    A:62 },
  { subject:"Science",  A:85 }, { subject:"Filipino", A:71 }, { subject:"AP", A:69 },
];

const weeklyActivity = [
  { day:"Mon", minutes:28, content:2 }, { day:"Tue", minutes:45, content:3 },
  { day:"Wed", minutes:20, content:1 }, { day:"Thu", minutes:60, content:4 },
  { day:"Fri", minutes:35, content:2 }, { day:"Sat", minutes:50, content:3 }, { day:"Sun", minutes:15, content:1 },
];

const milestones = [
  { label:"Completed first diagnostic test",    date:"Jun 3",  done:true  },
  { label:"Reached 70% readiness index",        date:"Jun 10", done:true  },
  { label:"Passed Science module",              date:"Jun 15", done:true  },
  { label:"Complete all 5 diagnostic tests",   date:"Goal",   done:false },
  { label:"Reach 80% readiness index",         date:"Goal",   done:false },
  { label:"Complete 10 learning sessions",     date:"Goal",   done:false },
];

function SubjectRow({ s }) {
  const pct   = Math.round(((s.current - s.prev) / s.prev) * 100);
  const isUp  = s.current >= s.prev;
  const pctToTarget = Math.round((s.current / s.target) * 100);
  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <div className="w-20 text-gray-700 text-sm font-medium">{s.subject}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-gray-500 text-xs">{s.current}% / {s.target}% target</span>
          <span className="text-xs text-gray-400">{pctToTarget}% of goal</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${s.status === "achieved" ? "bg-green-500" : s.status === "declining" ? "bg-orange-400" : "bg-[#3535C5]"}`}
            style={{ width:`${pctToTarget}%` }} />
        </div>
      </div>
      <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${isUp ? "text-green-600 bg-green-50" : "text-red-500 bg-red-50"}`}>
        {isUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
        {Math.abs(pct)}%
      </div>
      <div className={`text-xs font-medium px-2 py-1 rounded-full ${s.status === "achieved" ? "text-green-600 bg-green-100" : s.status === "declining" ? "text-orange-600 bg-orange-100" : "text-blue-600 bg-blue-100"}`}>
        {s.status === "achieved" ? "✓ Achieved" : s.status === "declining" ? "⚠ Declining" : "↑ Improving"}
      </div>
    </div>
  );
}

export function MyProgress({ navigate, user, onLogout }) {
  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="my-progress">
      <div className="p-5 space-y-5">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1a3a5c] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-white/15 px-2 py-0.5 rounded font-mono">M04</span>
            <span className="text-blue-300 text-xs">My Progress — Learning Analytics</span>
          </div>
          <h2 className="mb-1" style={{ fontSize:"1.25rem", fontWeight:700 }}>Your Learning Progress</h2>
          <p className="text-blue-200/70 text-sm">Track your readiness growth, subject scores, and learning consistency over time.</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:"Readiness Index",      value:"74%",    change:"+16%",   icon:TrendingUp,    iconCls:"text-blue-600 bg-blue-50"   },
            { label:"Avg. Diagnostic Score", value:"73%",   change:"+5%",    icon:ClipboardList, iconCls:"text-purple-600 bg-purple-50" },
            { label:"Study Time This Week",  value:"253 min",change:"+40 min",icon:Clock,         iconCls:"text-green-600 bg-green-50"  },
            { label:"Content Completed",     value:"3/6",   change:"50%",    icon:BookOpen,      iconCls:"text-orange-600 bg-orange-50" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.iconCls}`}><Icon className="w-4 h-4" /></div>
                <div className="text-gray-800 text-xl font-bold">{s.value}</div>
                <div className="text-gray-500 text-xs">{s.label}</div>
                <div className="text-green-500 text-xs mt-1 flex items-center gap-1"><ArrowUp className="w-3 h-3" />{s.change}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Readiness + Score Trend */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-800 font-semibold text-sm">Readiness & Score Trend</h3>
              <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded">5 Weeks</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={readinessTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="week" tick={{ fontSize:11, fill:"#9CA3AF" }} />
                <YAxis domain={[40,90]} tick={{ fontSize:11, fill:"#9CA3AF" }} />
                <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
                <Line type="monotone" dataKey="readiness" stroke="#3535C5" strokeWidth={2} dot={{ r:3, fill:"#3535C5" }} name="Readiness" />
                <Line type="monotone" dataKey="avgScore"  stroke="#10B981" strokeWidth={2} dot={{ r:3, fill:"#10B981" }} name="Avg Score" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-[#3535C5] rounded" /><span className="text-xs text-gray-500">Readiness</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-green-500 rounded" /><span className="text-xs text-gray-500">Avg Score</span></div>
            </div>
          </div>

          {/* Radar — subject balance */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-gray-800 font-semibold text-sm mb-4">Subject Balance</h3>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData} margin={{ top:0, right:10, left:10, bottom:0 }}>
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize:10, fill:"#6B7280" }} />
                <Radar dataKey="A" stroke="#3535C5" fill="#3535C5" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per-subject breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-800 font-semibold text-sm">Subject Progress Breakdown</h3>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#3535C5]" /> Improving</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> Achieved</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400" /> Declining</span>
            </div>
          </div>
          <div className="space-y-2.5">
            {subjectProgress.map(s => <SubjectRow key={s.subject} s={s} />)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Weekly study pattern */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-gray-800 font-semibold text-sm mb-4">Study Pattern This Week</h3>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={weeklyActivity} margin={{ top:0, right:0, left:-25, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="day" tick={{ fontSize:10, fill:"#9CA3AF" }} />
                <YAxis tick={{ fontSize:10, fill:"#9CA3AF" }} />
                <Tooltip formatter={v => [`${v} min`, "Study time"]} contentStyle={{ fontSize:11, borderRadius:8 }} />
                <Bar dataKey="minutes" radius={[4,4,0,0]} fill="#3535C5" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 253 min total</span>
              <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> 16 items viewed</span>
            </div>
          </div>

          {/* Milestones */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-gray-800 font-semibold text-sm mb-4">Milestones</h3>
            <div className="space-y-3">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${m.done ? "bg-green-100" : "bg-gray-100 border-2 border-gray-200 border-dashed"}`}>
                    {m.done && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                  </div>
                  <div className="flex-1">
                    <div className={`text-xs font-medium ${m.done ? "text-gray-700" : "text-gray-400"}`}>{m.label}</div>
                    <div className={`text-xs mt-0.5 ${m.done ? "text-green-500" : "text-gray-400"}`}>{m.done ? `Completed ${m.date}` : "Not yet reached"}</div>
                  </div>
                  {!m.done && <Target className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
