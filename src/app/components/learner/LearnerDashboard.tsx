import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { ClipboardList, BookOpen, TrendingUp, Play, Clock, CheckCircle, AlertCircle, ChevronRight, Star, Flame, Activity, Trophy, Brain, Target, ArrowRight } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";

const subjectScores = [
  { subject:"English",  score:78 }, { subject:"Math",    score:62 },
  { subject:"Science",  score:85 }, { subject:"Filipino", score:71 }, { subject:"AP", score:69 },
];
const readinessRadial = [{ name:"R", value:74, fill:"#3535C5" }];

/* Pipeline steps */
const pipelineSteps = [
  { id:"pre-test",  label:"Pre-test",          icon:ClipboardList, page:"diagnostic-test",     status:"done",        desc:"Diagnostic completed"     },
  { id:"eeg",       label:"EEG Profiling",     icon:Brain,         page:"eeg-profiling",        status:"done",        desc:"NeuroSky session done"     },
  { id:"readiness", label:"Readiness Index",   icon:Activity,      page:"readiness-profiling",  status:"done",        desc:"74% readiness"             },
  { id:"content",   label:"Learning Content",  icon:BookOpen,      page:"stimulus-content",     status:"in-progress", desc:"2/6 items completed"       },
  { id:"post-test", label:"Post-test",         icon:Target,        page:"post-test",            status:"pending",     desc:"Not started yet"           },
  { id:"progress",  label:"View Progress",     icon:TrendingUp,    page:"my-progress",          status:"pending",     desc:"Awaiting post-test"        },
];

const statusStyle = {
  done:        "bg-green-500 border-green-500 text-white",
  "in-progress":"bg-[#3535C5] border-[#3535C5] text-white",
  pending:     "bg-gray-100 border-gray-200 text-gray-400",
};

const recentContent = [
  { title:"English Grammar: Verb Tenses", type:"visual",  progress:65 },
  { title:"Philippine History",           type:"reading", progress:100 },
  { title:"Algebra Basics",              type:"auditory", progress:0  },
];

