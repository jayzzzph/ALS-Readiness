import { useState } from "react";
import { Download, FileText, BarChart3, Activity, Users, TrendingUp, Clock, CheckCircle, X, BookOpen, Shield } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";

const depEdReports = [
  { id:1,  title:"SF10 — Learner Permanent Record",          desc:"Complete academic records for all ALS learners per cohort.",                         icon:FileText,  format:["PDF"],        category:"DepEd Form", lastGen:"Jun 20, 2026" },
  { id:2,  title:"SF1 — School Register",                   desc:"Enrollment register with learner demographics and ALS level.",                        icon:Users,     format:["PDF","XLSX"], category:"DepEd Form", lastGen:"Jun 18, 2026" },
  { id:3,  title:"Division Readiness Summary",              desc:"Division-wide readiness index report by cohort and ALS level.",                       icon:Activity,  format:["PDF","CSV"],  category:"Analytics",  lastGen:"Jun 17, 2026" },
  { id:4,  title:"Diagnostic Test Results — Division",      desc:"Aggregated subject-wise scores with pass/fail analysis across all cohorts.",          icon:BarChart3, format:["PDF","XLSX"], category:"Analytics",  lastGen:"Jun 15, 2026" },
  { id:5,  title:"ALS Program Progress Report",            desc:"Term progress summary: enrollment, completion rates, and readiness improvement.",      icon:TrendingUp,format:["PDF"],        category:"DepEd Form", lastGen:"Jun 14, 2026" },
  { id:6,  title:"At-Risk Learner Intervention Report",    desc:"Learners below 60% readiness with recommended intervention plans.",                   icon:Activity,  format:["PDF"],        category:"Analytics",  lastGen:"Jun 12, 2026" },
  { id:7,  title:"STEM Content Engagement Summary",        desc:"Which content types (auditory/visual/reading) are most effective per cohort.",        icon:BookOpen,  format:["PDF","CSV"],  category:"Analytics",  lastGen:"Jun 10, 2026" },
  { id:8,  title:"EEG Affective State Division Report",    desc:"Aggregated EEG/affective state data — Engaged, Neutral, Anxious rates.",              icon:Activity,  format:["CSV"],        category:"Analytics",  lastGen:"Jun 8, 2026"  },
  { id:9,  title:"Facilitator Performance Summary",        desc:"Per-facilitator cohort readiness, test completion rates, and content uploads.",        icon:Shield,    format:["PDF","XLSX"], category:"DepEd Form", lastGen:"Jun 6, 2026"  },
  { id:10, title:"TRIBE v2 Brain Response Division Summary",desc:"Peak engagement windows and brain activation data across all uploaded content.",     icon:BarChart3, format:["PDF","CSV"],  category:"Analytics",  lastGen:"Jun 4, 2026"  },
];

const categories = ["All","DepEd Form","Analytics"];

function ExportToast({ report, format, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 bg-[#0B1F3A] text-white rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-3 z-50">
      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
      <div><div className="font-semibold text-sm">Generating {format}…</div><div className="text-blue-300 text-xs">{report}</div></div>
      <button onClick={onClose} className="text-blue-300 hover:text-white ml-2"><X className="w-4 h-4" /></button>
    </div>
  );
}

export function AdminReports({ navigate, user, onLogout }) {
  const [category, setCategory] = useState("All");
  const [exporting, setExporting] = useState(null);
  const [exported,  setExported]  = useState([]);

  const filtered = depEdReports.filter(r => category === "All" || r.category === category);

  const handleExport = (title, format) => {
    const key = `${title}-${format}`;
    setExporting({ title, format });
    setTimeout(() => { setExporting(null); setExported(p => [...p, key]); }, 2500);
  };

  const catColor = { "DepEd Form":"text-purple-600 bg-purple-50", Analytics:"text-blue-600 bg-blue-50" };

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="admin-reports">
      {exporting && <ExportToast report={exporting.title} format={exporting.format} onClose={() => setExporting(null)} />}

      <div className="p-5 space-y-5">
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1a3a5c] rounded-2xl p-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2"><span className="text-xs bg-white/15 px-2 py-0.5 rounded font-mono">ADMIN</span><span className="text-blue-300 text-xs">DepEd Reports Center</span></div>
            <h2 className="mb-1" style={{ fontSize:"1.25rem", fontWeight:700 }}>DepEd Reports</h2>
            <p className="text-blue-200/70 text-sm">Generate and export official DepEd forms and division analytics for submission.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-400 text-white rounded-xl text-sm font-medium transition-colors">
            <Download className="w-4 h-4" /> Export All Reports
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:"Total Reports",    value:depEdReports.length,                                        icon:FileText,  cls:"text-purple-600 bg-purple-50" },
            { label:"DepEd Forms",      value:depEdReports.filter(r=>r.category==="DepEd Form").length,   icon:Shield,    cls:"text-blue-600 bg-blue-50"     },
            { label:"Analytics Reports",value:depEdReports.filter(r=>r.category==="Analytics").length,    icon:BarChart3, cls:"text-teal-600 bg-teal-50"     },
            { label:"Reports Generated",value:exported.length,                                             icon:CheckCircle,cls:"text-green-600 bg-green-50"  },
          ].map(s => { const Icon = s.icon; return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.cls}`}><Icon className="w-4 h-4" /></div>
              <div className="text-gray-800 text-xl font-bold">{s.value}</div>
              <div className="text-gray-500 text-xs">{s.label}</div>
            </div>
          ); })}
        </div>

        {/* Filter tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 p-1.5 flex gap-1">
          {categories.map(c => <button key={c} onClick={() => setCategory(c)} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${category === c ? "bg-purple-500 text-white" : "text-gray-500 hover:bg-gray-50"}`}>{c}</button>)}
        </div>

        {/* Reports grid */}
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(report => {
            const Icon = report.icon;
            return (
              <div key={report.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${catColor[report.category]}`}>{report.category}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{report.lastGen}</span>
                  </div>
                </div>
                <h4 className="text-gray-800 font-semibold text-sm mb-1 leading-snug">{report.title}</h4>
                <p className="text-gray-500 text-xs leading-relaxed mb-4">{report.desc}</p>
                <div className="flex gap-2">
                  {report.format.map(fmt => {
                    const key    = `${report.title}-${fmt}`;
                    const isDone = exported.includes(key);
                    return (
                      <button key={fmt} onClick={() => handleExport(report.title, fmt)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${isDone ? "bg-green-50 border border-green-200 text-green-600" : "bg-[#0B1F3A] hover:bg-[#152e56] text-white"}`}>
                        {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                        {isDone ? `${fmt} ✓` : `Export ${fmt}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legal notice */}
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
          <h4 className="text-purple-800 font-semibold text-sm mb-1">DepEd Compliance Notice</h4>
          <p className="text-purple-700 text-xs leading-relaxed">
            All reports are generated in accordance with DepEd Order No. 08, s. 2015 (Policy Guidelines on Classroom Assessment) and the
            Alternative Learning System framework. Reports comply with <strong>RA 10173 (Data Privacy Act of 2012)</strong>.
            Personally identifiable information may be anonymized for research purposes. Reports must be authorized before external sharing.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
