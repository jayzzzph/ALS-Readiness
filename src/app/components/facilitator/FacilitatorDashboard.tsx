import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { Users, BarChart3, Upload, Download, BookOpen, Brain, Search, Plus, Eye, TrendingUp, AlertCircle, CheckCircle, Star, FileText, Headphones, Video, Activity, X, ChevronRight } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";

const learners = [
  { id: 1, name: "Maria Santos", grade: "Grade 10", readiness: 74, status: "Engaged", stimulus: "Auditory", lastActive: "Today", tests: 3 },
  { id: 2, name: "Jose Reyes", grade: "ALS Secondary", readiness: 58, status: "Neutral", stimulus: "Visual", lastActive: "Yesterday", tests: 2 },
  { id: 3, name: "Ana Cruz", grade: "Grade 9", readiness: 88, status: "Engaged", stimulus: "Reading", lastActive: "Today", tests: 5 },
  { id: 4, name: "Pedro Delos Santos", grade: "ALS Elementary", readiness: 45, status: "Anxious", stimulus: "Auditory", lastActive: "3 days ago", tests: 1 },
  { id: 5, name: "Elena Ramos", grade: "Grade 11", readiness: 82, status: "Engaged", stimulus: "Visual", lastActive: "Today", tests: 4 },
  { id: 6, name: "Carlo Bautista", grade: "ALS Secondary", readiness: 63, status: "Neutral", stimulus: "Reading", lastActive: "2 days ago", tests: 2 },
];

const stimulusDistData = [
  { name: "Auditory", value: 42, color: "#3B82F6" },
  { name: "Visual", value: 35, color: "#8B5CF6" },
  { name: "Reading", value: 23, color: "#10B981" },
];

const readinessDistData = [
  { range: "0-40%", count: 1 },
  { range: "41-60%", count: 2 },
  { range: "61-75%", count: 2 },
  { range: "76-100%", count: 1 },
];

const diagnosticResults = [
  { subject: "English", avg: 73 },
  { subject: "Math", avg: 62 },
  { subject: "Science", avg: 81 },
  { subject: "AP", avg: 68 },
  { subject: "Filipino", avg: 70 },
];

const weeklyProgress = [
  { week: "Wk1", avgReadiness: 58, avgScore: 65 },
  { week: "Wk2", avgReadiness: 63, avgScore: 67 },
  { week: "Wk3", avgReadiness: 67, avgScore: 70 },
  { week: "Wk4", avgReadiness: 71, avgScore: 72 },
  { week: "Wk5", avgReadiness: 74, avgScore: 75 },
];

const contentLibrary = [
  { title: "Algebra Basics — Audio", type: "auditory", subject: "Math", uploaded: "Jun 10", learners: 4 },
  { title: "Philippine History Video Series", type: "visual", subject: "AP", uploaded: "Jun 8", learners: 3 },
  { title: "English Grammar Guide", type: "reading", subject: "English", uploaded: "Jun 5", learners: 5 },
  { title: "Science Lab Simulations", type: "visual", subject: "Science", uploaded: "Jun 1", learners: 5 },
];

const readinessColor = (r) => r >= 80 ? "text-green-600 bg-green-50" : r >= 60 ? "text-blue-600 bg-blue-50" : "text-orange-600 bg-orange-50";
const statusColor = (s) => s === "Engaged" ? "text-green-600 bg-green-50" : s === "Neutral" ? "text-yellow-600 bg-yellow-50" : "text-red-600 bg-red-50";

function LearnerModal({ learner, onClose }) {
  if (!learner) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-gray-800 font-semibold">Learner Profile</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">{learner.name[0]}</div>
            <div>
              <h4 className="text-gray-800 font-semibold text-lg">{learner.name}</h4>
              <p className="text-gray-500 text-sm">{learner.grade}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(learner.status)}`}>{learner.status}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "Readiness Index", value: `${learner.readiness}%` },
              { label: "Stimulus Type", value: learner.stimulus },
              { label: "Tests Completed", value: `${learner.tests}/5` },
              { label: "Last Active", value: learner.lastActive },
            ].map(item => (
              <div key={item.label} className="p-3 bg-gray-50 rounded-xl">
                <div className="text-gray-500 text-xs">{item.label}</div>
                <div className="text-gray-800 font-semibold mt-0.5">{item.value}</div>
              </div>
            ))}
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1.5"><span>Readiness Progress</span><span className="font-semibold">{learner.readiness}%</span></div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${learner.readiness >= 80 ? "bg-green-500" : learner.readiness >= 60 ? "bg-blue-500" : "bg-orange-400"}`} style={{ width: `${learner.readiness}%` }} />
            </div>
          </div>
          {learner.readiness < 60 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-2 text-orange-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> This learner needs intervention. Consider scheduling a 1-on-1 session.
            </div>
          )}
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm transition-colors">Close</button>
          <button className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm transition-colors">Send Message</button>
        </div>
      </div>
    </div>
  );
}

