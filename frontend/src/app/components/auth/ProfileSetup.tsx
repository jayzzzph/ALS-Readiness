import { useState, useRef } from "react";
import { ChevronRight, Camera, Calendar, Phone, MapPin, Briefcase, BookOpen, Check, User } from "lucide-react";
import { ALSenseLogo } from "../shared/ALSenseLogo";

const municipalities = [
  "Biñan, Laguna", "Cabuyao, Laguna", "Calamba, Laguna", "Los Baños, Laguna",
  "San Pedro, Laguna", "Santa Rosa, Laguna", "Manila", "Quezon City", "Makati",
  "Pasig", "Mandaluyong", "Taguig", "Parañaque", "Las Piñas", "Muntinlupa",
  "Caloocan", "Malabon", "Navotas", "Valenzuela", "Marikina", "Pasay", "Pateros",
];

const civilStatuses = ["Single", "Married", "Widowed", "Separated", "Live-in"];

const employmentStatuses = [
  "Employed (Full-time)", "Employed (Part-time)", "Self-employed",
  "Unemployed", "Student", "Irregular Worker", "OFW",
];

const alsLevels = [
  "A&E Elementary", "A&E Secondary", "OSY (Out-of-School Youth)",
  "Adult Learner", "Indigenous Peoples Program", "Non-reader/Newliterate",
];

const learningStyles = [
  { val: "auditory", label: "Auditory Learner", desc: "I learn best through listening — podcasts, audio explanations", icon: "🎧" },
  { val: "visual", label: "Visual Learner", desc: "I learn best through seeing — videos, infographics, diagrams", icon: "👁️" },
  { val: "reading", label: "Reading / Writing", desc: "I learn best through reading and note-taking", icon: "📖" },
  { val: "kinesthetic", label: "Kinesthetic / Hands-on", desc: "I learn best through doing interactive exercises", icon: "🤝" },
];

const steps = [
  { num: 1, label: "Account", short: "Account" },
  { num: 2, label: "Personal Info", short: "Personal" },
  { num: 3, label: "Learning Profile", short: "Profile" },
  { num: 4, label: "Preferences", short: "Preferences" },
];

