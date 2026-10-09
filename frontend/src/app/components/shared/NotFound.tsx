import { ArrowLeft, Compass } from "lucide-react";
import { ALSenseLogo } from "./ALSenseLogo";
import { homeLink } from "../../../lib/navigation";
import type { Role } from "../../../lib/api/types";

interface NotFoundProps {
  /** Null when no one is signed in. */
  role: Role | null;
  navigate: (page: string) => void;
}

/** Shown for an address that matches no page, in the look of the Access Restricted page. */
export function NotFound({ role, navigate }: NotFoundProps) {
  const home = homeLink(role);

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-6">
      <div className="mb-10">
        <ALSenseLogo size="md" showSub subText="Empowering Adult Learners" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Compass className="w-8 h-8 text-[#0B1F3A]" aria-hidden="true" />
        </div>
        <h2 className="text-gray-800 mb-2" style={{ fontSize: "1.3rem", fontWeight: 700 }}>Page not found</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          This address does not match any page in ALSense. It may have been mistyped, or the page may have been moved or removed.
        </p>
        <button
          type="button"
          onClick={() => navigate(home.page)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#0B1F3A] hover:bg-[#152e56] text-white rounded-xl font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {home.label}
        </button>
      </div>
    </div>
  );
}
