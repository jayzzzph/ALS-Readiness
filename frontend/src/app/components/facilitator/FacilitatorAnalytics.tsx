import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import { TrendingUp, AlertCircle, CheckCircle, Activity, Users, ChevronRight } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";

const learners = [
  { id:1, name:"Maria Santos",       readiness:74, status:"Engaged", stimulus:"Auditory", math:70, english:78, science:82, filipino:75, ap:68 },
  { id:2, name:"Jose Reyes",         readiness:58, status:"Neutral", stimulus:"Visual",   math:45, english:62, science:70, filipino:58, ap:55 },
  { id:3, name:"Ana Cruz",           readiness:88, status:"Engaged", stimulus:"Reading",  math:88, english:90, science:92, filipino:85, ap:80 },
  { id:4, name:"Pedro Delos Santos", readiness:45, status:"Anxious", stimulus:"Auditory", math:35, english:48, science:50, filipino:42, ap:40 },
  { id:5, name:"Elena Ramos",        readiness:82, status:"Engaged", stimulus:"Visual",   math:80, english:85, science:88, filipino:78, ap:75 },
  { id:6, name:"Carlo Bautista",     readiness:63, status:"Neutral", stimulus:"Reading",  math:60, english:65, science:68, filipino:62, ap:58 },
];

const subjectAvg = [
  { subject:"English",  avg:73, passing:4 }, { subject:"Math",    avg:62, passing:3 },
  { subject:"Science",  avg:75, passing:4 }, { subject:"Filipino",avg:67, passing:3 }, { subject:"AP", avg:63, passing:3 },
];

const stimulusDist = [
  { name:"Auditory", value:2, color:"#3535C5" },
  { name:"Visual",   value:2, color:"#8B5CF6" },
  { name:"Reading",  value:2, color:"#10B981" },
];

const readinessDist = [
  { range:"0-40%",    count:0 }, { range:"41-60%",  count:2 },
  { range:"61-75%",   count:2 }, { range:"76-100%", count:2 },
];

const trend = [
  { week:"Wk1", readiness:55, score:60 }, { week:"Wk2", readiness:60, score:64 },
  { week:"Wk3", readiness:63, score:67 }, { week:"Wk4", readiness:67, score:70 }, { week:"Wk5", readiness:68, score:72 },
];

const radarData = [
  { subject:"English", A:73 }, { subject:"Math",A:62 }, { subject:"Science",A:75 }, { subject:"Filipino",A:67 }, { subject:"AP",A:63 },
];

const readinessColor = (r) => r >= 80 ? "text-green-600 bg-green-50" : r >= 60 ? "text-blue-600 bg-blue-50" : "text-red-600 bg-red-50";
const statusColor    = (s) => s === "Engaged" ? "text-green-600 bg-green-50" : s === "Neutral" ? "text-yellow-600 bg-yellow-50" : "text-red-600 bg-red-50";

const tabs = ["Overview", "Subject Detail", "Individual"];

