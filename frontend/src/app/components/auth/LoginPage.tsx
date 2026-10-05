import { useState } from "react";
import { Eye, EyeOff, User, Lock, ChevronLeft, AlertCircle } from "lucide-react";
import { useAuthStore } from "../../../lib/store/authStore";
import { homeForRole } from "../../../lib/navigation";

// TEMPORARY: loads fonts from Google Fonts. Replace with @fontsource imports once `pnpm add` works.
const fontCss = "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');";

const display = { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 } as const;
const body = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A]";
const inputClass =
  "w-full bg-white border border-[#8A8F9C] text-[#1B1D26] text-lg placeholder-[#6B7080] rounded-xl py-3 pl-12 focus:outline-none focus:border-[#00538A] focus:ring-2 focus:ring-[#00538A]/30 transition-colors";

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
    <div className="min-h-screen flex flex-col bg-[#F8F6F2] text-[#1B1D26] selection:bg-[#FFAB2E]/50" style={body}>
      <style>{fontCss}</style>

      <header className="px-8 py-5 bg-white border-b border-[#E2E0DA]">
        <span className="text-[#00538A]" style={{ ...display, fontSize: "1.75rem" }}>ALSense</span>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={() => navigate("landing")}
            className={`flex items-center gap-2 text-[#00538A] font-medium text-base mb-6 hover:underline ${focus}`}
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" /> Back to Home
          </button>

          <div className="bg-white border border-[#E2E0DA] rounded-2xl p-8">
            <h1 className="mb-2 text-[#1B1D26]" style={{ ...display, fontSize: "2.25rem", lineHeight: 1.2 }}>Sign In</h1>
            <p className="text-[#4A4F5C] text-lg mb-6">Enter your ID number and password.</p>

            {error && (
              <div role="alert" className="mb-5 p-4 flex items-start gap-3 bg-[#FDECEA] border border-[#B42318] rounded-xl text-[#7A1A12] text-base">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="id-number" className="text-[#1B1D26] text-base font-bold mb-2 block">ID Number</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4A4F5C]" aria-hidden="true" />
                  <input
                    id="id-number"
                    type="text"
                    autoComplete="username"
                    value={idNo}
                    onChange={e => setIdNo(e.target.value)}
                    placeholder="2026-00001"
                    aria-invalid={error ? true : undefined}
                    className={`${inputClass} pr-4`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="text-[#1B1D26] text-base font-bold mb-2 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4A4F5C]" aria-hidden="true" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    aria-invalid={error ? true : undefined}
                    className={`${inputClass} pr-14`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className={`absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-[#4A4F5C] hover:text-[#1B1D26] rounded-lg transition-colors ${focus}`}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                aria-busy={isLoading}
                className={`w-full py-4 bg-[#00538A] hover:bg-[#004270] text-white text-lg font-bold rounded-xl transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${focus}`}
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-[#E2E0DA] px-8 py-6 text-[#4A4F5C] text-sm">
        &copy; 2026 ALSense
      </footer>
    </div>
  );
}