export function ProfileSetup({ navigate, onComplete }) {
  const [step, setStep] = useState(1);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    role: "learner",
    fullName: "", dob: "", contact: "",
    municipality: "", civilStatus: "", employment: "", alsLevel: "",
    learningStyle: "",
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleComplete = () => {
    onComplete({
      name: form.fullName || "Learner",
      role: form.role,
      email: "learner@als.edu",
    });
  };

  const canProceed = () => {
    if (step === 1) return true;
    if (step === 2) return form.fullName.trim().length > 0;
    if (step === 3) return form.municipality && form.civilStatus && form.employment && form.alsLevel;
    if (step === 4) return form.learningStyle.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-8">
        <ALSenseLogo size="md" showSub subText="Empowering Adult Learners" />
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Step progress bar */}
        <div className="px-8 pt-7 pb-0">
          <div className="flex items-center gap-1 mb-1.5">
            {steps.map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className={`h-1.5 flex-1 rounded-full transition-all duration-400 ${step > s.num ? "bg-[#1a3a6c]" : step === s.num ? "bg-[#1a3a6c]" : "bg-gray-200"}`} />
                {idx < steps.length - 1 && <div className="w-1" />}
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-xs mb-6">
            Step {step} of 4: <span className="text-gray-600 font-medium">{steps[step - 1].label}</span>
          </p>
        </div>

        {/* ── STEP 1: Role ── */}
        {step === 1 && (
          <div className="px-8 pb-8">
            <h2 className="text-gray-800 mb-1" style={{ fontSize: "1.2rem", fontWeight: 700 }}>Welcome! Let's get you set up.</h2>
            <p className="text-gray-400 text-sm mb-6">How will you use ALSense?</p>
            <div className="space-y-3 mb-6">
              {[
                { val: "learner", label: "Learner / ALS Student", desc: "I want to take diagnostic tests and learn", icon: BookOpen },
                { val: "facilitator", label: "Facilitator / AIS Teacher", desc: "I manage a cohort and upload content", icon: User },
              ].map(({ val, label, desc, icon: Icon }) => (
                <button key={val} onClick={() => update("role", val)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${form.role === val ? "border-[#1a3a6c] bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${form.role === val ? "bg-[#1a3a6c]" : "bg-gray-100"}`}>
                    <Icon className={`w-5 h-5 ${form.role === val ? "text-white" : "text-gray-500"}`} />
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold text-sm ${form.role === val ? "text-[#1a3a6c]" : "text-gray-700"}`}>{label}</div>
                    <div className="text-gray-400 text-xs">{desc}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${form.role === val ? "border-[#1a3a6c] bg-[#1a3a6c]" : "border-gray-300"}`}>
                    {form.role === val && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)}
              className="w-full py-3 bg-[#1a3a6c] hover:bg-[#152e56] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── STEP 2: Personal Info ── */}
        {step === 2 && (
          <div className="px-8 pb-8">
            {/* Photo Upload */}
            <div className="flex flex-col items-center mb-6">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              <button onClick={() => fileRef.current.click()}
                className="w-20 h-20 rounded-full border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors overflow-hidden mb-2">
                {photoPreview
                  ? <img src={photoPreview} alt="profile" className="w-full h-full object-cover" />
                  : <Camera className="w-8 h-8 text-blue-400" />}
              </button>
              <button onClick={() => fileRef.current.click()} className="text-[#1a3a6c] text-sm font-medium hover:underline">
                Upload photo
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Full Name */}
              <div>
                <label className="text-gray-600 text-sm font-medium mb-1.5 block">Full Name</label>
                <input
                  value={form.fullName}
                  onChange={e => update("fullName", e.target.value)}
                  placeholder="Juan Dela Cruz"
                  className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#1a3a6c] transition-colors text-sm bg-gray-50"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="text-gray-600 text-sm font-medium mb-1.5 block">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input
                    type="date"
                    value={form.dob}
                    onChange={e => update("dob", e.target.value)}
                    placeholder="MM / DD / YYYY"
                    className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-gray-800 focus:outline-none focus:border-[#1a3a6c] transition-colors text-sm bg-gray-50"
                  />
                </div>
              </div>

              {/* Contact Number */}
              <div>
                <label className="text-gray-600 text-sm font-medium mb-1.5 block">Contact Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input
                    value={form.contact}
                    onChange={e => update("contact", e.target.value)}
                    placeholder="+63 9XX XXX XXXX"
                    className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#1a3a6c] transition-colors text-sm bg-gray-50"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm transition-colors">Back</button>
              <button onClick={() => setStep(3)} disabled={!canProceed()}
                className="flex-1 py-3 bg-[#1a3a6c] hover:bg-[#152e56] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-40">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Learning Profile ── */}
        {step === 3 && (
          <div className="px-8 pb-8">
            <div className="space-y-4 mb-6">
              {/* Municipality/City */}
              <div>
                <label className="text-gray-600 text-sm font-medium mb-1.5 flex items-center gap-1.5 block">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" /> Municipality / City
                </label>
                <div className="relative">
                  <select value={form.municipality} onChange={e => update("municipality", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-gray-800 focus:outline-none focus:border-[#1a3a6c] transition-colors text-sm bg-gray-50 appearance-none">
                    <option value="">Select municipality or city</option>
                    {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▾</div>
                </div>
              </div>

              {/* Civil Status */}
              <div>
                <label className="text-gray-600 text-sm font-medium mb-1.5 block">Civil Status</label>
                <div className="relative">
                  <select value={form.civilStatus} onChange={e => update("civilStatus", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-gray-800 focus:outline-none focus:border-[#1a3a6c] transition-colors text-sm bg-gray-50 appearance-none">
                    <option value="">Select civil status</option>
                    {civilStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▾</div>
                </div>
              </div>

              {/* Employment Status */}
              <div>
                <label className="text-gray-600 text-sm font-medium mb-1.5 flex items-center gap-1.5 block">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400" /> Employment Status
                </label>
                <div className="relative">
                  <select value={form.employment} onChange={e => update("employment", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-gray-800 focus:outline-none focus:border-[#1a3a6c] transition-colors text-sm bg-gray-50 appearance-none">
                    <option value="">Select employment status</option>
                    {employmentStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▾</div>
                </div>
              </div>

              {/* ALS Target Level */}
              <div>
                <label className="text-gray-600 text-sm font-medium mb-1.5 flex items-center gap-1.5 block">
                  <BookOpen className="w-3.5 h-3.5 text-gray-400" /> ALS Target Level
                  <span className="ml-1 w-4 h-4 bg-gray-200 text-gray-500 rounded-full text-xs flex items-center justify-center cursor-help" title="The ALS level you are preparing to pass">?</span>
                </label>
                <div className="relative">
                  <select value={form.alsLevel} onChange={e => update("alsLevel", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-gray-800 focus:outline-none focus:border-[#1a3a6c] transition-colors text-sm bg-gray-50 appearance-none">
                    <option value="">Select ALS target level</option>
                    {alsLevels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▾</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm transition-colors">Back</button>
              <button onClick={() => setStep(4)} disabled={!canProceed()}
                className="flex-1 py-3 bg-[#1a3a6c] hover:bg-[#152e56] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-40">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Learning Preferences ── */}
        {step === 4 && (
          <div className="px-8 pb-8">
            <h2 className="text-gray-800 mb-1" style={{ fontSize: "1rem", fontWeight: 700 }}>How do you learn best?</h2>
            <p className="text-gray-400 text-sm mb-5">This helps us deliver stimulus content matched to your learning modality.</p>
            <div className="space-y-3 mb-6">
              {learningStyles.map(style => (
                <button key={style.val} onClick={() => update("learningStyle", style.val)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-200 ${form.learningStyle === style.val ? "border-[#1a3a6c] bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <span className="text-2xl flex-shrink-0">{style.icon}</span>
                  <div className="flex-1">
                    <div className={`font-semibold text-sm ${form.learningStyle === style.val ? "text-[#1a3a6c]" : "text-gray-700"}`}>{style.label}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{style.desc}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${form.learningStyle === style.val ? "border-[#1a3a6c] bg-[#1a3a6c]" : "border-gray-300"}`}>
                    {form.learningStyle === style.val && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm transition-colors">Back</button>
              <button onClick={handleComplete} disabled={!canProceed()}
                className="flex-1 py-3 bg-[#1a3a6c] hover:bg-[#152e56] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-40">
                Finish Setup <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-gray-400 text-xs mt-6">ALSense &copy; 2026 — Empowering Adult Learners</p>
    </div>
  );
}
