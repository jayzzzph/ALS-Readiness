import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Users, TrendingUp, BookOpen, AlertCircle, CheckCircle, ArrowUp, ChevronRight, ShieldCheck, BarChart3 } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";

const divisionStats = [
  { label:"Total Learners",     value:"284",  change:"+12",  icon:Users,       cls:"text-blue-600 bg-blue-50",    page:"admin-users"     },
  { label:"Avg. Readiness",     value:"66%",  change:"+4%",  icon:TrendingUp,  cls:"text-teal-600 bg-teal-50",    page:"admin-analytics" },
  { label:"Facilitators",       value:"18",   change:"+2",   icon:ShieldCheck, cls:"text-orange-600 bg-orange-50",page:"admin-users"     },
  { label:"At-Risk Learners",   value:"42",   change:"-8",   icon:AlertCircle, cls:"text-red-600 bg-red-50",      page:"admin-analytics" },
];

const cohortReadiness = [
  { cohort:"Cohort A",avg:72,facilitator:"J. Santos" },
  { cohort:"Cohort B",avg:58,facilitator:"M. Cruz"   },
  { cohort:"Cohort C",avg:81,facilitator:"R. Reyes"  },
  { cohort:"Cohort D",avg:64,facilitator:"L. Garcia" },
  { cohort:"Cohort E",avg:74,facilitator:"A. Torres" },
];

const divisionTrend = [
  { month:"Jan",readiness:55 }, { month:"Feb",readiness:58 }, { month:"Mar",readiness:61 },
  { month:"Apr",readiness:63 }, { month:"May",readiness:66 }, { month:"Jun",readiness:66 },
];

const stimulusDist = [
  { name:"Auditory", value:38, color:"#3535C5" },
  { name:"Visual",   value:34, color:"#8B5CF6" },
  { name:"Reading",  value:28, color:"#10B981" },
];

const recentFlags = [
  { name:"Pedro Delos Santos", cohort:"Cohort B", readiness:32, issue:"Critical — readiness dropped 13%" },
  { name:"Jose Reyes",         cohort:"Cohort B", readiness:45, issue:"Low readiness — Math avg 42%"     },
  { name:"Rosa Mercado",       cohort:"Cohort D", readiness:51, issue:"Incomplete diagnostic tests (1/5)" },
];