export function LearnerDashboard({ navigate, user, onLogout }) {
  const currentStep = pipelineSteps.findIndex(s => s.status === "in-progress");

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="learner-dashboard">
      <div className="p-5 space-y-5">

        {/* Welcome */}
        <div className="bg-[#0B1F3A] rounded-2xl p-5 flex items-center justify-between relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/3 rounded-full" />
          <div className="relative z-10">
            <p className="text-blue-300 text-xs mb-1">Good morning 👋</p>
            <h2 className="text-white mb-1" style={{ fontSize:"1.2rem", fontWeight:700 }}>Welcome, {user?.name?.split(" ")[0] || "Learner"}!</h2>
            <p className="text-blue-200/70 text-sm">You're on a <span className="text-orange-400 font-semibold">7-day streak</span>. Continue your learning pipeline!</p>
          </div>
          <div className="relative z-10 flex items-center gap-2 bg-orange-500/20 border border-orange-400/30 rounded-xl px-4 py-2.5">
            <Flame className="w-5 h-5 text-orange-400" />
            <div><div className="text-orange-300 text-xs">Streak</div><div className="text-white font-bold">7 days</div></div>
          </div>
        </div>

        {/* ── Learning Pipeline ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-800 font-semibold">Learning Pipeline</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Step {currentStep + 1} of {pipelineSteps.length}</span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-5">
            <div className="h-full bg-gradient-to-r from-[#3535C5] to-cyan-400 rounded-full transition-all duration-500"
              style={{ width:`${((currentStep + 0.5) / pipelineSteps.length) * 100}%` }} />
          </div>
          <div className="flex items-start gap-0">
            {pipelineSteps.map((step, i) => {
              const Icon    = step.icon;
              const isLast  = i === pipelineSteps.length - 1;
              const isDone  = step.status === "done";
              const isActive= step.status === "in-progress";
              const isPend  = step.status === "pending";
              return (
                <div key={step.id} className="flex-1 flex flex-col items-center relative">
                  {/* Connector line */}
                  {!isLast && (
                    <div className={`absolute top-4 left-1/2 w-full h-0.5 z-0 ${isDone ? "bg-green-400" : "bg-gray-200"}`} />
                  )}
                  {/* Circle */}
                  <button
                    onClick={() => !isPend && navigate(step.page)}
                    disabled={isPend}
                    className={`relative z-10 w-9 h-9 rounded-full border-2 flex items-center justify-center mb-2 transition-all ${statusStyle[step.status]} ${!isPend ? "hover:scale-110 cursor-pointer" : "cursor-not-allowed"}`}>
                    {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    {isActive && <div className="absolute -inset-1 rounded-full border-2 border-[#3535C5]/30 animate-ping" />}
                  </button>
                  <div className="text-center px-1">
                    <div className={`text-xs font-semibold ${isPend ? "text-gray-400" : isDone ? "text-green-700" : "text-[#3535C5]"}`}>{step.label}</div>
                    <div className="text-gray-400 text-xs leading-tight mt-0.5">{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Current action */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Current step: <span className="text-[#3535C5]">{pipelineSteps[currentStep]?.label}</span></p>
              <p className="text-gray-400 text-xs">{pipelineSteps[currentStep]?.desc}</p>
            </div>
            <button onClick={() => navigate(pipelineSteps[currentStep]?.page)}
              className="flex items-center gap-2 px-4 py-2 bg-[#3535C5] hover:bg-[#2929a8] text-white rounded-xl text-sm font-medium transition-colors">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:"Readiness Index",  value:"74%",    icon:Activity,      cls:"text-blue-600 bg-blue-50",   page:"readiness-profiling" },
            { label:"Pre-test Avg",     value:"73%",    icon:ClipboardList, cls:"text-purple-600 bg-purple-50",page:"diagnostic-test"     },
            { label:"Learning Streak",  value:"7 days", icon:Flame,         cls:"text-orange-600 bg-orange-50",page:"learner-schedule"    },
            { label:"Achievements",     value:"8",      icon:Trophy,        cls:"text-yellow-600 bg-yellow-50",page:"achievements"        },
          ].map(s => {
            const Icon = s.icon;
            return (
              <button key={s.label} onClick={() => navigate(s.page)}
                className="bg-white rounded-2xl border border-gray-100 p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.cls}`}><Icon className="w-4 h-4" /></div>
                <div className="text-gray-800 text-xl font-bold">{s.value}</div>
                <div className="text-gray-500 text-xs">{s.label}</div>
                <div className="mt-1 text-[#3535C5] text-xs flex items-center gap-1">View <ChevronRight className="w-3 h-3" /></div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Readiness mini */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-800 font-semibold text-sm">Readiness Index</h3>
              <span className="text-xs text-teal-500 bg-teal-50 px-2 py-0.5 rounded font-mono">M03</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <RadialBarChart width={100} height={100} cx={50} cy={50} innerRadius={30} outerRadius={45} startAngle={90} endAngle={-270} data={readinessRadial}>
                  <PolarAngleAxis type="number" domain={[0,100]} angleAxisId={0} tick={false} />
                  <RadialBar background dataKey="value" cornerRadius={6} fill="#3535C5" />
                </RadialBarChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-gray-800">74%</span>
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                {[{ label:"Academic",val:78,c:"bg-blue-500" },{ label:"EEG/Affective",val:82,c:"bg-purple-500" },{ label:"Socioeconomic",val:65,c:"bg-teal-500" }].map(f => (
                  <div key={f.label}>
                    <div className="flex justify-between text-xs text-gray-500 mb-0.5"><span>{f.label}</span><span>{f.val}%</span></div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${f.c} rounded-full`} style={{ width:`${f.val}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => navigate("readiness-profiling")} className="mt-3 w-full text-xs text-[#3535C5] bg-blue-50 hover:bg-blue-100 rounded-xl py-2 transition-colors flex items-center justify-center gap-1">
              Full report <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Diagnostic scores */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-800 font-semibold text-sm">Pre-test Scores</h3>
              <span className="text-xs text-purple-500 bg-purple-50 px-2 py-0.5 rounded font-mono">M02</span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={subjectScores} margin={{ top:0, right:0, left:-25, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="subject" tick={{ fontSize:9, fill:"#9CA3AF" }} />
                <YAxis tick={{ fontSize:9, fill:"#9CA3AF" }} domain={[0,100]} />
                <Tooltip formatter={v => [`${v}%`, "Score"]} contentStyle={{ fontSize:11, borderRadius:8 }} />
                <Bar dataKey="score" radius={[4,4,0,0]} fill="#3535C5" />
              </BarChart>
            </ResponsiveContainer>
            <button onClick={() => navigate("diagnostic-test")} className="mt-2 w-full text-xs text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl py-2 transition-colors flex items-center justify-center gap-1">
              Retake tests <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-gray-800 font-semibold text-sm mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label:"Pre-test",         icon:ClipboardList, color:"from-purple-500 to-purple-600", page:"diagnostic-test"    },
                { label:"EEG Profiling",    icon:Brain,         color:"from-indigo-500 to-indigo-600", page:"eeg-profiling"      },
                { label:"Learning Content", icon:BookOpen,      color:"from-green-500 to-green-600",   page:"stimulus-content"   },
                { label:"Post-test",        icon:Target,        color:"from-orange-500 to-amber-500",  page:"post-test"          },
                { label:"My Progress",      icon:TrendingUp,    color:"from-blue-500 to-blue-600",     page:"my-progress"        },
              ].map(a => {
                const Icon = a.icon;
                return (
                  <button key={a.label} onClick={() => navigate(a.page)}
                    className="w-full flex items-center gap-3 p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors">
                    <div className={`w-7 h-7 bg-gradient-to-br ${a.color} rounded-lg flex items-center justify-center flex-shrink-0`}><Icon className="w-3.5 h-3.5 text-white" /></div>
                    <span className="text-gray-700 text-xs font-medium">{a.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 ml-auto" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent content */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-800 font-semibold text-sm">Recent Learning Content</h3>
            <button onClick={() => navigate("stimulus-content")} className="text-xs text-[#3535C5] hover:underline">See all</button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {recentContent.map(c => (
              <div key={c.title} className="p-3.5 bg-gray-50 rounded-xl">
                <div className="text-xl mb-2">{c.type === "visual" ? "📹" : c.type === "auditory" ? "🎧" : "📖"}</div>
                <div className="text-gray-700 text-xs font-medium mb-2 leading-snug">{c.title}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${c.progress === 100 ? "bg-green-500" : "bg-[#3535C5]"}`} style={{ width:`${c.progress}%` }} />
                  </div>
                  <span className="text-gray-400 text-xs">{c.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
