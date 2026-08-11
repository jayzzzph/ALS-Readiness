import { useState } from "react";
import { Users, Search, Plus, Eye, AlertCircle, CheckCircle, X, ChevronRight, Mail, Phone, MapPin, BookOpen, Activity, Clock, Send } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";

const contentLibrary = [
  { id:1, title:"Basic Operations & Word Problems", type:"auditory", subject:"Math",    strand:"LS3" },
  { id:2, title:"Philippine History Video Series",   type:"visual",   subject:"AP",     strand:"LS6" },
  { id:3, title:"English Grammar Guide",            type:"reading",  subject:"English", strand:"LS1" },
  { id:4, title:"Photosynthesis Explained",         type:"visual",   subject:"Science", strand:"LS4" },
  { id:5, title:"Filipino Literature: Balagtasan",  type:"auditory", subject:"Filipino",strand:"LS1" },
];

function AssignContentModal({ learner, onClose }) {
  const [selected, setSelected] = useState([]);
  const [sent,     setSent]     = useState(false);

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
  const handleAssign = () => { setSent(true); setTimeout(onClose, 1500); };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-gray-800 font-bold">Assign Content</h3>
            <p className="text-gray-500 text-xs mt-0.5">Assigning to: <span className="font-medium text-gray-700">{learner?.name}</span></p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="p-5">
          <p className="text-gray-500 text-xs mb-3">Select content to assign. Stimulus type matches learner's <span className="text-[#3535C5] font-medium">{learner?.stimulus}</span> profile.</p>
          <div className="space-y-2 mb-4">
            {contentLibrary.map(c => {
              const isSel = selected.includes(c.id);
              const isMatch = c.type === learner?.stimulus?.toLowerCase();
              return (
                <button key={c.id} onClick={() => toggle(c.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${isSel ? "border-[#3535C5] bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${isSel ? "border-[#3535C5] bg-[#3535C5]" : "border-gray-300"}`}>
                    {isSel && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-700 text-sm font-medium truncate">{c.title}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-400"><span>{c.subject}</span><span>·</span><span>{c.type}</span></div>
                  </div>
                  {isMatch && <span className="text-[10px] text-[#3535C5] bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-200 flex-shrink-0">Best Match</span>}
                </button>
              );
            })}
          </div>
          {sent ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle className="w-4 h-4" /> Content assigned! Learner will see it in their feed.
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleAssign} disabled={selected.length === 0}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
                <Send className="w-3.5 h-3.5" /> Assign {selected.length > 0 ? `(${selected.length})` : ""}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const allLearners = [
  { id:1, name:"Maria Santos",       grade:"Grade 10",       readiness:74, status:"Engaged", stimulus:"Auditory", lastActive:"Today",       tests:3, email:"m.santos@als.edu",  contact:"+63 912 345 6789", location:"Cabuyao, Laguna",    alsLevel:"A&E Secondary",   joined:"Jun 1, 2026"  },
  { id:2, name:"Jose Reyes",         grade:"ALS Secondary",  readiness:58, status:"Neutral", stimulus:"Visual",   lastActive:"Yesterday",    tests:2, email:"j.reyes@als.edu",   contact:"+63 917 234 5678", location:"Biñan, Laguna",      alsLevel:"A&E Secondary",   joined:"Jun 3, 2026"  },
  { id:3, name:"Ana Cruz",           grade:"Grade 9",        readiness:88, status:"Engaged", stimulus:"Reading",  lastActive:"Today",        tests:5, email:"a.cruz@als.edu",    contact:"+63 918 123 4567", location:"Calamba, Laguna",    alsLevel:"A&E Secondary",   joined:"May 28, 2026" },
  { id:4, name:"Pedro Delos Santos", grade:"ALS Elementary", readiness:45, status:"Anxious", stimulus:"Auditory", lastActive:"3 days ago",   tests:1, email:"p.delos@als.edu",   contact:"+63 919 876 5432", location:"Los Baños, Laguna",  alsLevel:"A&E Elementary",  joined:"Jun 5, 2026"  },
  { id:5, name:"Elena Ramos",        grade:"Grade 11",       readiness:82, status:"Engaged", stimulus:"Visual",   lastActive:"Today",        tests:4, email:"e.ramos@als.edu",   contact:"+63 920 765 4321", location:"Santa Rosa, Laguna", alsLevel:"A&E Secondary",   joined:"Jun 2, 2026"  },
  { id:6, name:"Carlo Bautista",     grade:"ALS Secondary",  readiness:63, status:"Neutral", stimulus:"Reading",  lastActive:"2 days ago",   tests:2, email:"c.bautista@als.edu",contact:"+63 921 654 3210", location:"San Pedro, Laguna",  alsLevel:"A&E Secondary",   joined:"Jun 6, 2026"  },
];

const readinessColor = (r) => r >= 80 ? "text-green-600 bg-green-50 border-green-200" : r >= 60 ? "text-blue-600 bg-blue-50 border-blue-200" : "text-red-600 bg-red-50 border-red-200";
const statusColor    = (s) => s === "Engaged" ? "text-green-600 bg-green-50" : s === "Neutral" ? "text-yellow-600 bg-yellow-50" : "text-red-600 bg-red-50";

function LearnerModal({ learner, onClose }) {
  if (!learner) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-gray-800 font-bold">Learner Profile</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-400 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0">{learner.name[0]}</div>
            <div>
              <h4 className="text-gray-800 font-bold text-lg">{learner.name}</h4>
              <div className="text-gray-500 text-sm">{learner.grade} · {learner.alsLevel}</div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${statusColor(learner.status)}`}>{learner.status}</span>
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className={`p-3 rounded-xl border text-center ${readinessColor(learner.readiness)}`}>
              <div className="text-xl font-bold">{learner.readiness}%</div>
              <div className="text-xs">Readiness</div>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
              <div className="text-gray-800 text-xl font-bold">{learner.tests}/5</div>
              <div className="text-gray-500 text-xs">Tests Done</div>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
              <div className="text-gray-800 text-sm font-bold">{learner.stimulus}</div>
              <div className="text-gray-500 text-xs">Stimulus Type</div>
            </div>
          </div>
          {/* Details */}
          <div className="space-y-2 mb-4">
            {[
              { icon:Mail,     val:learner.email },
              { icon:Phone,    val:learner.contact },
              { icon:MapPin,   val:learner.location },
              { icon:Clock,    val:`Last active: ${learner.lastActive}` },
              { icon:BookOpen, val:`Joined: ${learner.joined}` },
            ].map(({ icon:Icon, val }) => (
              <div key={val} className="flex items-center gap-2.5 text-sm text-gray-600">
                <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                {val}
              </div>
            ))}
          </div>
          {/* Readiness bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Readiness Progress</span><span className="font-semibold">{learner.readiness}%</span></div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${learner.readiness >= 80 ? "bg-green-500" : learner.readiness >= 60 ? "bg-blue-500" : "bg-red-400"}`} style={{ width:`${learner.readiness}%` }} />
            </div>
          </div>
          {learner.readiness < 60 && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 text-xs mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> This learner needs intervention. Readiness below 60%.
            </div>
          )}
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm transition-colors">Close</button>
          <button className="flex-1 py-2.5 bg-[#0B1F3A] hover:bg-[#152e56] text-white rounded-xl text-sm transition-colors flex items-center justify-center gap-2"><Mail className="w-3.5 h-3.5" /> Send Message</button>
        </div>
      </div>
    </div>
  );
}

function AddLearnerModal({ onClose }) {
  const [form, setForm] = useState({ name:"", email:"", grade:"", level:"" });
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-gray-800 font-bold">Add New Learner</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="p-5 space-y-4">
          {[{ label:"Full Name", key:"name", ph:"Juan Dela Cruz", type:"text" }, { label:"Email Address", key:"email", ph:"juan@email.com", type:"email" }].map(f => (
            <div key={f.key}>
              <label className="text-gray-600 text-sm font-medium mb-1.5 block">{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={e => update(f.key, e.target.value)} placeholder={f.ph}
                className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-gray-700 focus:outline-none focus:border-orange-400 text-sm bg-gray-50" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-600 text-sm font-medium mb-1.5 block">Grade Level</label>
              <select value={form.grade} onChange={e => update("grade", e.target.value)} className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-gray-700 focus:outline-none focus:border-orange-400 text-sm bg-gray-50">
                <option value="">Select</option>
                {["Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12","ALS Elementary","ALS Secondary"].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-600 text-sm font-medium mb-1.5 block">ALS Target Level</label>
              <select value={form.level} onChange={e => update("level", e.target.value)} className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-gray-700 focus:outline-none focus:border-orange-400 text-sm bg-gray-50">
                <option value="">Select</option>
                {["A&E Elementary","A&E Secondary","OSY","Adult Learner"].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={onClose} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors">Add Learner</button>
        </div>
      </div>
    </div>
  );
}

export function FacilitatorCohort({ navigate, user, onLogout }) {
  const [search,         setSearch]         = useState("");
  const [filterStatus,   setFilterStatus]   = useState("All");
  const [filterStimulus, setFilterStimulus] = useState("All");
  const [selectedLearner,setSelectedLearner]= useState(null);
  const [showAdd,        setShowAdd]        = useState(false);
  const [assignTarget,   setAssignTarget]   = useState(null);

  const filtered = allLearners.filter(l =>
    (l.name.toLowerCase().includes(search.toLowerCase()) || l.grade.toLowerCase().includes(search.toLowerCase())) &&
    (filterStatus   === "All" || l.status   === filterStatus) &&
    (filterStimulus === "All" || l.stimulus === filterStimulus)
  );

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="facilitator-cohort">
      {selectedLearner && <LearnerModal learner={selectedLearner} onClose={() => setSelectedLearner(null)} />}
      {showAdd         && <AddLearnerModal onClose={() => setShowAdd(false)} />}
      {assignTarget    && <AssignContentModal learner={assignTarget} onClose={() => setAssignTarget(null)} />}

      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1a3a5c] rounded-2xl p-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2"><span className="text-xs bg-white/15 px-2 py-0.5 rounded font-mono">M05</span><span className="text-blue-300 text-xs">Cohort Management</span></div>
            <h2 className="mb-1" style={{ fontSize:"1.25rem", fontWeight:700 }}>Manage Cohort</h2>
            <p className="text-blue-200/70 text-sm">{allLearners.length} learners enrolled · {allLearners.filter(l => l.status === "Engaged").length} engaged · {allLearners.filter(l => l.readiness < 60).length} at risk</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add Learner
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:"Engaged",       value:allLearners.filter(l=>l.status==="Engaged").length, color:"text-green-600 bg-green-50" },
            { label:"Neutral",       value:allLearners.filter(l=>l.status==="Neutral").length, color:"text-yellow-600 bg-yellow-50" },
            { label:"Anxious",       value:allLearners.filter(l=>l.status==="Anxious").length, color:"text-red-600 bg-red-50" },
            { label:"Tests Complete",value:`${allLearners.reduce((s,l)=>s+l.tests,0)}/30`,     color:"text-blue-600 bg-blue-50" },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border border-gray-100 p-3.5 bg-white`}>
              <div className={`text-xl font-bold ${s.color.split(" ")[0]}`}>{s.value}</div>
              <div className="text-gray-500 text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search learners..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-gray-700 focus:outline-none focus:border-orange-400 text-sm" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 text-xs">Status:</span>
            {["All","Engaged","Neutral","Anxious"].map(f => (
              <button key={f} onClick={() => setFilterStatus(f)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${filterStatus === f ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{f}</button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 text-xs">Stimulus:</span>
            {["All","Auditory","Visual","Reading"].map(f => (
              <button key={f} onClick={() => setFilterStimulus(f)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${filterStimulus === f ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{f}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{["Learner","Grade / ALS Level","Readiness","Affective State","Stimulus","Tests","Last Active","Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-semibold">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(l => (
                <tr key={l.id} className="hover:bg-orange-50/30 transition-colors cursor-pointer" onClick={() => setSelectedLearner(l)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{l.name[0]}</div>
                      <div>
                        <div className="text-gray-800 text-sm font-medium">{l.name}</div>
                        <div className="text-gray-400 text-xs">{l.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700 text-xs font-medium">{l.grade}</div>
                    <div className="text-gray-400 text-xs">{l.alsLevel}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${l.readiness>=80?"bg-green-500":l.readiness>=60?"bg-blue-500":"bg-red-400"}`} style={{ width:`${l.readiness}%` }} />
                      </div>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full border ${readinessColor(l.readiness)}`}>{l.readiness}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor(l.status)}`}>{l.status}</span></td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{l.stimulus}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => <div key={i} className={`w-3 h-3 rounded-sm ${i<=l.tests?"bg-orange-400":"bg-gray-200"}`} />)}
                    </div>
                    <div className="text-gray-400 text-xs mt-0.5">{l.tests}/5</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{l.lastActive}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedLearner(l)} className="flex items-center gap-1 text-orange-500 hover:text-orange-700 text-xs font-medium transition-colors">
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button onClick={() => setAssignTarget(l)} className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs font-medium transition-colors">
                        <Send className="w-3.5 h-3.5" /> Assign
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">No learners match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
