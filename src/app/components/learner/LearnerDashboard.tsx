import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { Brain, ClipboardList, BookOpen, TrendingUp, Play, Clock, CheckCircle, AlertCircle, ChevronRight, Star, Zap, Activity } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";

const subjectScores = [
  { subject: "English", score: 78 },
  { subject: "Math", score: 62 },
  { subject: "Science", score: 85 },
  { subject: "Filipino", score: 71 },
  { subject: "AP", score: 69 },
];

const readinessRadial = [{ name: "Readiness", value: 74, fill: "#3B82F6" }];

const recentActivities = [
  { label: "English Diagnostic Test", status: "completed", score: 78, time: "2 hours ago" },
  { label: "Math Module A", status: "in-progress", score: null, time: "Yesterday" },
  { label: "Science Pre-test", status: "completed", score: 85, time: "3 days ago" },
  { label: "Readiness Assessment", status: "pending", score: null, time: "Not started" },
];

const stimulusTypes = [
  { label: "Auditory", percent: 42, color: "bg-blue-500", icon: "🎧" },
  { label: "Visual", percent: 35, color: "bg-purple-500", icon: "👁️" },
  { label: "Reading", percent: 23, color: "bg-green-500", icon: "📖" },
];

export function LearnerDashboard({ navigate, user, onLogout }) {
  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="learner-dashboard">
      <div className="p-6 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1a3a5c] rounded-2xl p-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded font-mono">M04</span>
              <span className="text-blue-300 text-xs">Learner Dashboard</span>
            </div>
            <h2 className="text-white mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>Welcome back, {user?.name || "Learner"}! 👋</h2>
            <p className="text-blue-200 text-sm">Continue your ALS learning journey. Your readiness index is <span className="text-green-400 font-semibold">74%</span>.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate("diagnostic-test")} className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-400/30 text-blue-200 rounded-xl hover:bg-blue-500/30 transition-colors text-sm">
              <ClipboardList className="w-4 h-4" /> Take Test
            </button>
            <button onClick={() => navigate("stimulus-content")} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-400 hover:to-cyan-400 transition-all text-sm">
              <Play className="w-4 h-4" /> Continue Learning
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Readiness Index", value: "74%", change: "+5%", icon: Activity, iconClass: "text-blue-600", bgClass: "bg-blue-50" },
            { label: "Tests Completed", value: "3/8", change: "37%", icon: ClipboardList, iconClass: "text-purple-600", bgClass: "bg-purple-50" },
            { label: "Avg. Score", value: "73%", change: "+2%", icon: Star, iconClass: "text-green-600", bgClass: "bg-green-50" },
            { label: "Learning Streak", value: "7 days", change: "Keep it up!", icon: Zap, iconClass: "text-orange-600", bgClass: "bg-orange-50" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className={`w-10 h-10 ${stat.bgClass} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${stat.iconClass}`} />
                </div>
                <div className="text-gray-800 text-xl font-bold">{stat.value}</div>
                <div className="text-gray-500 text-xs">{stat.label}</div>
                <div className="text-green-500 text-xs mt-1">{stat.change}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Readiness Gauge */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-blue-500" />
              <h3 className="text-gray-800" style={{ fontWeight: 600 }}>Readiness Index</h3>
              <span className="text-xs text-teal-500 bg-teal-50 px-2 py-0.5 rounded font-mono ml-auto">M03</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative">
                <RadialBarChart width={160} height={160} cx={80} cy={80} innerRadius={50} outerRadius={72} startAngle={90} endAngle={-270} data={readinessRadial}>
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background dataKey="value" cornerRadius={8} fill="#3B82F6" />
                </RadialBarChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-800">74%</span>
                  <span className="text-xs text-gray-500">Readiness</span>
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {[{ label: "Socioeconomic", val: 65, color: "bg-blue-400" }, { label: "Academic", val: 78, color: "bg-purple-400" }, { label: "Affective", val: 82, color: "bg-green-400" }].map(f => (
                <div key={f.label} className="flex items-center justify-between text-xs text-gray-500">
                  <span>{f.label}</span>
                  <div className="flex-1 mx-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${f.color} rounded-full`} style={{ width: `${f.val}%` }} />
                  </div>
                  <span>{f.val}%</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate("readiness-profiling")} className="mt-4 w-full text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl py-2 transition-colors flex items-center justify-center gap-1">
              View Full Profile <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Subject Scores */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-purple-500" />
              <h3 className="text-gray-800" style={{ fontWeight: 600 }}>Diagnostic Results</h3>
              <span className="text-xs text-purple-500 bg-purple-50 px-2 py-0.5 rounded font-mono ml-auto">M02</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={subjectScores} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="subject" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} domain={[0, 100]} />
                <Tooltip formatter={(v) => [`${v}%`, "Score"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]} fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
            <button onClick={() => navigate("diagnostic-test")} className="mt-3 w-full text-sm text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl py-2 transition-colors flex items-center justify-center gap-1">
              Take Tests <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Stimulus Type */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-green-500" />
              <h3 className="text-gray-800" style={{ fontWeight: 600 }}>Stimulus Profile</h3>
              <span className="text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded font-mono ml-auto">M04</span>
            </div>
            <div className="space-y-4">
              {stimulusTypes.map((st) => (
                <div key={st.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-2 text-sm text-gray-700"><span>{st.icon}</span>{st.label}</span>
                    <span className="text-sm font-semibold text-gray-800">{st.percent}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${st.color} rounded-full`} style={{ width: `${st.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-xl">
              <p className="text-blue-700 text-xs">Primary modality: <strong>Auditory</strong>. Content is personalized for audio-visual delivery.</p>
            </div>
            <button onClick={() => navigate("stimulus-content")} className="mt-3 w-full text-sm text-green-600 bg-green-50 hover:bg-green-100 rounded-xl py-2 transition-colors flex items-center justify-center gap-1">
              Browse Content <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-800" style={{ fontWeight: 600 }}>Recent Activity</h3>
              <span className="text-xs text-gray-500">Last 7 days</span>
            </div>
            <div className="space-y-3">
              {recentActivities.map((act) => (
                <div key={act.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${act.status === "completed" ? "bg-green-100" : act.status === "in-progress" ? "bg-blue-100" : "bg-gray-100"}`}>
                    {act.status === "completed" ? <CheckCircle className="w-4 h-4 text-green-500" /> : act.status === "in-progress" ? <Play className="w-4 h-4 text-blue-500" /> : <AlertCircle className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-700 text-sm font-medium truncate">{act.label}</div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-400 text-xs">{act.time}</span>
                    </div>
                  </div>
                  {act.score !== null && <span className={`text-sm font-bold ${act.score >= 75 ? "text-green-600" : "text-orange-500"}`}>{act.score}%</span>}
                  {act.status === "pending" && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Pending</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-gray-800 mb-4" style={{ fontWeight: 600 }}>Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Take Diagnostic Test", desc: "M02 — Equivalency Exam", icon: ClipboardList, color: "from-purple-500 to-purple-600", page: "diagnostic-test" },
                { label: "View Readiness Profile", desc: "M03 — AI Profiling", icon: Brain, color: "from-teal-500 to-teal-600", page: "readiness-profiling" },
                { label: "Browse Stimulus Content", desc: "M04 — Personalized Content", icon: BookOpen, color: "from-green-500 to-green-600", page: "stimulus-content" },
                { label: "Track Progress", desc: "M04 — Learning Analytics", icon: TrendingUp, color: "from-blue-500 to-blue-600", page: "learner-dashboard" },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button key={action.label} onClick={() => navigate(action.page)} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-all duration-200">
                    <div className={`w-9 h-9 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-gray-800 text-sm font-medium">{action.label}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{action.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
