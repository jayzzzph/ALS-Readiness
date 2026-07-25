import { ShieldX, ArrowLeft } from "lucide-react";
import { ALSenseLogo } from "./ALSenseLogo";

export function AccessDenied({ role, navigate }) {
  const isFaci = role === "facilitator" || role === "admin";
  const home   = isFaci ? "facilitator-dashboard" : "learner-dashboard";

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-6">
      <div className="mb-10">
        <ALSenseLogo size="md" showSub subText="Empowering Adult Learners" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <ShieldX className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-gray-800 mb-2" style={{ fontSize:"1.3rem", fontWeight:700 }}>Access Restricted</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          {isFaci
            ? "Facilitators and administrators cannot access learner-only pages such as Diagnostic Tests, Readiness Profile, and Stimulus Content."
            : "Learners cannot access facilitator-only pages."}
        </p>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-6">
          <p className="text-orange-700 text-xs">
            You are signed in as <strong className="capitalize">{role}</strong>. This page is not available for your role.
          </p>
        </div>
        <button onClick={() => navigate(home)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#0B1F3A] hover:bg-[#152e56] text-white rounded-xl font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {isFaci ? "Back to Facilitator Dashboard" : "Back to Learner Dashboard"}
        </button>
      </div>
    </div>
  );
}
