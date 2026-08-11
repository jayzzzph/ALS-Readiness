import { BookOpen, BarChart3, Users, ChevronRight, Zap, Shield, Target, Brain } from "lucide-react";
import { ALSenseLogo } from "./shared/ALSenseLogo";

const modules = [
  { id: "M01", title: "User Authentication & Role Management", desc: "Secure multi-role access for learners, facilitators, and admins with profile setup wizard.", icon: Shield, tag: "Core" },
  { id: "M02", title: "Diagnostic & Inventory Test Module", desc: "Preparatory Equivalency Exams with validated questionnaires linked to learner accounts.", icon: Target, tag: "Core" },
  { id: "M03", title: "Readiness Profiling Module", desc: "AI-powered readiness prediction using Ensemble Learning and affective state tagging.", icon: Brain, tag: "AI/ML" },
  { id: "M04", title: "Learner Dashboard & Stimulus Content", desc: "Personalized stimulus delivery with auditory, visual, and reading content types.", icon: BookOpen, tag: "FE" },
  { id: "M05", title: "Facilitator / AIS Teacher Dashboard", desc: "Cohort management, analytics, reporting, and exportable results for educators.", icon: BarChart3, tag: "Analytics" },
];

const stats = [
  { label: "Active Learners", value: "2,840", icon: Users },
  { label: "Modules", value: "5", icon: Zap },
  { label: "Success Rate", value: "94%", icon: Target },
  { label: "Content Items", value: "1,200+", icon: BookOpen },
];

export function LandingPage({ navigate }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1F3A] via-[#1a3a5c] to-[#0B1F3A]">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <ALSenseLogo size="md" light showSub subText="Empowering Adult Learners" />
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("login")} className="px-5 py-2 text-blue-200 hover:text-white border border-blue-400/30 hover:border-blue-300 rounded-lg transition-all duration-200">
            Sign In
          </button>
          <button onClick={() => navigate("register")} className="px-5 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/25">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="px-8 pt-20 pb-16 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 rounded-full px-4 py-2 mb-6">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-blue-200 text-sm">Alternative Learning System — AI-Powered Platform</span>
        </div>
        <h1 className="text-white mb-6" style={{ fontSize: "3.5rem", fontWeight: 700, lineHeight: 1.1 }}>
          ALS Readiness
          <span className="block bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text" style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Empowering Adult Learners
          </span>
        </h1>
        <p className="text-blue-200/80 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          A comprehensive educational platform with AI-driven readiness profiling, personalized stimulus delivery, and real-time analytics for ALS students and facilitators.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => navigate("register")} className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white rounded-xl transition-all duration-200 shadow-xl shadow-blue-500/30">
            Start Learning <ChevronRight className="w-5 h-5" />
          </button>
          <button onClick={() => navigate("login")} className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all duration-200">
            <Users className="w-5 h-5" /> Facilitator Login
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-8 pb-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                <Icon className="w-6 h-6 text-blue-300 mx-auto mb-2" />
                <div className="text-white text-2xl font-bold">{stat.value}</div>
                <div className="text-blue-300 text-sm">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modules */}
      <div className="px-8 pb-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-white mb-3" style={{ fontSize: "2rem", fontWeight: 600 }}>Platform Modules</h2>
          <p className="text-blue-300">Five integrated modules powering the complete ALS learning experience</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div key={mod.id} className="bg-white/5 border border-white/10 hover:border-white/25 rounded-2xl p-6 transition-all duration-300 hover:bg-white/8 group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/10">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-400 font-mono bg-blue-500/10 px-2 py-1 rounded">{mod.id}</span>
                    <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">{mod.tag}</span>
                  </div>
                </div>
                <h3 className="text-white mb-2" style={{ fontSize: "1rem", fontWeight: 600 }}>{mod.title}</h3>
                <p className="text-blue-200/70 text-sm leading-relaxed">{mod.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-blue-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Explore module</span><ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <div className="mb-4">
              <ALSenseLogo iconOnly size="lg" />
            </div>
            <h3 className="text-white mb-2" style={{ fontWeight: 600 }}>Ready to begin?</h3>
            <p className="text-blue-200 text-sm mb-4">Join thousands of ALS learners on their journey</p>
            <button onClick={() => navigate("register")} className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-400 hover:to-cyan-400 transition-all duration-200">
              Register Now
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-8 py-6 text-center text-blue-400 text-sm">
        ALSense — Empowering Adult Learners &copy; 2026
      </div>
    </div>
  );
}
