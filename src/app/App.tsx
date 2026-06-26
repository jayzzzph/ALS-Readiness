import { useState } from "react";
import { LandingPage } from "./components/LandingPage";
import { LoginPage } from "./components/auth/LoginPage";
import { RegisterPage } from "./components/auth/RegisterPage";
import { ProfileSetup } from "./components/auth/ProfileSetup";
import { ForgotPassword } from "./components/auth/ForgotPassword";
import { VerifyEmail } from "./components/auth/VerifyEmail";
import { ResetPassword } from "./components/auth/ResetPassword";
import { LearnerDashboard } from "./components/learner/LearnerDashboard";
import { DiagnosticTest } from "./components/diagnostic/DiagnosticTest";
import { ReadinessProfiling } from "./components/readiness/ReadinessProfiling";
import { FacilitatorDashboard } from "./components/facilitator/FacilitatorDashboard";
import { StimulusContent } from "./components/learner/StimulusContent";

export default function App() {
  const [currentPage, setCurrentPage] = useState("landing");
  const [user, setUser] = useState(null);
  const [forgotEmail, setForgotEmail] = useState("");

  const navigate = (page) => setCurrentPage(page);

  const handleLogin = (role, name, email) => {
    setUser({ name, role, email });
    if (role === "facilitator" || role === "admin") {
      setCurrentPage("facilitator-dashboard");
    } else {
      setCurrentPage("learner-dashboard");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage("landing");
  };

  const handleRegister = () => setCurrentPage("profile-setup");

  const handleProfileComplete = (userData) => {
    setUser(userData);
    if (userData.role === "facilitator" || userData.role === "admin") {
      setCurrentPage("facilitator-dashboard");
    } else {
      setCurrentPage("learner-dashboard");
    }
  };

  const handleForgotSubmit = (email) => {
    setForgotEmail(email);
    setCurrentPage("verify-email");
  };

  const commonProps = { navigate, user, onLogout: handleLogout };

  return (
    <div className="size-full min-h-screen bg-[#F0F4F8]">
      {currentPage === "landing" && <LandingPage navigate={navigate} />}
      {currentPage === "login" && <LoginPage navigate={navigate} onLogin={handleLogin} />}
      {currentPage === "register" && <RegisterPage navigate={navigate} onRegister={handleRegister} />}
      {currentPage === "profile-setup" && <ProfileSetup navigate={navigate} onComplete={handleProfileComplete} />}
      {currentPage === "forgot-password" && <ForgotPassword navigate={navigate} onSubmit={handleForgotSubmit} />}
      {currentPage === "verify-email" && <VerifyEmail navigate={navigate} email={forgotEmail} />}
      {currentPage === "reset-password" && <ResetPassword navigate={navigate} />}
      {currentPage === "learner-dashboard" && <LearnerDashboard {...commonProps} />}
      {currentPage === "diagnostic-test" && <DiagnosticTest {...commonProps} />}
      {currentPage === "readiness-profiling" && <ReadinessProfiling {...commonProps} />}
      {currentPage === "stimulus-content" && <StimulusContent {...commonProps} />}
      {currentPage === "facilitator-dashboard" && <FacilitatorDashboard {...commonProps} />}
    </div>
  );
}
