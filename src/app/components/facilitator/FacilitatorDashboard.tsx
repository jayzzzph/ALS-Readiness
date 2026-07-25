import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
import { Users, TrendingUp, BookOpen, AlertCircle, CheckCircle, Star, Cpu, ArrowUp, ChevronRight, Flame, Clock, Eye } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";

const stimulusDist = [
  { name: "Auditory", value: 42, color: "#3535C5" },
  { name: "Visual",   value: 35, color: "#8B5CF6" },
  { name: "Reading",  value: 23, color: "#10B981" },
];

const weeklyTrend = [
  { week:"Wk1", readiness:58, score:65 },
  { week:"Wk2", readiness:63, score:67 },
  { week:"Wk3", readiness:67, score:70 },
  { week:"Wk4", readiness:71, score:72 },
  { week:"Wk5", readiness:74, score:75 },
];

const subjectAvg = [
  { subject:"English",  avg:73 },
  { subject:"Math",     avg:62 },
  { subject:"Science",  avg:81 },
  { subject:"Filipino", avg:70 },
  { subject:"AP",       avg:68 },
];

const recentActivity = [
  { name:"Maria Santos",      action:"Completed English test",      score:78,  time:"10 min ago", status:"pass"    },
  { name:"Ana Cruz",          action:"Finished Photosynthesis video",score:null,time:"32 min ago", status:"content" },
  { name:"Elena Ramos",       action:"Completed Science test",      score:85,  time:"1 hr ago",   status:"pass"    },
  { name:"Jose Reyes",        action:"Skipped Math module",         score:null,time:"2 hrs ago",  status:"skip"    },
  { name:"Pedro Delos Santos",action:"Low readiness alert triggered",score:null,time:"3 hrs ago", status:"alert"   },
];

const atRiskLearners = [
  { name:"Pedro Delos Santos", grade:"ALS Elementary", readiness:45, issue:"Low readiness + incomplete tests" },
  { name:"Jose Reyes",         grade:"ALS Secondary",  readiness:58, issue:"Declining scores in Math" },
];

