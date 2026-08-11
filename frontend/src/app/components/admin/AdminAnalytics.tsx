import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import { TrendingUp, AlertCircle, CheckCircle, Activity, Users, ChevronRight } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";

const cohorts = [
  { cohort:"Cohort A",facilitator:"J. Santos",learners:28,avgReadiness:72,atRisk:3,english:75,math:65,science:80,filipino:70,ap:66 },
  { cohort:"Cohort B",facilitator:"M. Cruz",  learners:32,avgReadiness:58,atRisk:8,english:60,math:48,science:65,filipino:55,ap:52 },
  { cohort:"Cohort C",facilitator:"R. Reyes", learners:25,avgReadiness:81,atRisk:1,english:85,math:78,science:88,filipino:80,ap:76 },
  { cohort:"Cohort D",facilitator:"L. Garcia",learners:30,avgReadiness:64,atRisk:5,english:67,math:58,science:70,filipino:63,ap:59 },
  { cohort:"Cohort E",facilitator:"A. Torres",learners:27,avgReadiness:74,atRisk:4,english:76,math:68,science:79,filipino:72,ap:68 },
];

const divisionSubject = [
  { subject:"English",  avg:73 }, { subject:"Math",   avg:63 }, { subject:"Science", avg:76 },
  { subject:"Filipino", avg:68 }, { subject:"AP",     avg:64 },
];

const radarData = divisionSubject.map(d => ({ subject:d.subject, A:d.avg }));

const trendData = [
  { month:"Jan",A:60,B:48,C:72,D:55,E:63 }, { month:"Feb",A:63,B:51,C:75,D:57,E:66 },
  { month:"Mar",A:66,B:53,C:77,D:60,E:68 }, { month:"Apr",A:68,B:55,C:79,D:62,E:70 },
  { month:"May",A:70,B:57,C:80,D:63,E:72 }, { month:"Jun",A:72,B:58,C:81,D:64,E:74 },
];

const stimDist = [
  { name:"Auditory",value:38,color:"#3535C5" }, { name:"Visual",value:34,color:"#8B5CF6" }, { name:"Reading",value:28,color:"#10B981" },
];

const COLORS = ["#3535C5","#7C3AED","#10B981","#F97316","#F59E0B"];
const tabs = ["Division Overview", "Cohort Comparison", "Subject Analysis"];

const readinessColor = (r) => r >= 75 ? "text-green-600 bg-green-50" : r >= 60 ? "text-blue-600 bg-blue-50" : "text-red-600 bg-red-50";