export function FacilitatorAnalytics({ navigate, user, onLogout }) {
  const [tab, setTab] = useState("Overview");

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="facilitator-analytics">
      <div className="p-5 space-y-5">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1a3a5c] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2"><span className="text-xs bg-white/15 px-2 py-0.5 rounded font-mono">M05</span><span className="text-blue-300 text-xs">Analytics Dashboard</span></div>
          <h2 className="mb-1" style={{ fontSize:"1.25rem", fontWeight:700 }}>Cohort Analytics</h2>
          <p className="text-blue-200/70 text-sm">Real-time data on readiness, test scores, stimulus distribution, and individual performance.</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 p-1.5 flex gap-1">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? "bg-orange-500 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === "Overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label:"Avg. Readiness",   value:"68%", icon:Activity,    cls:"text-blue-600 bg-blue-50"   },
                { label:"Passing (≥75%)",   value:"2/6",  icon:CheckCircle, cls:"text-green-600 bg-green-50" },
                { label:"At Risk (<60%)",   value:"2",    icon:AlertCircle, cls:"text-red-600 bg-red-50"     },
                { label:"Avg. Test Score",  value:"70%",  icon:TrendingUp,  cls:"text-purple-600 bg-purple-50"},
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.cls}`}><Icon className="w-4 h-4" /></div>
                    <div className="text-gray-800 text-xl font-bold">{s.value}</div>
                    <div className="text-gray-500 text-xs">{s.label}</div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Trend */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-gray-800 font-semibold text-sm mb-4">Cohort Progress Trend</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="week" tick={{ fontSize:10, fill:"#9CA3AF" }} />
                    <YAxis domain={[40,80]} tick={{ fontSize:10, fill:"#9CA3AF" }} />
                    <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
                    <Line type="monotone" dataKey="readiness" stroke="#3535C5" strokeWidth={2} dot={{ r:3 }} name="Readiness" />
                    <Line type="monotone" dataKey="score"     stroke="#F97316" strokeWidth={2} dot={{ r:3 }} name="Avg Score" strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><div className="w-3 h-0.5 bg-[#3535C5] rounded" />Readiness</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-0.5 bg-orange-400 rounded" />Avg Score</span>
                </div>
              </div>

              {/* Readiness distribution */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-gray-800 font-semibold text-sm mb-4">Readiness Index Distribution</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={readinessDist} margin={{ left:-10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="range" tick={{ fontSize:10, fill:"#9CA3AF" }} />
                    <YAxis tick={{ fontSize:10, fill:"#9CA3AF" }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
                    <Bar dataKey="count" fill="#F97316" radius={[6,6,0,0]}>
                      {readinessDist.map((_, i) => <Cell key={i} fill={["#EF4444","#F97316","#3535C5","#10B981"][i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stimulus + Subject */}
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-gray-800 font-semibold text-sm mb-4">Stimulus Type Distribution</h3>
                <div className="flex items-center gap-5">
                  <PieChart width={140} height={140}>
                    <Pie data={stimulusDist} cx={65} cy={65} innerRadius={38} outerRadius={62} dataKey="value" paddingAngle={3}>
                      {stimulusDist.map((e,i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={v => [`${v} learners`, ""]} />
                  </PieChart>
                  <div className="space-y-3 flex-1">
                    {stimulusDist.map(d => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background:d.color }} />
                        <span className="text-gray-600 text-xs flex-1">{d.name}</span>
                        <span className="text-gray-800 font-bold text-xs">{d.value} learners</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-gray-800 font-semibold text-sm mb-4">Subject Balance (Cohort)</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#E5E7EB" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize:10, fill:"#6B7280" }} />
                    <Radar dataKey="A" stroke="#F97316" fill="#F97316" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── Subject Detail ── */}
        {tab === "Subject Detail" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-gray-800 font-semibold text-sm mb-4">Average Score per Subject</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={subjectAvg} margin={{ left:-10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="subject" tick={{ fontSize:11, fill:"#9CA3AF" }} />
                  <YAxis domain={[0,100]} tick={{ fontSize:11, fill:"#9CA3AF" }} />
                  <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
                  <Bar dataKey="avg" radius={[6,6,0,0]}>
                    {subjectAvg.map((s,i) => <Cell key={i} fill={s.avg >= 75 ? "#10B981" : s.avg >= 65 ? "#3535C5" : "#F97316"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-green-500" />≥75 Passing</span>
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-[#3535C5]" />65–74 Average</span>
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-orange-500" />&lt;65 Needs improvement</span>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {subjectAvg.map(s => (
                <div key={s.subject} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                  <div className={`text-2xl font-bold mb-1 ${s.avg >= 75 ? "text-green-600" : s.avg >= 65 ? "text-[#3535C5]" : "text-orange-500"}`}>{s.avg}%</div>
                  <div className="text-gray-700 text-xs font-medium">{s.subject}</div>
                  <div className={`text-xs mt-1 px-2 py-0.5 rounded-full ${s.passing >= 4 ? "text-green-600 bg-green-50" : "text-orange-600 bg-orange-50"}`}>{s.passing}/6 passing</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Individual ── */}
        {tab === "Individual" && (
          <div className="space-y-3">
            <p className="text-gray-500 text-sm">Click a row to view detailed learner profile. Rows sorted by readiness index.</p>
            {[...learners].sort((a,b) => b.readiness - a.readiness).map(l => (
              <div key={l.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-orange-200 transition-all cursor-pointer"
                onClick={() => navigate("facilitator-cohort")}>
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-amber-400 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">{l.name[0]}</div>
                  <div className="w-36">
                    <div className="text-gray-800 text-sm font-medium">{l.name}</div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusColor(l.status)}`}>{l.status}</span>
                  </div>
                  {/* Subject scores mini-bars */}
                  <div className="flex-1 grid grid-cols-5 gap-2">
                    {[["English",l.english],["Math",l.math],["Science",l.science],["Filipino",l.filipino],["AP",l.ap]].map(([subj, val]) => (
                      <div key={subj}>
                        <div className="flex justify-between text-xs text-gray-400 mb-0.5"><span>{subj}</span><span className={val>=75?"text-green-600":val>=65?"text-blue-600":"text-orange-500"}>{val}%</span></div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${val>=75?"bg-green-500":val>=65?"bg-blue-500":"bg-orange-400"}`} style={{ width:`${val}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={`w-14 text-center px-2 py-1 rounded-full border text-xs font-bold ${readinessColor(l.readiness)}`}>{l.readiness}%</div>
                  {l.readiness < 60 && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                  {l.readiness >= 80 && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </AppLayout>
  );
}
