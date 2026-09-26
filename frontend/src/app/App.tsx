import { useEffect, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router";
import { LandingPage } from "./components/LandingPage";
import { LoginPage } from "./components/auth/LoginPage";
import { ChangePasswordPage } from "./components/auth/ChangePasswordPage";
// Learner
import { LearnerDashboard } from "./components/learner/LearnerDashboard";
import { DiagnosticTest } from "./components/diagnostic/DiagnosticTest";
// import { EEGProfiling } from "./components/learner/EEGProfiling"; // route disabled, folded into Pre-test
import { ParticipantIntake } from "./components/diagnostic/ParticipantIntake";
import { StimulusContent } from "./components/learner/StimulusContent";
import { PostTest } from "./components/learner/PostTest";
import { MyProgress } from "./components/learner/MyProgress";
// import { Achievements } from "./components/learner/Achievements"; // route disabled
import { LearnerSchedule } from "./components/learner/LearnerSchedule";
// Facilitator
import { FacilitatorDashboard } from "./components/facilitator/FacilitatorDashboard";
import { FacilitatorCohort } from "./components/facilitator/FacilitatorCohort";
import { FacilitatorContent } from "./components/facilitator/FacilitatorContent";
import { FacilitatorAnalytics } from "./components/facilitator/FacilitatorAnalytics";
import { FacilitatorReports } from "./components/facilitator/FacilitatorReports";
// Admin
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { AdminUsers } from "./components/admin/AdminUsers";
import { AdminAnalytics } from "./components/admin/AdminAnalytics";
import { AdminReports } from "./components/admin/AdminReports";
// Shared
import { AccessDenied } from "./components/shared/AccessDenied";
import { SessionExpired } from "./components/shared/SessionExpired";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import { ProfilePage } from "./components/shared/ProfilePage";
import { Toaster } from "./components/ui/sonner";
// Routing/session plumbing
import { ProtectedPage } from "./routes/ProtectedPage";
import { useAuthStore } from "../lib/store/authStore";
import { CHANGE_PASSWORD_PATH, setNavigateRef, useLegacyNavigate } from "../lib/navigation";

/** Wires the axios interceptor's redirect() helper to this router's navigate. */
function NavigationBridge() {
  const navigate = useNavigate();
  useEffect(() => {
    setNavigateRef((path) => navigate(path));
  }, [navigate]);
  return null;
}

/**
 * While the user's password change is forced (mustChangePassword), every path
 * except the change-password page itself (and session-expired, so a dead
 * session can still be reported) redirects there - a typed URL, a bookmark, the
 * post-login destination, a page refresh, or a user reset mid-session whose
 * next API call tripped the 403 interceptor. One gate here instead of a check
 * per route, so no route (public ones included) can be forgotten.
 */
function ForcedPasswordChangeGate({ children }: { children: ReactNode }) {
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword);
  const { pathname } = useLocation();

  if (mustChangePassword && pathname !== CHANGE_PASSWORD_PATH && pathname !== "/session-expired") {
    return <Navigate to={CHANGE_PASSWORD_PATH} replace />;
  }

  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#0B1F3A]/20 border-t-[#0B1F3A] rounded-full animate-spin" />
    </div>
  );
}

function AccessDeniedRoute() {
  const role = useAuthStore((s) => s.role);
  const navigate = useLegacyNavigate();
  return <AccessDenied role={role} navigate={navigate} />;
}

function AppRoutes() {
  const navigate = useLegacyNavigate();
  const sessionCheckComplete = useAuthStore((s) => s.sessionCheckComplete);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
    // Bootstrap runs exactly once, on app mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!sessionCheckComplete) {
    return <LoadingScreen />;
  }

  return (
    <div className="size-full min-h-screen bg-[#F0F4F8]">
      <NavigationBridge />
      <ForcedPasswordChangeGate>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage navigate={navigate} />} />
        <Route path="/login" element={<LoginPage navigate={navigate} />} />

        {/* Forced password change - deliberately NOT wrapped in ProtectedPage: its AppLayout
            (nav) would let a flagged user navigate away. Guards itself; see ChangePasswordPage. */}
        <Route path={CHANGE_PASSWORD_PATH} element={<ChangePasswordPage />} />
        <Route path="/profile" element={<ProtectedPage allowed={["learner", "facilitator", "admin"]} Component={ProfilePage} />} />

        {/* Learner pipeline */}
        <Route path="/learner-dashboard" element={<ProtectedPage allowed={["learner"]} Component={LearnerDashboard} />} />
        <Route path="/diagnostic-test" element={<ProtectedPage allowed={["learner"]} Component={DiagnosticTest} />} />
        {/* EEG Profiling — folded into the Pre-test flow */}
        {/* <Route path="/eeg-profiling" element={<ProtectedPage allowed={["learner"]} Component={EEGProfiling} />} /> */}
        <Route path="/participant-intake" element={<ProtectedPage allowed={["learner"]} Component={ParticipantIntake} />} />
        <Route path="/stimulus-content" element={<ProtectedPage allowed={["learner"]} Component={StimulusContent} />} />
        <Route path="/post-test" element={<ProtectedPage allowed={["learner"]} Component={PostTest} />} />
        <Route path="/my-progress" element={<ProtectedPage allowed={["learner"]} Component={MyProgress} />} />
        {/* Achievements — hidden for now */}
        {/* <Route path="/achievements" element={<ProtectedPage allowed={["learner"]} Component={Achievements} />} /> */}
        <Route path="/learner-schedule" element={<ProtectedPage allowed={["learner"]} Component={LearnerSchedule} />} />

        {/* Facilitator */}
        <Route path="/facilitator-dashboard" element={<ProtectedPage allowed={["facilitator"]} Component={FacilitatorDashboard} />} />
        <Route path="/facilitator-cohort" element={<ProtectedPage allowed={["facilitator"]} Component={FacilitatorCohort} />} />
        <Route path="/facilitator-content" element={<ProtectedPage allowed={["facilitator"]} Component={FacilitatorContent} />} />
        <Route path="/facilitator-analytics" element={<ProtectedPage allowed={["facilitator"]} Component={FacilitatorAnalytics} />} />
        <Route path="/facilitator-reports" element={<ProtectedPage allowed={["facilitator"]} Component={FacilitatorReports} />} />

        {/* Admin / Coordinator */}
        <Route path="/admin-dashboard" element={<ProtectedPage allowed={["admin"]} Component={AdminDashboard} />} />
        <Route path="/admin-users" element={<ProtectedPage allowed={["admin"]} Component={AdminUsers} />} />
        <Route path="/admin-analytics" element={<ProtectedPage allowed={["admin"]} Component={AdminAnalytics} />} />
        <Route path="/admin-reports" element={<ProtectedPage allowed={["admin"]} Component={AdminReports} />} />

        {/* Session/error utility routes - not linked from anywhere in the app.
            /session-expired is reached via the axios response interceptor (Task 5).
            /access-denied is no longer redirected to by anything (the interceptor's blanket
            403 redirect is gone; RequireRole renders AccessDenied in place) - it stays only so
            a direct visit still resolves. */}
        <Route path="/session-expired" element={<SessionExpired />} />
        <Route path="/access-denied" element={<AccessDeniedRoute />} />
      </Routes>
      </ForcedPasswordChangeGate>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <Toaster />
    </ErrorBoundary>
  );
}
