import { useState } from "react";
import { Brain, Lock, Eye, EyeOff, ChevronLeft, CheckCircle } from "lucide-react";

const rules = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /[0-9]/.test(p) },
];

export function ResetPassword({ navigate }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const strength = rules.filter(r => r.test(password)).length;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (strength < 4) { setError("Password does not meet all requirements."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-gray-800 font-bold text-lg leading-none block">ALS Readiness</span>
            <span className="text-gray-400 text-xs">Empowering Adult Learners</span>
          </div>
        </div>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-gray-800 mb-2" style={{ fontSize: "1.4rem", fontWeight: 700 }}>Password reset!</h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Your password has been successfully updated. You can now sign in with your new password.
          </p>
          <button onClick={() => navigate("login")}
            className="w-full py-3 bg-[#1a3a6c] hover:bg-[#152e56] text-white rounded-xl font-medium transition-colors">
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-gray-800 font-bold text-lg leading-none block">ALS Readiness</span>
          <span className="text-gray-400 text-xs">Empowering Adult Learners</span>
        </div>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 mx-auto">
          <Lock className="w-7 h-7 text-[#1a3a6c]" />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-gray-800 mb-2" style={{ fontSize: "1.4rem", fontWeight: 700 }}>Set new password</h2>
          <p className="text-gray-400 text-sm">Create a strong password to protect your account.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label className="text-gray-600 text-sm font-medium mb-1.5 block">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl py-3 pl-10 pr-12 text-gray-800 focus:outline-none focus:border-[#1a3a6c] transition-colors text-sm bg-gray-50"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Strength meter */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center gap-1 mb-1.5">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : "bg-gray-200"}`} />
                  ))}
                  <span className={`text-xs font-medium ml-1 ${strength >= 4 ? "text-green-600" : strength >= 3 ? "text-yellow-600" : strength >= 2 ? "text-orange-500" : "text-red-500"}`}>
                    {strengthLabel}
                  </span>
                </div>
                <div className="space-y-1">
                  {rules.map(rule => (
                    <div key={rule.label} className={`flex items-center gap-1.5 text-xs ${rule.test(password) ? "text-green-600" : "text-gray-400"}`}>
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${rule.test(password) ? "bg-green-100" : "bg-gray-100"}`}>
                        {rule.test(password) && <CheckCircle className="w-2.5 h-2.5" />}
                      </div>
                      {rule.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-gray-600 text-sm font-medium mb-1.5 block">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                className={`w-full border rounded-xl py-3 pl-10 pr-12 text-gray-800 focus:outline-none transition-colors text-sm bg-gray-50 ${confirm.length > 0 && confirm !== password ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-[#1a3a6c]"}`}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirm.length > 0 && confirm !== password && (
              <p className="text-red-500 text-xs mt-1">Passwords do not match.</p>
            )}
            {confirm.length > 0 && confirm === password && (
              <p className="text-green-500 text-xs mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Passwords match.</p>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#1a3a6c] hover:bg-[#152e56] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : "Reset Password"}
          </button>
        </form>

        <button onClick={() => navigate("login")}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm transition-colors mx-auto mt-5 justify-center w-full">
          <ChevronLeft className="w-4 h-4" /> Back to Sign In
        </button>
      </div>

      <p className="text-gray-400 text-xs mt-6">ALS Readiness &copy; 2026</p>
    </div>
  );
}
