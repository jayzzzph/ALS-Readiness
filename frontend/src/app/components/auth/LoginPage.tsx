import { useState } from "react";
import { Eye, EyeOff, User, Lock, ChevronLeft, AlertCircle } from "lucide-react";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import { useAuthStore } from "../../../lib/store/authStore";
import { homeForRole } from "../../../lib/navigation";

// TEMPORARY: loads fonts from Google Fonts. Replace with @fontsource imports once `pnpm add` works.
const fontCss = "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');";

// Type roles from DESIGN.md: serif headings, DM Sans chrome, Atkinson Hyperlegible for sentences learners read.
const display = { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 } as const;
const body = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;
const reading = { fontFamily: "'Atkinson Hyperlegible', 'DM Sans', system-ui, sans-serif" } as const;

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A]";
// Strong ease-out: responds immediately, settles softly. All motion here stays under 200ms.
const easeOut = "ease-[cubic-bezier(0.23,1,0.32,1)]";
const labelClass = "block mb-2 text-[0.9375rem] font-bold leading-snug tracking-[0.01em] text-[#1B1D26]";
const iconClass = "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4A4F5C]";
const toggleIcon = "absolute inset-0 w-5 h-5 transition-[opacity,scale,filter] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]";
const toggleIconHidden = "opacity-0 scale-[0.8] blur-[2px] motion-reduce:scale-100 motion-reduce:blur-none";
const inputClass =
  "w-full h-12 pl-12 bg-white border border-[#8A8F9C] rounded-xl text-lg text-[#1B1D26] caret-[#00538A] placeholder:text-[#6B7080] " +
  "hover:border-[#4A4F5C] focus:outline-none focus:border-[#00538A] focus:ring-2 focus:ring-[#00538A]/30 " +
  "aria-[invalid=true]:border-[#B42318] autofill:shadow-[inset_0_0_0_1000px_#FFFFFF] transition-[border-color,box-shadow] duration-150 " + easeOut;

export function LoginPage({ navigate }) {
  const [idNo, setIdNo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idNo || !password) {
      setError("Enter your ID number and password.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await useAuthStore.getState().login(idNo, password);
      const role = useAuthStore.getState().role;
      navigate(homeForRole(role));
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F8F6F2] text-[#1B1D26] selection:bg-[#FFAB2E]/50" style={body}>
      <style>{fontCss}</style>

      <header className="h-16 shrink-0 flex items-center px-8 bg-white border-b border-[#E2E0DA]">
        <span className="text-[#00538A] text-2xl leading-none" style={display}>ALSense</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-[28rem]">
          <button
            type="button"
            onClick={() => navigate("landing")}
            className={`-ml-1 mb-5 inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-[0.9375rem] font-bold text-[#00538A] hover:underline underline-offset-4 ${focus}`}
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" /> Back to Home
          </button>

          <div className="bg-white border border-[#E2E0DA] rounded-2xl p-8">
            <h1 className="mb-2 text-[2rem] leading-[1.2] text-[#1B1D26]" style={display}>Sign In</h1>
            <p className="mb-7 text-lg leading-relaxed text-[#4A4F5C]" style={reading}>Enter your ID number and password.</p>

            {error && (
              <div
                id="login-error"
                role="alert"
                className={`mb-6 flex items-start gap-3 rounded-xl border border-[#B42318] bg-[#FDECEA] p-4 text-[#7A1A12] transition-[opacity,translate] duration-200 ${easeOut} starting:opacity-0 starting:-translate-y-1 motion-reduce:starting:translate-y-0`}
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-lg leading-snug" style={reading}>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div>
                <label htmlFor="id-number" className={labelClass}>ID Number</label>
                <div className="relative">
                  <User className={iconClass} aria-hidden="true" />
                  <input
                    id="id-number"
                    type="text"
                    autoComplete="username"
                    value={idNo}
                    onChange={e => setIdNo(e.target.value)}
                    placeholder="2026-00001"
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? "login-error" : undefined}
                    className={`${inputClass} pr-4 tabular-nums`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className={labelClass}>Password</label>
                <div className="relative">
                  <Lock className={iconClass} aria-hidden="true" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? "login-error" : undefined}
                    className={`${inputClass} pr-14`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    onMouseDown={e => e.preventDefault()}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className={`group absolute right-0.5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-lg text-[#4A4F5C] hover:text-[#1B1D26] hover:bg-[#F2F1ED] active:scale-95 motion-reduce:active:scale-100 transition-[color,background-color,scale] duration-150 ${easeOut} focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#00538A]`}
                  >
                    {/* Both icons stay mounted so the swap can crossfade instead of popping. */}
                    <span className="relative w-5 h-5" aria-hidden="true">
                      <Eye className={`${toggleIcon} ${showPassword ? toggleIconHidden : "opacity-100"}`} />
                      <EyeOff className={`${toggleIcon} ${showPassword ? "opacity-100" : toggleIconHidden}`} />
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                aria-busy={isLoading}
                className={`w-full h-12 px-6 flex items-center justify-center rounded-xl bg-[#00538A] text-white text-base font-bold tracking-[0.01em] hover:bg-[#004270] active:scale-[0.98] motion-reduce:active:scale-100 transition-[background-color,scale] duration-150 ${easeOut} disabled:cursor-wait disabled:active:scale-100 ${focus}`}
              >
                {/* The busy label fades in on mount; the button keeps full color while busy instead of looking disabled. */}
                {isLoading ? (
                  <span key="busy" className={`inline-flex items-center gap-3 transition-opacity duration-150 ${easeOut} starting:opacity-0`}>
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-[spin_0.7s_linear_infinite] motion-reduce:animate-none" aria-hidden="true" />
                    Signing in…
                  </span>
                ) : (
                  <span key="idle">Sign In</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="shrink-0 px-8 py-6 bg-white border-t border-[#E2E0DA] text-sm text-[#4A4F5C]">
        &copy; 2026 ALSense
      </footer>
    </div>
  );
}
