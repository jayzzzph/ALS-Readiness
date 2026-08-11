import { useState } from "react";
import { BookOpen, Headphones, Video, Upload, Cpu, Search, Filter, Trash2, Edit, CheckCircle, Users } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";
import { TribeV2Upload } from "./TribeV2Upload";

const library = [
  { id:1, title:"Basic Operations & Word Problems", type:"auditory", subject:"Math",    strand:"LS3", uploaded:"Jun 10", learners:4, status:"published", duration:"18 min" },
  { id:2, title:"Philippine History: Pre-Colonial",  type:"visual",   subject:"AP",     strand:"LS6", uploaded:"Jun 8",  learners:3, status:"published", duration:"20 min" },
  { id:3, title:"English Grammar — Verb Tenses",    type:"reading",  subject:"English", strand:"LS1", uploaded:"Jun 5",  learners:5, status:"published", duration:"15 min" },
  { id:4, title:"Photosynthesis Explained",         type:"visual",   subject:"Science", strand:"LS4", uploaded:"Jun 1",  learners:5, status:"published", duration:"22 min" },
  { id:5, title:"Filipino Literature: Balagtasan",  type:"auditory", subject:"Filipino",strand:"LS1", uploaded:"May 28", learners:4, status:"published", duration:"25 min" },
  { id:6, title:"Basic Statistics Overview",        type:"reading",  subject:"Math",    strand:"LS3", uploaded:"May 25", learners:2, status:"draft",     duration:"30 min" },
];

const typeIcon  = { auditory:Headphones, visual:Video, reading:BookOpen };
const typeStyle = { auditory:"text-blue-600 bg-blue-50 border-blue-200", visual:"text-purple-600 bg-purple-50 border-purple-200", reading:"text-green-600 bg-green-50 border-green-200" };
const typeIconBg= { auditory:"bg-blue-50", visual:"bg-purple-50", reading:"bg-green-50" };
const typeIconCl= { auditory:"text-blue-500", visual:"text-purple-500", reading:"text-green-500" };

export function FacilitatorContent({ navigate, user, onLogout }) {
  const [showTribe,   setShowTribe]   = useState(false);
  const [search,      setSearch]      = useState("");
  const [typeFilter,  setTypeFilter]  = useState("All");
  const [items,       setItems]       = useState(library);
  const [deleteId,    setDeleteId]    = useState(null);

  if (showTribe) return <TribeV2Upload onClose={() => setShowTribe(false)} />;

  const filtered = items.filter(c =>
    (typeFilter === "All" || c.type === typeFilter.toLowerCase()) &&
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id) => { setItems(p => p.filter(c => c.id !== id)); setDeleteId(null); };

  const stats = [
    { label:"Total Items",   value:items.length,                                           },
    { label:"Published",     value:items.filter(c=>c.status==="published").length          },
    { label:"Drafts",        value:items.filter(c=>c.status==="draft").length              },
    { label:"Total Learners",value:items.reduce((s,c)=>s+c.learners,0)                     },
  ];

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="facilitator-content">
      <div className="p-5 space-y-5">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1a3a5c] rounded-2xl p-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2"><span className="text-xs bg-white/15 px-2 py-0.5 rounded font-mono">M05</span><span className="text-blue-300 text-xs">Content Management</span></div>
            <h2 className="mb-1" style={{ fontSize:"1.25rem", fontWeight:700 }}>Content Library</h2>
            <p className="text-blue-200/70 text-sm">All content is processed through TRIBE v2 before publishing to learners.</p>
          </div>
          <button onClick={() => setShowTribe(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-white rounded-xl text-sm font-medium transition-colors">
            <Cpu className="w-4 h-4" /> Upload with TRIBE v2
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="text-gray-800 text-2xl font-bold">{s.value}</div>
              <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* TRIBE v2 info */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#3535C5]/15 border border-[#3535C5]/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <Cpu className="w-5 h-5 text-[#3535C5]" />
          </div>
          <div className="flex-1">
            <div className="text-[#3535C5] font-semibold text-sm">TRIBE v2 Analysis Pipeline</div>
            <div className="text-indigo-600 text-xs mt-0.5">Brain response visualization generated per timestep. Content is auto-tagged with peak engagement windows before publishing.</div>
          </div>
          <button onClick={() => setShowTribe(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#3535C5] hover:bg-[#2929a8] text-white rounded-xl text-sm font-medium transition-colors flex-shrink-0">
            <Upload className="w-3.5 h-3.5" /> Upload New
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search content..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-gray-700 focus:outline-none focus:border-orange-400 text-sm" />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            {["All","Auditory","Visual","Reading"].map(f => (
              <button key={f} onClick={() => setTypeFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${typeFilter === f ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{f}</button>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => {
            const Icon    = typeIcon[item.type];
            const iconBg  = typeIconBg[item.type];
            const iconCl  = typeIconCl[item.type];
            const tStyle  = typeStyle[item.type];
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${iconCl}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${tStyle}`}>{item.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === "published" ? "text-green-600 bg-green-50" : "text-gray-500 bg-gray-100"}`}>
                      {item.status === "published" ? "✓ Live" : "Draft"}
                    </span>
                  </div>
                </div>
                <h4 className="text-gray-800 font-semibold text-sm mb-1 leading-snug">{item.title}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                  <span className="bg-gray-100 px-2 py-0.5 rounded">{item.subject}</span>
                  <span>{item.strand}</span>
                  <span>·</span>
                  <span>{item.duration}</span>
                </div>
                <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1 text-indigo-600"><Cpu className="w-3 h-3" /> TRIBE v2</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {item.learners} learners</span>
                  <span>·</span>
                  <span>{item.uploaded}</span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-colors flex items-center justify-center gap-1"><Edit className="w-3 h-3" /> Edit</button>
                  <button onClick={() => setDeleteId(item.id)}
                    className="py-2 px-3 text-xs bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors"><Trash2 className="w-3 h-3" /></button>
                  {item.status === "draft" && (
                    <button className="flex-1 py-2 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> Publish</button>
                  )}
                </div>
                {deleteId === item.id && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-700 text-xs mb-2">Remove this content? This cannot be undone.</p>
                    <div className="flex gap-2">
                      <button onClick={() => setDeleteId(null)} className="flex-1 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-600">Cancel</button>
                      <button onClick={() => handleDelete(item.id)} className="flex-1 py-1.5 text-xs bg-red-500 text-white rounded-lg">Remove</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-3 py-16 text-center text-gray-400">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No content matches your filters.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