function AddLearnerModal({ onClose }) {
  const [form, setForm] = useState({ name: "", grade: "", email: "" });
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-gray-800 font-semibold">Add New Learner</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-gray-600 text-sm mb-1.5 block">Full Name</label>
            <input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Juan Dela Cruz"
              className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-gray-700 focus:outline-none focus:border-orange-400 text-sm" />
          </div>
          <div>
            <label className="text-gray-600 text-sm mb-1.5 block">Email Address</label>
            <input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="juan@email.com"
              className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-gray-700 focus:outline-none focus:border-orange-400 text-sm" />
          </div>
          <div>
            <label className="text-gray-600 text-sm mb-1.5 block">Grade Level</label>
            <select value={form.grade} onChange={e => update("grade", e.target.value)}
              className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-gray-700 focus:outline-none focus:border-orange-400 text-sm">
              <option value="">Select grade level</option>
              {["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", "ALS Elementary", "ALS Secondary"].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm transition-colors">Cancel</button>
          <button onClick={onClose} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm transition-colors font-medium">Add Learner</button>
        </div>
      </div>
    </div>
  );
}

function ExportToast({ report, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 bg-gray-900 text-white rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-3 z-50 animate-pulse">
      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
      <div>
        <div className="font-medium text-sm">Exporting {report}…</div>
        <div className="text-gray-400 text-xs">Your file will download shortly</div>
      </div>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
    </div>
  );
}

