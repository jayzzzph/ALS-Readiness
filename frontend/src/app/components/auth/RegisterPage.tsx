import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, ChevronLeft, BookOpen, Users, Shield } from "lucide-react";
import { ALSenseLogo } from "../shared/ALSenseLogo";

const roleOptions = [
  { value: "learner", label: "Learner", desc: "I am an ALS student seeking to learn", icon: BookOpen },
  { value: "facilitator", label: "Facilitator", desc: "I am an AIS Teacher / Educator", icon: Users },
  { value: "admin", label: "Admin", desc: "I am a system administrator", icon: Shield },
];

export function RegisterPage({ navigate, onRegister }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "", role: "learner" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleNext = () => {
    setError("");
    if (step === 1) {
      if (!form.firstName || !form.lastName || !form.email) { setError("Please fill in all fields."); return; }
      setStep(2);
    } else if (step === 2) {
      if (!form.password || form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    onRegister();
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#0B1F3A] via-[#1a3a5c] to-[#0B1F3A]">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12">
        <ALSenseLogo size="md" light showSub subText="Empowering Adult Learners" />
        <div>
          <h2 className="text-white mb-4" style={{ fontSize: "2.5rem", fontWeight: 700, lineHeight: 1.2 }}>
            Begin your personalized learning journey
          </h2>
          <p className="text-blue-200/70 text-lg mb-8">Create your account and let our AI-powered system profile your learning readiness.</p>
          <div className="space-y-4">
            {[
              { s: 1, label: "Personal Information", desc: "Your name and email address" },
              { s: 2, label: "Account Security", desc: "Set up a strong password" },
              { s: 3, label: "Select Your Role", desc: "Choose how you'll use the platform" },
            ].map(({ s, label, desc }) => (
              <div key={s} className={`flex items-center gap-4 ${step >= s ? "text-white" : "text-blue-400/50"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 flex-shrink-0 ${step > s ? "bg-green-500 border-green-500 text-white" : step === s ? "border-blue-400 text-blue-300" : "border-white/20"}`}>
                  {step > s ? "✓" : s}
                </div>
                <div>
                  <div className="font-medium">{label}</div>
                  <div className="text-xs opacity-70">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-blue-400 text-sm">ALSense &copy; 2026</div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate("landing")} className="flex items-center gap-2 text-blue-300 hover:text-white mb-8 transition-colors">
            <ChevronLeft className="w-4 h-4" /> {step > 1 ? "Back" : "Back to Home"}
          </button>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-blue-400 font-mono bg-blue-500/10 px-2 py-1 rounded">M01</span>
              <span className="text-blue-300 text-xs">User Registration</span>
            </div>
            <h2 className="text-white mb-1" style={{ fontSize: "1.75rem", fontWeight: 700 }}>Create Account</h2>
            <p className="text-blue-400 text-sm mb-6">Step {step} of 3</p>
            <div className="h-1 bg-white/10 rounded-full mb-6">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
            </div>

            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-xl text-red-300 text-sm">{error}</div>}

            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-blue-200 text-sm mb-2 block">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                      <input value={form.firstName} onChange={e => update("firstName", e.target.value)} placeholder="Juan"
                        className="w-full bg-white/5 border border-white/15 text-white placeholder-blue-400/50 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-400 transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="text-blue-200 text-sm mb-2 block">Last Name</label>
                    <input value={form.lastName} onChange={e => update("lastName", e.target.value)} placeholder="Dela Cruz"
                      className="w-full bg-white/5 border border-white/15 text-white placeholder-blue-400/50 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-400 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-blue-200 text-sm mb-2 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                    <input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="juan@email.com"
                      className="w-full bg-white/5 border border-white/15 text-white placeholder-blue-400/50 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-400 transition-colors" />
                  </div>
                </div>
                <button onClick={handleNext} className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-400 hover:to-cyan-400 transition-all duration-200 mt-2">Continue</button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="text-blue-200 text-sm mb-2 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                    <input type={showPassword ? "text" : "password"} value={form.password} onChange={e => update("password", e.target.value)} placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/15 text-white placeholder-blue-400/50 rounded-xl py-3 pl-10 pr-12 focus:outline-none focus:border-blue-400 transition-colors" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-blue-200 text-sm mb-2 block">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                    <input type="password" value={form.confirmPassword} onChange={e => update("confirmPassword", e.target.value)} placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/15 text-white placeholder-blue-400/50 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-400 transition-colors" />
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-3">
                  <p className="text-blue-300 text-xs">Password must be at least 8 characters with uppercase, lowercase, and numbers.</p>
                </div>
                <button onClick={handleNext} className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-400 hover:to-cyan-400 transition-all duration-200">Continue</button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-blue-200 text-sm">How will you use ALSense?</p>
                <div className="space-y-3">
                  {roleOptions.map((role) => {
                    const Icon = role.icon;
                    return (
                      <button key={role.value} onClick={() => update("role", role.value)}
                        className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all duration-200 text-left ${form.role === role.value ? "border-blue-400 bg-blue-500/20" : "border-white/10 bg-white/5 hover:border-white/25"}`}>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${form.role === role.value ? "bg-blue-500" : "bg-white/10"}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{role.label}</div>
                          <div className="text-blue-300 text-sm">{role.desc}</div>
                        </div>
                        {form.role === role.value && (
                          <div className="ml-auto w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <button onClick={handleSubmit} disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-400 hover:to-cyan-400 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Create Account & Set Up Profile"}
                </button>
              </div>
            )}

            <p className="text-center text-blue-400 text-sm mt-6">
              Already have an account?{" "}
              <button onClick={() => navigate("login")} className="text-blue-300 hover:text-white transition-colors">Sign in</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
