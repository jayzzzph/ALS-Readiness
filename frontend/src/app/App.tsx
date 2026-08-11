import { useState } from "react";
import { LandingPage }           from "./components/LandingPage";
import { LoginPage }             from "./components/auth/LoginPage";
import { RegisterPage }          from "./components/auth/RegisterPage";
import { ProfileSetup }          from "./components/auth/ProfileSetup";
import { ForgotPassword }        from "./components/auth/ForgotPassword";
import { VerifyEmail }           from "./components/auth/VerifyEmail";
import { ResetPassword }         from "./components/auth/ResetPassword";
// Learner
import { LearnerDashboard }      from "./components/learner/LearnerDashboard";
import { DiagnosticTest }        from "./components/diagnostic/DiagnosticTest";
import { EEGProfiling }          from "./components/learner/EEGProfiling";
import { ReadinessProfiling }    from "./components/readiness/ReadinessProfiling";
import { StimulusContent }       from "./components/learner/StimulusContent";
import { PostTest }              from "./components/learner/PostTest";
import { MyProgress }            from "./components/learner/MyProgress";
import { Achievements }          from "./components/learner/Achievements";
import { LearnerSchedule }       from "./components/learner/LearnerSchedule";
// Facilitator
import { FacilitatorDashboard }  from "./components/facilitator/FacilitatorDashboard";
import { FacilitatorCohort }     from "./components/facilitator/FacilitatorCohort";
import { FacilitatorContent }    from "./components/facilitator/FacilitatorContent";
import { FacilitatorAnalytics }  from "./components/facilitator/FacilitatorAnalytics";
import { FacilitatorReports }    from "./components/facilitator/FacilitatorReports";
// Admin
import { AdminDashboard }        from "./components/admin/AdminDashboard";
import { AdminUsers }            from "./components/admin/AdminUsers";
import { AdminAnalytics }        from "./components/admin/AdminAnalytics";
import { AdminReports }          from "./components/admin/AdminReports";
// Shared
import { AccessDenied }          from "./components/shared/AccessDenied";

/* ── Pages each role can access ── */
const LEARNER_PAGES = new Set([
  "learner-dashboard","diagnostic-test","eeg-profiling","readiness-profiling",
  "stimulus-content","post-test","my-progress","achievements","learner-schedule",
]);
const FACI_PAGES = new Set([
  "facilitator-dashboard","facilitator-cohort","facilitator-content",
  "facilitator-analytics","facilitator-reports",
]);
const ADMIN_PAGES = new Set([
  "admin-dashboard","admin-users","admin-analytics","admin-reports",
]);

function getAllowed(role) {
  if (role === "learner")      return LEARNER_PAGES;
  if (role === "facilitator")  return FACI_PAGES;
  if (role === "admin")        return ADMIN_PAGES;
  return new Set();
}

export default function App() {
  const [currentPage, setCurrentPage] = useState("landing");
  const [user,        setUser]        = useState(null);
  const [forgotEmail, setForgotEmail] = useState("");

  const navigate = (page) => setCurrentPage(page);

  const handleLogin = (role, name, email) => {
    setUser({ name, role, email });
    const home = role === "facilitator" ? "facilitator-dashboard"
               : role === "admin"       ? "admin-dashboard"
               : "learner-dashboard";
    setCurrentPage(home);
  };

  const handleLogout          = () => { setUser(null); setCurrentPage("landing"); };
  const handleRegister        = () => setCurrentPage("profile-setup");
  const handleProfileComplete = (u) => {
    setUser(u);
    const home = u.role === "facilitator" ? "facilitator-dashboard"
               : u.role === "admin"       ? "admin-dashboard"
               : "learner-dashboard";
    setCurrentPage(home);
  };
  const handleForgotSubmit = (email) => { setForgotEmail(email); setCurrentPage("verify-email"); };

  /* ── Role guard ── */
  const publicPages = new Set(["landing","login","register","profile-setup","forgot-password","verify-email","reset-password"]);
  const isProtected = user && !publicPages.has(currentPage);
  const allowed     = user ? getAllowed(user.role) : new Set();
  const isBlocked   = isProtected && !allowed.has(currentPage);

  const lp = { navigate, user, onLogout: handleLogout };

  if (isBlocked) return <AccessDenied role={user.role} navigate={navigate} />;

  return (
    <div className="size-full min-h-screen bg-[#F0F4F8]">
      {/* Public */}
      {currentPage === "landing"             && <LandingPage navigate={navigate} />}
      {currentPage === "login"               && <LoginPage navigate={navigate} onLogin={handleLogin} />}
      {currentPage === "register"            && <RegisterPage navigate={navigate} onRegister={handleRegister} />}
      {currentPage === "profile-setup"       && <ProfileSetup navigate={navigate} onComplete={handleProfileComplete} />}
      {currentPage === "forgot-password"     && <ForgotPassword navigate={navigate} onSubmit={handleForgotSubmit} />}
      {currentPage === "verify-email"        && <VerifyEmail navigate={navigate} email={forgotEmail} />}
      {currentPage === "reset-password"      && <ResetPassword navigate={navigate} />}

      {/* Learner pipeline */}
      {currentPage === "learner-dashboard"   && <LearnerDashboard {...lp} />}
      {currentPage === "diagnostic-test"     && <DiagnosticTest {...lp} />}
      {currentPage === "eeg-profiling"       && <EEGProfiling {...lp} />}
      {currentPage === "readiness-profiling" && <ReadinessProfiling {...lp} />}
      {currentPage === "stimulus-content"    && <StimulusContent {...lp} />}
      {currentPage === "post-test"           && <PostTest {...lp} />}
      {currentPage === "my-progress"         && <MyProgress {...lp} />}
      {currentPage === "achievements"        && <Achievements {...lp} />}
      {currentPage === "learner-schedule"    && <LearnerSchedule {...lp} />}

      {/* Facilitator */}
      {currentPage === "facilitator-dashboard" && <FacilitatorDashboard {...lp} />}
      {currentPage === "facilitator-cohort"    && <FacilitatorCohort {...lp} />}
      {currentPage === "facilitator-content"   && <FacilitatorContent {...lp} />}
      {currentPage === "facilitator-analytics" && <FacilitatorAnalytics {...lp} />}
      {currentPage === "facilitator-reports"   && <FacilitatorReports {...lp} />}

      {/* Admin / Coordinator */}
      {currentPage === "admin-dashboard"  && <AdminDashboard {...lp} />}
      {currentPage === "admin-users"      && <AdminUsers {...lp} />}
      {currentPage === "admin-analytics"  && <AdminAnalytics {...lp} />}
      {currentPage === "admin-reports"    && <AdminReports {...lp} />}
    </div>
  );
}
