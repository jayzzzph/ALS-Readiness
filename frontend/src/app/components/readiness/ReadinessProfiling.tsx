import { RadialBarChart, RadialBar, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Brain, TrendingUp, Activity, AlertCircle, CheckCircle, Smile, Frown, Meh, Info, ChevronRight } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";

const readinessFactors = [
  { label: "Academic Performance", value: 78, desc: "Based on diagnostic test results", icon: "📚" },
  { label: "Socioeconomic Status", value: 65, desc: "Employment, family income indicators", icon: "🏠" },
  { label: "Civil Status", value: 72, desc: "Stability and support factors", icon: "👨‍👩‍👧" },
  { label: "Internet Accessibility", value: 85, desc: "Digital learning capability", icon: "📡" },
  { label: "Device Access", value: 80, desc: "Hardware availability for learning", icon: "📱" },
  { label: "Affective State", value: 82, desc: "EEG-tagged emotional readiness", icon: "🧠" },
];

const historyData = [
  { week: "Wk 1", readiness: 58 },
  { week: "Wk 2", readiness: 62 },
  { week: "Wk 3", readiness: 67 },
  { week: "Wk 4", readiness: 71 },
  { week: "Wk 5", readiness: 74 },
];

const overallReadiness = [{ name: "R", value: 74, fill: "#0EA5E9" }];

const affectiveStates = [
  { state: "Engaged", percent: 68, icon: Smile, colorClass: "text-green-500", bgClass: "bg-green-50" },
  { state: "Neutral", percent: 22, icon: Meh, colorClass: "text-yellow-500", bgClass: "bg-yellow-50" },
  { state: "Anxious", percent: 10, icon: Frown, colorClass: "text-red-500", bgClass: "bg-red-50" },
];

export function ReadinessProfiling({ navigate, user, onLogout }) {
  const overall = 74;

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="readiness-profiling">
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-white/20 px-2 py-1 rounded font-mono">M03</span>
            <span className="text-teal-100 text-sm">Readiness Profiling Module — AI-Powered</span>
          </div>
          <h2 className="mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>Your Readiness Profile</h2>
          <p className="text-teal-100 text-sm">Powered by Ensemble Learning. Readiness index is calculated from socioeconomic attributes, academic performance, and affective state indicators.</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Gauge */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <h3 className="text-gray-800 mb-4" style={{ fontWeight: 600 }}>Overall Readiness Index</h3>
            <div className="relative inline-block">
              <RadialBarChart width={180} height={180} cx={90} cy={90} innerRadius={55} outerRadius={80} startAngle={90} endAngle={-270} data={overallReadiness}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={10} fill="#0EA5E9" />
              </RadialBarChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-800">{overall}%</span>
                <span className="text-xs text-gray-500">Readiness</span>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full border bg-blue-50 border-blue-200">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Moderate Readiness</span>
            </div>
            <div className="mt-4 p-3 bg-teal-50 rounded-xl text-teal-700 text-xs leading-relaxed">
              <Info className="w-3 h-3 inline mr-1" />
              Based on 6 weighted factors using Ensemble Learning model (Random Forest + Gradient Boosting).
            </div>
          </div>

          {/* Factor Breakdown */}
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-gray-800 mb-4" style={{ fontWeight: 600 }}>Readiness Factor Breakdown</h3>
            <div className="grid grid-cols-2 gap-4">
              {readinessFactors.map((factor) => {
                const level = factor.value >= 80 ? "high" : factor.value >= 65 ? "mid" : "low";
                const barColor = level === "high" ? "bg-green-500" : level === "mid" ? "bg-blue-500" : "bg-orange-400";
                const textColor = level === "high" ? "text-green-600" : level === "mid" ? "text-blue-600" : "text-orange-600";
                return (
                  <div key={factor.label} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{factor.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 text-sm font-medium">{factor.label}</span>
                          <span className={`text-sm font-bold ${textColor}`}>{factor.value}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1.5">
                      <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${factor.value}%` }} />
                    </div>
                    <p className="text-gray-400 text-xs">{factor.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Progress */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-teal-500" />
              <h3 className="text-gray-800" style={{ fontWeight: 600 }}>Readiness Progress</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <Tooltip formatter={(v) => [`${v}%`, "Readiness"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="readiness" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-2 mt-2 text-green-600 text-sm">
              <TrendingUp className="w-4 h-4" /><span>+16% improvement over 5 weeks</span>
            </div>
          </div>

          {/* Affective State */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-purple-500" />
              <h3 className="text-gray-800" style={{ fontWeight: 600 }}>Affective State Tagging</h3>
              <span className="text-xs text-purple-500 bg-purple-50 px-2 py-0.5 rounded ml-auto">EEG</span>
            </div>
            <p className="text-gray-500 text-sm mb-4">Based on emotional state data collected during learning sessions.</p>
            <div className="space-y-4">
              {affectiveStates.map(({ state, percent, icon: Icon, colorClass, bgClass }) => (
                <div key={state} className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${bgClass} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${colorClass}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-700 text-sm font-medium">{state}</span>
                      <span className={`text-sm font-bold ${colorClass}`}>{percent}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colorClass.replace("text-", "bg-")}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-purple-50 rounded-xl">
              <p className="text-purple-700 text-xs">Current state: <strong>Engaged</strong> — Optimal for receiving complex content.</p>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-blue-500" />
            <h3 className="text-gray-800" style={{ fontWeight: 600 }}>AI-Generated Recommendations</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { type: "Improve", area: "Mathematics", action: "Complete diagnostic test and focus on algebra modules", icon: AlertCircle, cls: "bg-orange-50 border-orange-200", iconCls: "text-orange-500" },
              { type: "Strength", area: "Science & English", action: "Advance to higher-level stimulus content in these subjects", icon: CheckCircle, cls: "bg-green-50 border-green-200", iconCls: "text-green-500" },
              { type: "Support", area: "Socioeconomic", action: "Offline content packages available for limited connectivity sessions", icon: Info, cls: "bg-blue-50 border-blue-200", iconCls: "text-blue-500" },
            ].map((rec) => {
              const Icon = rec.icon;
              return (
                <div key={rec.area} className={`p-4 rounded-xl border ${rec.cls}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${rec.iconCls}`} />
                    <span className="text-xs font-semibold text-gray-600">{rec.type}</span>
                  </div>
                  <h4 className="text-gray-800 font-medium mb-1">{rec.area}</h4>
                  <p className="text-gray-600 text-sm">{rec.action}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={() => navigate("stimulus-content")} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl hover:from-teal-400 hover:to-cyan-400 transition-all">
              View Recommended Content <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
