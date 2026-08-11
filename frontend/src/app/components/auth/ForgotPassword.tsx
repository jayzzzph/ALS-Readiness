import { useState } from "react";
import { Mail, ChevronLeft, ArrowRight } from "lucide-react";
import { ALSenseLogo } from "../shared/ALSenseLogo";

export function ForgotPassword({ navigate, onSubmit }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError("Please enter your email address."); return; }
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    onSubmit(email);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-6">
      <div className="mb-8">
        <ALSenseLogo size="md" showSub subText="Empowering Adult Learners" />
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        {/* Icon */}
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 mx-auto">
          <Mail className="w-7 h-7 text-[#1a3a6c]" />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-gray-800 mb-2" style={{ fontSize: "1.4rem", fontWeight: 700 }}>Forgot your password?</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            No worries! Enter your registered email address and we'll send you a verification code to reset your password.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-600 text-sm font-medium mb-1.5 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#1a3a6c] transition-colors text-sm bg-gray-50"
              />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#1a3a6c] hover:bg-[#152e56] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><span>Send Reset Code</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <button onClick={() => navigate("login")}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm transition-colors mx-auto mt-6 justify-center w-full">
          <ChevronLeft className="w-4 h-4" /> Back to Sign In
        </button>
      </div>

      <p className="text-gray-400 text-xs mt-6">ALSense &copy; 2026</p>
    </div>
  );
}
