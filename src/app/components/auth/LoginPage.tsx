import { useState } from "react";
import { Brain, Eye, EyeOff, Mail, Lock, ChevronLeft, Shield, Users, BookOpen } from "lucide-react";

const roleOptions = [
  { value: "learner", label: "Learner", desc: "ALS Student", icon: BookOpen },
  { value: "facilitator", label: "Facilitator", desc: "AIS Teacher", icon: Users },
  { value: "admin", label: "Admin", desc: "System Admin", icon: Shield },
];

const demoAccounts = [
  { email: "learner@als.edu", name: "Maria Santos", role: "learner", label: "Demo Learner" },
  { email: "teacher@als.edu", name: "Jose Reyes", role: "facilitator", label: "Demo Facilitator" },
  { email: "admin@als.edu", name: "Admin User", role: "admin", label: "Demo Admin" },
];

export function LoginPage({ navigate, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("learner");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setIsLoading(true);
    setError("");
    await new Promise(r => setTimeout(r, 1000));
    const name = demoAccounts.find(d => d.email === email)?.name || "User";
    onLogin(selectedRole, name, email);
    setIsLoading(false);
  };

  const handleDemoLogin = async (demo) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600));
    onLogin(demo.role, demo.name, demo.email);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#0B1F3A] via-[#1a3a5c] to-[#0B1F3A]">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-white font-semibold text-lg block leading-none">ALS Readiness</span>
            <span className="text-blue-300 text-xs">Empowering Adult Learners</span>
          </div>
        </div>
        <div>
          <h2 className="text-white mb-4" style={{ fontSize: "2.5rem", fontWeight: 700, lineHeight: 1.2 }}>
            Welcome back to your learning journey
          </h2>
          <p className="text-blue-200/70 text-lg mb-8">
            Access your personalized ALS learning experience powered by AI and adaptive content delivery.
          </p>
          <div className="space-y-3">
            {["AI-powered readiness profiling", "Personalized stimulus content delivery", "Real-time progress tracking", "Multi-role access management"].map(feat => (
              <div key={feat} className="flex items-center gap-3 text-blue-200">
                <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-400 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                </div>
                {feat}
              </div>
            ))}
          </div>
        </div>
        <div className="text-blue-400 text-sm">Empowering Adult Learners &copy; 2026</div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <button onClick={() => navigate("landing")} className="flex items-center gap-2 text-blue-300 hover:text-white mb-8 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Home
          </button>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
            <h2 className="text-white mb-1" style={{ fontSize: "1.75rem", fontWeight: 700 }}>Sign In</h2>
            <p className="text-blue-300 mb-6">Module 1 — User Authentication</p>

            <div className="mb-6">
              <label className="text-blue-200 text-sm mb-3 block">Sign in as</label>
              <div className="grid grid-cols-3 gap-2">
                {roleOptions.map((role) => {
                  const Icon = role.icon;
                  return (
                    <button key={role.value} onClick={() => setSelectedRole(role.value)}
                      className={`p-3 rounded-xl border transition-all duration-200 text-center ${selectedRole === role.value ? "border-blue-400 bg-blue-500/20 text-white" : "border-white/10 bg-white/5 text-blue-300 hover:border-white/25"}`}>
                      <Icon className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-xs font-medium">{role.label}</div>
                      <div className="text-xs opacity-60">{role.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-xl text-red-300 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-blue-200 text-sm mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                    className="w-full bg-white/5 border border-white/15 text-white placeholder-blue-400/50 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-blue-400 transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-blue-200 text-sm mb-2 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                  <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/15 text-white placeholder-blue-400/50 rounded-xl py-3 pl-11 pr-12 focus:outline-none focus:border-blue-400 transition-colors" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 hover:text-white transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => navigate("forgot-password")} className="text-blue-400 text-sm hover:text-blue-300 transition-colors">Forgot password?</button>
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2">
                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Sign In"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-blue-400 text-sm mb-3 text-center">Quick Demo Access</p>
              <div className="grid grid-cols-3 gap-2">
                {demoAccounts.map(demo => (
                  <button key={demo.email} onClick={() => handleDemoLogin(demo)} disabled={isLoading}
                    className="p-2 bg-white/5 border border-white/10 hover:border-white/25 rounded-lg text-xs text-blue-300 hover:text-white transition-all duration-200 disabled:opacity-50">
                    {demo.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-center text-blue-400 text-sm mt-6">
              New here?{" "}
              <button onClick={() => navigate("register")} className="text-blue-300 hover:text-white transition-colors">Create account</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