export function FacilitatorDashboard({ navigate, user, onLogout }) {
  const isFaci = user?.role === "facilitator" || user?.role === "admin";
  const label  = user?.role === "admin" ? "Administrator" : "Facilitator";

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="facilitator-dashboard">
      <div className="p-5 space-y-5">

        {/* ── Welcome Banner ── */}
        <div className="bg-[#0B1F3A] rounded-2xl p-5 flex items-center justify-between relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/3 rounded-full" />
          <div className="absolute -right-2 -bottom-12 w-32 h-32 bg-orange-500/10 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-white/15 px-2 py-0.5 rounded font-mono">M05</span>
              <span className="text-orange-300 text-xs">{label} Dashboard</span>
            </div>
            <h2 className="text-white mb-1" style={{ fontSize:"1.3rem", fontWeight:700 }}>
              Good morning, {user?.name?.split(" ")[0] || label}!
            </h2>
            <p className="text-blue-200/70 text-sm">
              You have <span className="text-orange-400 font-semibold">6 learners</span> in your cohort. 1 learner needs attention.
            </p>
          </div>
          <div className="relative z-10 flex gap-3">
            <button onClick={() => navigate("facilitator-cohort")}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl text-sm transition-colors">
              <Users className="w-3.5 h-3.5" /> Manage Cohort
            </button>
            <button onClick={() => navigate("facilitator-content")}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-xl text-sm font-medium transition-colors">
              <Cpu className="w-3.5 h-3.5" /> Upload Content
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:"Total Learners",    value:"6",   change:null,   icon:Users,       cls:"text-blue-600 bg-blue-50",   page:"facilitator-cohort"    },
            { label:"Avg. Readiness",    value:"68%", change:"+6%",  icon:TrendingUp,  cls:"text-teal-600 bg-teal-50",   page:"facilitator-analytics" },
            { label:"Engaged Learners",  value:"3",   change:null,   icon:Star,        cls:"text-green-600 bg-green-50", page:"facilitator-cohort"    },
            { label:"Learners at Risk",  value:"2",   change:null,   icon:AlertCircle, cls:"text-red-600 bg-red-50",     page:"facilitator-analytics" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <button key={s.label} onClick={() => navigate(s.page)}
                className="bg-white rounded-2xl border border-gray-100 p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.cls}`}><Icon className="w-4 h-4" /></div>
                <div className="text-gray-800 text-xl font-bold">{s.value}</div>
                <div className="text-gray-500 text-xs">{s.label}</div>
                {s.change && <div className="text-green-500 text-xs mt-1 flex items-center gap-1"><ArrowUp className="w-3 h-3" />{s.change}</div>}
                <div className="mt-1 flex items-center gap-1 text-orange-500 text-xs"><span>View</span><ChevronRight className="w-3 h-3" /></div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-5">

          {/* ── Stimulus Distribution ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-gray-800 font-semibold text-sm mb-4">Stimulus Distribution</h3>
            <div className="flex items-center gap-4">
              <PieChart width={120} height={120}>
                <Pie data={stimulusDist} cx={55} cy={55} innerRadius={32} outerRadius={55} dataKey="value" paddingAngle={3}>
                  {stimulusDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={v => [`${v}%`, ""]} />
              </PieChart>
              <div className="space-y-2.5 flex-1">
                {stimulusDist.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background:d.color }} />
                    <span className="text-gray-600 text-xs flex-1">{d.name}</span>
                    <span className="text-gray-800 font-bold text-xs">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => navigate("facilitator-analytics")} className="mt-3 w-full text-xs text-orange-500 bg-orange-50 hover:bg-orange-100 rounded-xl py-2 transition-colors flex items-center justify-center gap-1">
              Full analytics <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── Cohort Progress Trend ── */}
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-800 font-semibold text-sm">Cohort Progress — 5 Weeks</h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1"><div className="w-2.5 h-0.5 bg-[#3535C5] rounded" />Readiness</span>
                <span className="flex items-center gap-1"><div className="w-2.5 h-0.5 bg-orange-400 rounded" />Avg Score</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="week" tick={{ fontSize:10, fill:"#9CA3AF" }} />
                <YAxis domain={[50,85]} tick={{ fontSize:10, fill:"#9CA3AF" }} />
                <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
                <Line type="monotone" dataKey="readiness" stroke="#3535C5" strokeWidth={2} dot={{ r:3 }} name="Readiness" />
                <Line type="monotone" dataKey="score"     stroke="#F97316" strokeWidth={2} dot={{ r:3 }} name="Avg Score" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">

          {/* ── Recent Activity ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-800 font-semibold text-sm">Recent Learner Activity</h3>
              <span className="text-xs text-gray-400">Live</span>
            </div>
            <div className="space-y-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">{a.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-800 text-xs font-medium">{a.name}</span>
                    <span className="text-gray-500 text-xs"> — {a.action}</span>
                    {a.score && <span className={`ml-1 text-xs font-semibold ${a.score >= 75 ? "text-green-600" : "text-orange-500"}`}>{a.score}%</span>}
                    <div className="text-gray-400 text-xs flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{a.time}</div>
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${a.status === "pass" ? "bg-green-500" : a.status === "alert" ? "bg-red-500" : a.status === "skip" ? "bg-orange-400" : "bg-blue-400"}`} />
                </div>
              ))}
            </div>
          </div>

          {/* ── At-Risk Learners ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-800 font-semibold text-sm">Needs Attention</h3>
              <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">2 learners</span>
            </div>
            <div className="space-y-3">
              {atRiskLearners.map((l, i) => (
                <div key={i} className="p-3.5 bg-red-50 border border-red-100 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-800 text-sm font-medium">{l.name}</span>
                        <span className="text-red-600 text-xs font-bold">{l.readiness}%</span>
                      </div>
                      <div className="text-gray-500 text-xs">{l.grade}</div>
                      <div className="text-red-600 text-xs mt-1">{l.issue}</div>
                    </div>
                  </div>
                  <button onClick={() => navigate("facilitator-cohort")}
                    className="mt-2.5 w-full text-xs text-red-600 bg-red-100 hover:bg-red-200 rounded-lg py-1.5 transition-colors flex items-center justify-center gap-1">
                    <Eye className="w-3 h-3" /> View profile
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-blue-700 text-xs">Consider scheduling a 1-on-1 intervention session for learners below 60% readiness.</p>
            </div>
          </div>
        </div>

        {/* ── Subject Performance ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-800 font-semibold text-sm">Subject Performance Overview</h3>
            <button onClick={() => navigate("facilitator-analytics")} className="text-xs text-orange-500 hover:underline flex items-center gap-1">Full analytics <ChevronRight className="w-3 h-3" /></button>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={subjectAvg} layout="vertical" margin={{ left:0, right:20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis type="number" domain={[0,100]} tick={{ fontSize:10, fill:"#9CA3AF" }} />
              <YAxis dataKey="subject" type="category" tick={{ fontSize:11, fill:"#6B7280" }} width={60} />
              <Tooltip formatter={v => [`${v}%`, "Avg Score"]} contentStyle={{ fontSize:11, borderRadius:8 }} />
              <Bar dataKey="avg" fill="#F97316" radius={[0,6,6,0]}>
                {subjectAvg.map((_, i) => <Cell key={i} fill={_.avg >= 75 ? "#10B981" : _.avg >= 65 ? "#3535C5" : "#F97316"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-green-500" />≥75% Passing</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-[#3535C5]" />65–74% Average</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-orange-500" />&lt;65% Needs Improvement</span>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