export function AdminAnalytics({ navigate, user, onLogout }) {
  const [tab, setTab] = useState("Division Overview");

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="admin-analytics">
      <div className="p-5 space-y-5">

        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1a3a5c] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2"><span className="text-xs bg-white/15 px-2 py-0.5 rounded font-mono">ADMIN</span><span className="text-blue-300 text-xs">Division-Level Analytics</span></div>
          <h2 className="mb-1" style={{ fontSize:"1.25rem", fontWeight:700 }}>Analytics Dashboard</h2>
          <p className="text-blue-200/70 text-sm">Division-wide readiness, subject performance, and cohort comparison data.</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 p-1.5 flex gap-1">
          {tabs.map(t => <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? "bg-purple-500 text-white" : "text-gray-500 hover:bg-gray-50"}`}>{t}</button>)}
        </div>

        {/* ── Division Overview ── */}
        {tab === "Division Overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label:"Division Avg Readiness", value:"70%",  icon:Activity,    cls:"text-blue-600 bg-blue-50"   },
                { label:"Learners Passing",        value:"68%",  icon:CheckCircle, cls:"text-green-600 bg-green-50" },
                { label:"Total At-Risk",           value:"21",   icon:AlertCircle, cls:"text-red-600 bg-red-50"     },
                { label:"Cohorts Monitored",       value:"5",    icon:Users,       cls:"text-purple-600 bg-purple-50"},
              ].map(s => { const Icon = s.icon; return (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.cls}`}><Icon className="w-4 h-4" /></div>
                  <div className="text-gray-800 text-xl font-bold">{s.value}</div>
                  <div className="text-gray-500 text-xs">{s.label}</div>
                </div>
              ); })}
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-gray-800 font-semibold text-sm mb-4">Division Readiness Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="month" tick={{ fontSize:10, fill:"#9CA3AF" }} />
                    <YAxis domain={[40,90]} tick={{ fontSize:10, fill:"#9CA3AF" }} />
                    <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
                    {cohorts.map((c, i) => <Line key={c.cohort} type="monotone" dataKey={["A","B","C","D","E"][i]} stroke={COLORS[i]} strokeWidth={2} dot={{ r:2 }} name={c.cohort} />)}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-gray-800 font-semibold text-sm mb-4">Subject Balance (Division)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#E5E7EB" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize:10, fill:"#6B7280" }} />
                    <Radar dataKey="A" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-gray-800 font-semibold text-sm mb-4">Division Subject Performance</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={divisionSubject} margin={{ left:-10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="subject" tick={{ fontSize:10, fill:"#9CA3AF" }} />
                    <YAxis domain={[0,100]} tick={{ fontSize:10, fill:"#9CA3AF" }} />
                    <Tooltip formatter={v => [`${v}%`, "Division Avg"]} contentStyle={{ fontSize:11, borderRadius:8 }} />
                    <Bar dataKey="avg" radius={[6,6,0,0]}>
                      {divisionSubject.map((s,i) => <Cell key={i} fill={s.avg>=75?"#10B981":s.avg>=65?"#3535C5":"#F97316"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-gray-800 font-semibold text-sm mb-4">Stimulus Type Distribution</h3>
                <div className="flex items-center gap-5">
                  <PieChart width={140} height={140}>
                    <Pie data={stimDist} cx={65} cy={65} innerRadius={38} outerRadius={62} dataKey="value" paddingAngle={3}>
                      {stimDist.map((e,i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={v => [`${v}%`, ""]} />
                  </PieChart>
                  <div className="space-y-3 flex-1">
                    {stimDist.map(d => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background:d.color }} />
                        <span className="text-gray-600 text-xs flex-1">{d.name}</span>
                        <span className="text-gray-800 font-bold text-xs">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Cohort Comparison ── */}
        {tab === "Cohort Comparison" && (
          <div className="space-y-4">
            {cohorts.map(c => (
              <div key={c.cohort} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all">
                <div className="flex items-center gap-5 mb-3">
                  <div>
                    <h4 className="text-gray-800 font-bold">{c.cohort}</h4>
                    <div className="text-gray-500 text-xs">Facilitator: {c.facilitator} · {c.learners} learners</div>
                  </div>
                  <div className="flex-1" />
                  <span className={`text-sm font-bold px-3 py-1 rounded-full border ${readinessColor(c.avgReadiness)}`}>{c.avgReadiness}% Readiness</span>
                  {c.atRisk > 0 && <span className="text-red-500 text-xs bg-red-50 px-2 py-1 rounded-full">{c.atRisk} at risk</span>}
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {[["English",c.english],["Math",c.math],["Science",c.science],["Filipino",c.filipino],["AP",c.ap]].map(([subj,val]) => (
                    <div key={subj}>
                      <div className="flex justify-between text-xs mb-1 text-gray-500"><span>{subj}</span><span className={val>=75?"text-green-600":val>=65?"text-blue-600":"text-orange-500"}>{val}%</span></div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${val>=75?"bg-green-500":val>=65?"bg-[#3535C5]":"bg-orange-400"}`} style={{ width:`${val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Subject Analysis ── */}
        {tab === "Subject Analysis" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-gray-800 font-semibold text-sm mb-4">Subject Performance — All Cohorts</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={cohorts} margin={{ left:-5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="cohort" tick={{ fontSize:11, fill:"#9CA3AF" }} />
                  <YAxis domain={[0,100]} tick={{ fontSize:11, fill:"#9CA3AF" }} />
                  <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
                  {["english","math","science","filipino","ap"].map((sub, i) => (
                    <Bar key={sub} dataKey={sub} name={sub.charAt(0).toUpperCase()+sub.slice(1)} fill={COLORS[i]} radius={[4,4,0,0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {divisionSubject.map((s, i) => (
                <div key={s.subject} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                  <div className={`text-2xl font-bold mb-1 ${s.avg>=75?"text-green-600":s.avg>=65?"text-[#3535C5]":"text-orange-500"}`}>{s.avg}%</div>
                  <div className="text-gray-700 text-xs font-medium">{s.subject}</div>
                  <div className={`text-xs mt-1 px-2 py-0.5 rounded-full ${s.avg>=75?"text-green-600 bg-green-50":"text-orange-600 bg-orange-50"}`}>{s.avg>=75?"Passing":"Needs Work"}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