export function AdminDashboard({ navigate, user, onLogout }) {
  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="admin-dashboard">
      <div className="p-5 space-y-5">

        {/* Header */}
        <div className="bg-[#0B1F3A] rounded-2xl p-5 flex items-center justify-between relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/3 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-white/15 px-2 py-0.5 rounded font-mono">ADMIN</span>
              <span className="text-purple-300 text-xs">Program Coordinator / CCES Principal</span>
            </div>
            <h2 className="text-white mb-1" style={{ fontSize:"1.25rem", fontWeight:700 }}>Division Overview</h2>
            <p className="text-blue-200/70 text-sm">Welcome, {user?.name?.split(" ")[0]}. Monitoring all cohorts across the division.</p>
          </div>
          <div className="relative z-10 flex gap-3">
            <button onClick={() => navigate("admin-users")} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl text-sm transition-colors">
              <Users className="w-3.5 h-3.5" /> Manage Accounts
            </button>
            <button onClick={() => navigate("admin-reports")} className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-xl text-sm font-medium transition-colors">
              <BarChart3 className="w-3.5 h-3.5" /> DepEd Reports
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {divisionStats.map(s => {
            const Icon = s.icon;
            return (
              <button key={s.label} onClick={() => navigate(s.page)}
                className="bg-white rounded-2xl border border-gray-100 p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.cls}`}><Icon className="w-4 h-4" /></div>
                <div className="text-gray-800 text-xl font-bold">{s.value}</div>
                <div className="text-gray-500 text-xs">{s.label}</div>
                <div className="text-green-500 text-xs mt-1 flex items-center gap-1"><ArrowUp className="w-3 h-3" />{s.change} this month</div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-5">

          {/* Cohort Readiness comparison */}
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-800 font-semibold text-sm">Cohort Readiness Comparison</h3>
              <button onClick={() => navigate("admin-analytics")} className="text-xs text-purple-500 hover:underline">Full analytics</button>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={cohortReadiness} margin={{ left:-10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="cohort" tick={{ fontSize:11, fill:"#9CA3AF" }} />
                <YAxis domain={[0,100]} tick={{ fontSize:11, fill:"#9CA3AF" }} />
                <Tooltip formatter={v => [`${v}%`, "Avg Readiness"]} contentStyle={{ fontSize:11, borderRadius:8 }} />
                <Bar dataKey="avg" radius={[6,6,0,0]}>
                  {cohortReadiness.map((c, i) => <Cell key={i} fill={c.avg >= 75 ? "#10B981" : c.avg >= 60 ? "#3535C5" : "#F97316"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-green-500" />≥75% Passing</span>
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-[#3535C5]" />60–74% Average</span>
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-orange-500" />&lt;60% Needs Attention</span>
            </div>
          </div>

          {/* Stimulus distribution */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-gray-800 font-semibold text-sm mb-4">Division Stimulus Distribution</h3>
            <div className="flex justify-center mb-3">
              <PieChart width={140} height={140}>
                <Pie data={stimulusDist} cx={65} cy={65} innerRadius={38} outerRadius={62} dataKey="value" paddingAngle={3}>
                  {stimulusDist.map((e,i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={v => [`${v}%`, ""]} />
              </PieChart>
            </div>
            <div className="space-y-2">
              {stimulusDist.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background:d.color }} />
                  <span className="text-gray-600 text-xs flex-1">{d.name}</span>
                  <span className="text-gray-800 font-bold text-xs">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">

          {/* Division trend */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-gray-800 font-semibold text-sm mb-4">Division Readiness Trend (2026)</h3>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={divisionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize:10, fill:"#9CA3AF" }} />
                <YAxis domain={[40,80]} tick={{ fontSize:10, fill:"#9CA3AF" }} />
                <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
                <Line type="monotone" dataKey="readiness" stroke="#7C3AED" strokeWidth={2.5} dot={{ r:3, fill:"#7C3AED" }} name="Avg Readiness" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-2 mt-2 text-xs text-green-600"><ArrowUp className="w-3.5 h-3.5" />+11% improvement since January</div>
          </div>

          {/* At-risk flags */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-800 font-semibold text-sm">Division-wide At-risk Flags</h3>
              <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">42 learners</span>
            </div>
            <div className="space-y-3">
              {recentFlags.map((f, i) => (
                <div key={i} className="p-3 bg-red-50 border border-red-100 rounded-xl">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-gray-800 text-xs font-medium">{f.name}</span>
                    <span className="text-red-600 text-xs font-bold">{f.readiness}%</span>
                  </div>
                  <div className="text-gray-500 text-xs">{f.cohort} · {f.issue}</div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate("admin-analytics")} className="mt-3 w-full text-xs text-red-500 bg-red-50 hover:bg-red-100 rounded-xl py-2 transition-colors flex items-center justify-center gap-1">
              View all flags <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Cohort table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-gray-800 font-semibold text-sm">All Cohorts</h3>
            <button onClick={() => navigate("admin-analytics")} className="text-xs text-purple-500 hover:underline flex items-center gap-1">Full analytics <ChevronRight className="w-3 h-3" /></button>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50"><tr>{["Cohort","Facilitator","Learners","Avg Readiness","At Risk","Status"].map(h => <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {cohortReadiness.map(c => (
                <tr key={c.cohort} className="hover:bg-purple-50/20 transition-colors">
                  <td className="px-4 py-3 text-gray-800 text-sm font-medium">{c.cohort}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{c.facilitator}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{Math.floor(Math.random() * 20) + 25}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${c.avg>=75?"bg-green-500":c.avg>=60?"bg-[#3535C5]":"bg-orange-400"}`} style={{ width:`${c.avg}%` }} /></div>
                      <span className={`text-xs font-bold ${c.avg>=75?"text-green-600":c.avg>=60?"text-blue-600":"text-orange-600"}`}>{c.avg}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-red-500 text-sm font-medium">{Math.floor(Math.random() * 8) + 1}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${c.avg>=75?"text-green-600 bg-green-50":c.avg>=60?"text-blue-600 bg-blue-50":"text-orange-600 bg-orange-50"}`}>{c.avg>=75?"On Track":c.avg>=60?"Average":"Needs Support"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </AppLayout>
  );
}
