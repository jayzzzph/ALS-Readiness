import { useState, useRef, useEffect } from "react";
import { Brain, Mail, ChevronLeft, ShieldCheck, RotateCcw } from "lucide-react";

export function VerifyEmail({ navigate, email }) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
    const timer = setInterval(() => {
      setResendCooldown(c => c > 0 ? c - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCodeChange = (idx, val) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 1);
    const next = [...code];
    next[idx] = cleaned;
    setCode(next);
    if (cleaned && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const full = code.join("");
    if (full.length < 6) { setError("Please enter the full 6-digit code."); return; }
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    navigate("reset-password");
  };

  const handleResend = async () => {
    setResending(true);
    await new Promise(r => setTimeout(r, 800));
    setResending(false);
    setResendCooldown(60);
    setCode(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  const isFilled = code.every(c => c !== "");

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
        {/* Icon */}
        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-5 mx-auto">
          <ShieldCheck className="w-7 h-7 text-green-600" />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-gray-800 mb-2" style={{ fontSize: "1.4rem", fontWeight: 700 }}>Check your email</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            We sent a 6-digit verification code to
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Mail className="w-4 h-4 text-[#1a3a6c]" />
            <span className="text-[#1a3a6c] font-semibold text-sm">{email || "your email"}</span>
          </div>
          <p className="text-gray-400 text-xs mt-2">The code expires in 10 minutes.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">{error}</div>
        )}

        {/* OTP inputs */}
        <div className="flex items-center justify-center gap-3 mb-6" onPaste={handlePaste}>
          {code.map((digit, idx) => (
            <input
              key={idx}
              ref={el => inputRefs.current[idx] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleCodeChange(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
              className={`w-12 h-14 text-center text-gray-800 text-xl font-bold border-2 rounded-xl focus:outline-none transition-all duration-150 bg-gray-50 ${digit ? "border-[#1a3a6c] bg-blue-50" : "border-gray-200 focus:border-[#1a3a6c]"}`}
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || !isFilled}
          className="w-full py-3 bg-[#1a3a6c] hover:bg-[#152e56] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-40 mb-4">
          {loading
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : "Verify Code"}
        </button>

        {/* Resend */}
        <div className="text-center">
          {resendCooldown > 0 ? (
            <p className="text-gray-400 text-sm">
              Resend code in <span className="text-[#1a3a6c] font-semibold">{resendCooldown}s</span>
            </p>
          ) : (
            <button onClick={handleResend} disabled={resending}
              className="flex items-center gap-1.5 text-[#1a3a6c] hover:text-[#152e56] text-sm font-medium transition-colors mx-auto disabled:opacity-50">
              <RotateCcw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
              {resending ? "Sending…" : "Resend verification code"}
            </button>
          )}
        </div>

        <button onClick={() => navigate("forgot-password")}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm transition-colors mx-auto mt-5 justify-center w-full">
          <ChevronLeft className="w-4 h-4" /> Use a different email
        </button>
      </div>

      <p className="text-gray-400 text-xs mt-6">ALS Readiness &copy; 2026</p>
    </div>
  );
}
