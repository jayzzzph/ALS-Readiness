import { useState } from "react";
import { Download, FileText, Brain, BarChart3, Activity, BookOpen, TrendingUp, Clock, CheckCircle, X } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";

const reports = [
  { id:1, title:"Cohort Readiness Report",        desc:"Full readiness index summary with factor breakdown for all 6 learners.",              icon:Brain,     format:["PDF","CSV"],  category:"Readiness",  generated:"Jun 20, 2026" },
  { id:2, title:"Diagnostic Test Results",         desc:"Subject-wise scores, pass/fail analysis, and improvement trends.",                   icon:FileText,  format:["PDF","XLSX"], category:"Tests",      generated:"Jun 19, 2026" },
  { id:3, title:"Stimulus Type Distribution",      desc:"Learning modality breakdown per learner with TRIBE v2 engagement data.",            icon:BarChart3, format:["PDF"],        category:"Content",    generated:"Jun 18, 2026" },
  { id:4, title:"Affective State Summary",         desc:"EEG-tagged emotion data (Engaged/Neutral/Anxious) across all sessions.",           icon:Activity,  format:["CSV"],        category:"Readiness",  generated:"Jun 17, 2026" },
  { id:5, title:"Content Engagement Report",       desc:"Which content types and subjects learners engage with most, by stimulus type.",     icon:BookOpen,  format:["PDF","CSV"],  category:"Content",    generated:"Jun 16, 2026" },
  { id:6, title:"Weekly Progress Overview",        desc:"Weekly readiness and average score trends for the entire cohort.",                  icon:TrendingUp,format:["PDF","XLSX"], category:"Progress",   generated:"Jun 15, 2026" },
  { id:7, title:"At-Risk Learner Report",          desc:"Learners below 60% readiness — includes recommended interventions.",               icon:Activity,  format:["PDF"],        category:"Readiness",  generated:"Jun 14, 2026" },
  { id:8, title:"TRIBE v2 Brain Response Summary", desc:"Peak engagement windows and brain activation scores across all uploaded content.", icon:BarChart3, format:["PDF","CSV"],  category:"Content",    generated:"Jun 13, 2026" },
];

const categories = ["All","Readiness","Tests","Content","Progress"];

function ExportToast({ report, format, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 bg-[#0B1F3A] text-white rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-3 z-50">
      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
      <div>
        <div className="font-semibold text-sm">Exporting {format}…</div>
        <div className="text-blue-300 text-xs">{report}</div>
      </div>
      <button onClick={onClose} className="text-blue-300 hover:text-white ml-2"><X className="w-4 h-4" /></button>
    </div>
  );
}

export function FacilitatorReports({ navigate, user, onLogout }) {
  const [category,   setCategory]   = useState("All");
  const [exporting,  setExporting]  = useState(null);
  const [exported,   setExported]   = useState([]);

  const filtered = reports.filter(r => category === "All" || r.category === category);

  const handleExport = (reportTitle, format) => {
    const key = `${reportTitle}-${format}`;
    setExporting({ title:reportTitle, format });
    setTimeout(() => {
      setExporting(null);
      setExported(p => [...p, key]);
    }, 2500);
  };

  const catColors = { Readiness:"text-blue-600 bg-blue-50", Tests:"text-purple-600 bg-purple-50", Content:"text-green-600 bg-green-50", Progress:"text-orange-600 bg-orange-50" };

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="facilitator-reports">
      {exporting && <ExportToast report={exporting.title} format={exporting.format} onClose={() => setExporting(null)} />}

      <div className="p-5 space-y-5">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1a3a5c] rounded-2xl p-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2"><span className="text-xs bg-white/15 px-2 py-0.5 rounded font-mono">M05</span><span className="text-blue-300 text-xs">Reports Center</span></div>
            <h2 className="mb-1" style={{ fontSize:"1.25rem", fontWeight:700 }}>Exportable Reports</h2>
            <p className="text-blue-200/70 text-sm">All reports comply with the Data Privacy Act of 2012 (RA 10173). Data can be anonymized for research.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-white rounded-xl text-sm font-medium transition-colors">
            <Download className="w-4 h-4" /> Export All (PDF)
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:"Total Reports",     value:reports.length,                                   icon:FileText,  cls:"text-blue-600 bg-blue-50"    },
            { label:"Readiness Reports", value:reports.filter(r=>r.category==="Readiness").length,icon:Activity,  cls:"text-teal-600 bg-teal-50"    },
            { label:"Content Reports",   value:reports.filter(r=>r.category==="Content").length,  icon:BookOpen,  cls:"text-green-600 bg-green-50"  },
            { label:"Reports Exported",  value:Math.floor(exported.length),                       icon:CheckCircle,cls:"text-orange-600 bg-orange-50"},
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.cls}`}><Icon className="w-4 h-4" /></div>
                <div className="text-gray-800 text-xl font-bold">{s.value}</div>
                <div className="text-gray-500 text-xs">{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Category Filter */}
        <div className="bg-white rounded-2xl border border-gray-100 p-1.5 flex gap-1">
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${category === c ? "bg-orange-500 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(report => {
            const Icon = report.icon;
            return (
              <div key={report.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${catColors[report.category]}`}>{report.category}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{report.generated}</span>
                  </div>
                </div>
                <h4 className="text-gray-800 font-semibold mb-1 text-sm">{report.title}</h4>
                <p className="text-gray-500 text-xs leading-relaxed mb-4">{report.desc}</p>
                <div className="flex gap-2">
                  {report.format.map(fmt => {
                    const key     = `${report.title}-${fmt}`;
                    const isDone  = exported.includes(key);
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

        {/* Disclaimer */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <h4 className="text-blue-800 font-semibold text-sm mb-1">About These Reports</h4>
          <p className="text-blue-700 text-xs leading-relaxed">
            Reports are generated from real-time learner data and are intended for official use by authorized facilitators and administrators.
            All exported files comply with <strong>RA 10173 (Data Privacy Act of 2012)</strong>. Personally identifiable information (PII)
            can be anonymized on request. Do not share reports externally without proper authorization.
          </p>
        </div>

      </div>
    </AppLayout>
  );
}