export function FacilitatorDashboard({ navigate, user, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [showAddLearner, setShowAddLearner] = useState(false);
  const [exportingReport, setExportingReport] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleExport = (reportTitle) => {
    setExportingReport(reportTitle);
    setTimeout(() => setExportingReport(null), 3000);
  };

  const handleUpload = () => {
    setUploadSuccess(true);
    setTimeout(() => { setShowUpload(false); setUploadSuccess(false); }, 1500);
  };

  const filteredLearners = learners.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) || l.grade.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "cohort", label: "Cohort", icon: Users },
    { id: "content", label: "Content", icon: BookOpen },
    { id: "analytics", label: "Analytics", icon: Activity },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="facilitator-dashboard">
      {selectedLearner && <LearnerModal learner={selectedLearner} onClose={() => setSelectedLearner(null)} />}
      {showAddLearner && <AddLearnerModal onClose={() => setShowAddLearner(false)} />}
      {exportingReport && <ExportToast report={exportingReport} onClose={() => setExportingReport(null)} />}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-white/20 px-2 py-1 rounded font-mono">M05</span>
                <span className="text-orange-100 text-sm">Facilitator / AIS Teacher Dashboard</span>
              </div>
              <h2 className="mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>Welcome, {user?.name || "Facilitator"}!</h2>
              <p className="text-orange-100 text-sm">Manage your cohort, upload content, and view analytics for all learners.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowUpload(!showUpload)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-sm transition-all">
                <Upload className="w-4 h-4" /> Upload Content
              </button>
              <button onClick={() => handleExport("Full Cohort Report")} className="flex items-center gap-2 px-4 py-2 bg-white text-orange-700 rounded-xl text-sm hover:bg-orange-50 transition-all font-medium">
                <Download className="w-4 h-4" /> Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white rounded-2xl border border-gray-100 p-1.5">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex-1 justify-center ${activeTab === tab.id ? "bg-orange-500 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"}`}>
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Upload Panel */}
        {showUpload && (
          <div className="bg-white rounded-2xl border border-orange-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-800" style={{ fontWeight: 600 }}>Upload Content — By Stimulus Type</h3>
              <button onClick={() => setShowUpload(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { type: "Auditory", icon: Headphones, textCls: "text-blue-500", bgCls: "bg-blue-50", borderCls: "border-blue-200 hover:border-blue-400", labelCls: "text-blue-700", subCls: "text-blue-500", accepts: "MP3, WAV, Podcast" },
                { type: "Visual", icon: Video, textCls: "text-purple-500", bgCls: "bg-purple-50", borderCls: "border-purple-200 hover:border-purple-400", labelCls: "text-purple-700", subCls: "text-purple-500", accepts: "MP4, Slides, Infographic" },
                { type: "Reading", icon: BookOpen, textCls: "text-green-500", bgCls: "bg-green-50", borderCls: "border-green-200 hover:border-green-400", labelCls: "text-green-700", subCls: "text-green-500", accepts: "PDF, DOCX, Articles" },
              ].map(({ type, icon: Icon, textCls, bgCls, borderCls, labelCls, subCls, accepts }) => (
                <div key={type} className={`border-2 border-dashed ${borderCls} ${bgCls} rounded-xl p-5 text-center cursor-pointer transition-all`}>
                  <Icon className={`w-8 h-8 ${textCls} mx-auto mb-2`} />
                  <div className={`${labelCls} font-medium`}>{type} Content</div>
                  <div className={`${subCls} text-xs mt-1`}>{accepts}</div>
                  <div className="mt-3 text-xs bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-gray-500">Click to upload</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-gray-600 text-sm mb-2 block">Subject</label>
                <select className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-gray-700 focus:outline-none focus:border-orange-400 text-sm">
                  <option>Mathematics</option><option>English</option><option>Science</option><option>Filipino</option><option>AP</option>
                </select>
              </div>
              <div>
                <label className="text-gray-600 text-sm mb-2 block">Target Readiness Level</label>
                <select className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-gray-700 focus:outline-none focus:border-orange-400 text-sm">
                  <option>All Levels</option><option>Low (0-40%)</option><option>Moderate (41-75%)</option><option>High (76-100%)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowUpload(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleUpload} className={`px-5 py-2.5 rounded-xl transition-colors font-medium flex items-center gap-2 ${uploadSuccess ? "bg-green-500 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"}`}>
                {uploadSuccess ? <><CheckCircle className="w-4 h-4" /> Uploaded!</> : <><Upload className="w-4 h-4" /> Upload Content</>}
              </button>
            </div>
          </div>
        )}

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total Learners", value: "6", icon: Users, textCls: "text-blue-600", bgCls: "bg-blue-50", page: "cohort" },
                { label: "Avg. Readiness", value: "68%", icon: Brain, textCls: "text-teal-600", bgCls: "bg-teal-50", page: "analytics" },
                { label: "Engaged Learners", value: "3", icon: Star, textCls: "text-green-600", bgCls: "bg-green-50", page: "cohort" },
                { label: "At Risk", value: "1", icon: AlertCircle, textCls: "text-red-600", bgCls: "bg-red-50", page: "cohort" },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <button key={stat.label} onClick={() => setActiveTab(stat.page)}
                    className="bg-white rounded-2xl border border-gray-100 p-5 text-left hover:shadow-md transition-all duration-200">
                    <div className={`w-10 h-10 ${stat.bgCls} rounded-xl flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${stat.textCls}`} />
                    </div>
                    <div className="text-gray-800 text-2xl font-bold">{stat.value}</div>
                    <div className="text-gray-500 text-xs">{stat.label}</div>
                    <div className="flex items-center gap-1 text-orange-500 text-xs mt-1">View details <ChevronRight className="w-3 h-3" /></div>
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-gray-800 mb-4" style={{ fontWeight: 600 }}>Stimulus Type Distribution</h3>
                <div className="flex items-center gap-6">
                  <PieChart width={160} height={160}>
                    <Pie data={stimulusDistData} cx={75} cy={75} innerRadius={45} outerRadius={72} dataKey="value" paddingAngle={3}>
                      {stimulusDistData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v}%`, ""]} />
                  </PieChart>
                  <div className="space-y-3 flex-1">
                    {stimulusDistData.map(d => (
                      <div key={d.name} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="text-gray-600 text-sm flex-1">{d.name}</span>
                        <span className="text-gray-800 font-bold text-sm">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-gray-800 mb-4" style={{ fontWeight: 600 }}>Weekly Cohort Progress</h3>
                <ResponsiveContainer width="100%" height={170}>
                  <LineChart data={weeklyProgress}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                    <YAxis domain={[50, 80]} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="avgReadiness" stroke="#0EA5E9" name="Avg Readiness" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="avgScore" stroke="#F59E0B" name="Avg Score" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Cohort */}
        {activeTab === "cohort" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search learners..."
                  className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-gray-700 focus:outline-none focus:border-orange-400 text-sm" />
              </div>
              <button onClick={() => setShowAddLearner(true)} className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm hover:bg-orange-600 transition-colors">
                <Plus className="w-4 h-4" /> Add Learner
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Learner", "Grade Level", "Readiness Index", "Affective State", "Stimulus Type", "Last Active", "Tests Done", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredLearners.map((learner) => (
                    <tr key={learner.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{learner.name[0]}</div>
                          <span className="text-gray-800 text-sm font-medium">{learner.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{learner.grade}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-16">
                            <div className={`h-full rounded-full ${learner.readiness >= 80 ? "bg-green-500" : learner.readiness >= 60 ? "bg-blue-500" : "bg-orange-400"}`} style={{ width: `${learner.readiness}%` }} />
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${readinessColor(learner.readiness)}`}>{learner.readiness}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor(learner.status)}`}>{learner.status}</span></td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{learner.stimulus}</td>
                      <td className="px-4 py-3 text-gray-400 text-sm">{learner.lastActive}</td>
                      <td className="px-4 py-3 text-gray-700 text-sm font-medium">{learner.tests}/5</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelectedLearner(learner)} className="flex items-center gap-1 text-orange-500 hover:text-orange-700 text-sm transition-colors">
                          <Eye className="w-4 h-4" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLearners.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">No learners found matching "{search}"</div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        {activeTab === "content" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-800" style={{ fontWeight: 600 }}>Content Library</h3>
              <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm hover:bg-orange-600 transition-colors">
                <Upload className="w-4 h-4" /> Upload New
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {contentLibrary.map((item, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${item.type === "auditory" ? "bg-blue-50" : item.type === "visual" ? "bg-purple-50" : "bg-green-50"}`}>
                      {item.type === "auditory" ? <Headphones className="w-6 h-6 text-blue-500" /> : item.type === "visual" ? <Video className="w-6 h-6 text-purple-500" /> : <BookOpen className="w-6 h-6 text-green-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-800 font-medium text-sm">{item.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{item.subject}</span>
                        <span className="text-xs text-gray-400">Uploaded {item.uploaded}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-800">{item.learners}</div>
                      <div className="text-xs text-gray-400">learners</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors">Edit</button>
                    <button onClick={() => handleExport(item.title)}
                      className="flex-1 py-1.5 text-xs bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition-colors flex items-center justify-center gap-1">
                      <Download className="w-3 h-3" /> Export
                    </button>
                    <button className="flex-1 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-gray-800 mb-4" style={{ fontWeight: 600 }}>Readiness Index Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={readinessDistData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#F97316" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-gray-800 mb-4" style={{ fontWeight: 600 }}>Diagnostic Test Results</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={diagnosticResults} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                    <YAxis dataKey="subject" type="category" tick={{ fontSize: 11, fill: "#9CA3AF" }} width={55} />
                    <Tooltip formatter={(v) => [`${v}%`, "Avg Score"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="avg" fill="#0EA5E9" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-800" style={{ fontWeight: 600 }}>Individual Learner Analysis</h3>
                <button onClick={() => handleExport("Individual Learner Report")} className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-xl text-sm hover:bg-orange-100 transition-colors">
                  <Download className="w-4 h-4" /> Export
                </button>
              </div>
              <div className="space-y-3">
                {learners.map(l => (
                  <div key={l.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => setSelectedLearner(l)}>
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{l.name[0]}</div>
                    <span className="text-gray-700 text-sm font-medium w-36">{l.name}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${l.readiness >= 80 ? "bg-green-500" : l.readiness >= 60 ? "bg-blue-500" : "bg-orange-400"}`} style={{ width: `${l.readiness}%` }} />
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${readinessColor(l.readiness)}`}>{l.readiness}%</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor(l.status)}`}>{l.status}</span>
                    <span className="text-xs text-gray-500">{l.stimulus}</span>
                    {l.readiness < 60 && <AlertCircle className="w-4 h-4 text-orange-500" />}
                    {l.readiness >= 80 && <CheckCircle className="w-4 h-4 text-green-500" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reports */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-gray-800 mb-4" style={{ fontWeight: 600 }}>Exportable Reports</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { title: "Cohort Readiness Report", desc: "Full readiness index summary for all learners", icon: Brain, format: "PDF / CSV" },
                  { title: "Diagnostic Test Results", desc: "Subject-wise scores and pass/fail analysis", icon: TrendingUp, format: "PDF / XLSX" },
                  { title: "Stimulus Type Distribution", desc: "Learning modality breakdown per learner", icon: BarChart3, format: "PDF" },
                  { title: "Affective State Summary", desc: "EEG-tagged emotion data across sessions", icon: Activity, format: "CSV" },
                  { title: "Content Engagement Report", desc: "Which content types learners engage with most", icon: BookOpen, format: "PDF / CSV" },
                  { title: "Progress Over Time", desc: "Weekly readiness and score trends for the cohort", icon: TrendingUp, format: "PDF / XLSX" },
                ].map((report) => {
                  const Icon = report.icon;
                  return (
                    <div key={report.title} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                          <Icon className="w-5 h-5 text-orange-600" />
                        </div>
                        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">{report.format}</span>
                      </div>
                      <h4 className="text-gray-800 font-medium text-sm mb-1">{report.title}</h4>
                      <p className="text-gray-500 text-xs mb-3">{report.desc}</p>
                      <button onClick={() => handleExport(report.title)}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm transition-colors">
                        <Download className="w-4 h-4" /> Export
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
              <h4 className="text-orange-800 font-semibold mb-2">About Reports</h4>
              <p className="text-orange-700 text-sm">All reports comply with the Data Privacy Act of 2012 (RA 10173). Data can be anonymized for research purposes.</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
