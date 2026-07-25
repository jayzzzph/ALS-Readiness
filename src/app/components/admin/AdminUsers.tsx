import { useState } from "react";
import { Users, Search, Plus, Eye, Edit, Trash2, X, ShieldCheck, BookOpen, Shield, CheckCircle } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";

const allUsers = [
  { id:1,  name:"Maria Santos",       email:"m.santos@als.edu",     role:"learner",     cohort:"Cohort A", status:"active",   joined:"Jun 1, 2026",  lastActive:"Today"       },
  { id:2,  name:"Jose Reyes",         email:"j.reyes@als.edu",      role:"learner",     cohort:"Cohort B", status:"active",   joined:"Jun 3, 2026",  lastActive:"Yesterday"   },
  { id:3,  name:"Ana Cruz",           email:"a.cruz@als.edu",       role:"learner",     cohort:"Cohort A", status:"active",   joined:"May 28, 2026", lastActive:"Today"       },
  { id:4,  name:"Pedro Delos Santos", email:"p.delos@als.edu",      role:"learner",     cohort:"Cohort B", status:"inactive", joined:"Jun 5, 2026",  lastActive:"5 days ago"  },
  { id:5,  name:"Elena Ramos",        email:"e.ramos@als.edu",      role:"learner",     cohort:"Cohort C", status:"active",   joined:"Jun 2, 2026",  lastActive:"Today"       },
  { id:6,  name:"Carlo Bautista",     email:"c.bautista@als.edu",   role:"learner",     cohort:"Cohort A", status:"active",   joined:"Jun 6, 2026",  lastActive:"2 days ago"  },
  { id:7,  name:"Juan Santos",        email:"j.santos@als.edu",     role:"facilitator", cohort:"Cohort A", status:"active",   joined:"May 1, 2026",  lastActive:"Today"       },
  { id:8,  name:"Maria Cruz",         email:"m.cruz@als.edu",       role:"facilitator", cohort:"Cohort B", status:"active",   joined:"May 1, 2026",  lastActive:"Yesterday"   },
  { id:9,  name:"Roberto Reyes",      email:"r.reyes@als.edu",      role:"facilitator", cohort:"Cohort C", status:"active",   joined:"May 1, 2026",  lastActive:"Today"       },
  { id:10, name:"Admin User",         email:"admin@als.edu",        role:"admin",       cohort:"—",        status:"active",   joined:"Jan 1, 2026",  lastActive:"Today"       },
];

const roleIcon = { learner:BookOpen, facilitator:ShieldCheck, admin:Shield };
const roleColor= { learner:"text-green-600 bg-green-50", facilitator:"text-orange-600 bg-orange-50", admin:"text-purple-600 bg-purple-50" };
const roleLabel= { learner:"Learner", facilitator:"Facilitator", admin:"Admin" };

function UserModal({ u, onClose }) {
  if (!u) return null;
  const Icon = roleIcon[u.role];
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-gray-800 font-bold">User Account</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold">{u.name[0]}</div>
            <div>
              <h4 className="text-gray-800 font-bold text-lg">{u.name}</h4>
              <div className="text-gray-500 text-sm">{u.email}</div>
              <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${roleColor[u.role]}`}>{roleLabel[u.role]}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[{ label:"Cohort", value:u.cohort },{ label:"Status", value:u.status },{ label:"Joined", value:u.joined },{ label:"Last Active", value:u.lastActive }].map(i => (
              <div key={i.label} className="p-3 bg-gray-50 rounded-xl">
                <div className="text-gray-400 text-xs">{i.label}</div>
                <div className="text-gray-800 font-medium text-sm capitalize">{i.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition-colors">Close</button>
          <button className="flex-1 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-colors">Edit Account</button>
        </div>
      </div>
    </div>
  );
}

function AddUserModal({ onClose }) {
  const [form, setForm] = useState({ name:"", email:"", role:"learner", cohort:"" });
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-gray-800 font-bold">Add User Account</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="p-5 space-y-4">
          {[{ label:"Full Name", key:"name", ph:"Juan Dela Cruz", type:"text" },{ label:"Email", key:"email", ph:"juan@als.edu", type:"email" }].map(f => (
            <div key={f.key}>
              <label className="text-gray-600 text-sm font-medium mb-1.5 block">{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={e => update(f.key, e.target.value)} placeholder={f.ph}
                className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-gray-700 bg-gray-50 focus:outline-none focus:border-purple-400 text-sm" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-600 text-sm font-medium mb-1.5 block">Role</label>
              <select value={form.role} onChange={e => update("role", e.target.value)} className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-gray-700 bg-gray-50 focus:outline-none focus:border-purple-400 text-sm">
                <option value="learner">Learner</option>
                <option value="facilitator">Facilitator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-gray-600 text-sm font-medium mb-1.5 block">Cohort</label>
              <select value={form.cohort} onChange={e => update("cohort", e.target.value)} className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-gray-700 bg-gray-50 focus:outline-none focus:border-purple-400 text-sm">
                <option value="">Select</option>
                {["Cohort A","Cohort B","Cohort C","Cohort D","Cohort E"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={onClose} className="flex-1 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-colors">Create Account</button>
        </div>
      </div>
    </div>
  );
}

export function AdminUsers({ navigate, user, onLogout }) {
  const [search,      setSearch]      = useState("");
  const [roleFilter,  setRoleFilter]  = useState("All");
  const [statusFilter,setStatusFilter]= useState("All");
  const [selectedUser,setSelectedUser]= useState(null);
  const [showAdd,     setShowAdd]     = useState(false);
  const [users,       setUsers]       = useState(allUsers);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) &&
    (roleFilter   === "All" || u.role   === roleFilter.toLowerCase()) &&
    (statusFilter === "All" || u.status === statusFilter.toLowerCase())
  );

  const handleDelete = (id) => setUsers(p => p.filter(u => u.id !== id));

  const counts = { learner:users.filter(u=>u.role==="learner").length, facilitator:users.filter(u=>u.role==="facilitator").length, admin:users.filter(u=>u.role==="admin").length };

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="admin-users">
      {selectedUser && <UserModal u={selectedUser} onClose={() => setSelectedUser(null)} />}
      {showAdd      && <AddUserModal onClose={() => setShowAdd(false)} />}

      <div className="p-5 space-y-5">
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1a3a5c] rounded-2xl p-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2"><span className="text-xs bg-white/15 px-2 py-0.5 rounded font-mono">ADMIN</span><span className="text-blue-300 text-xs">User Account Management</span></div>
            <h2 className="mb-1" style={{ fontSize:"1.25rem", fontWeight:700 }}>User Accounts</h2>
            <p className="text-blue-200/70 text-sm">{users.length} total users — {counts.learner} learners · {counts.facilitator} facilitators · {counts.admin} admins</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-400 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add Account
          </button>
        </div>

        {/* Role summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:"Learners",     value:counts.learner,     icon:BookOpen,    cls:"text-green-600 bg-green-50"   },
            { label:"Facilitators", value:counts.facilitator, icon:ShieldCheck, cls:"text-orange-600 bg-orange-50" },
            { label:"Admins",       value:counts.admin,       icon:Shield,      cls:"text-purple-600 bg-purple-50" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.cls}`}><Icon className="w-5 h-5" /></div>
                <div><div className="text-gray-800 text-xl font-bold">{s.value}</div><div className="text-gray-500 text-xs">{s.label}</div></div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-gray-700 focus:outline-none focus:border-purple-400 text-sm" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 text-xs">Role:</span>
            {["All","Learner","Facilitator","Admin"].map(f => (
              <button key={f} onClick={() => setRoleFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${roleFilter === f ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{f}</button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 text-xs">Status:</span>
            {["All","Active","Inactive"].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${statusFilter === f ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{f}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{["User","Email","Role","Cohort","Status","Joined","Last Active","Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-semibold">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(u => {
                const Icon = roleIcon[u.role];
                return (
                  <tr key={u.id} className="hover:bg-purple-50/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">{u.name[0]}</div>
                        <span className="text-gray-800 text-sm font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full w-fit ${roleColor[u.role]}`}>
                        <Icon className="w-3 h-3" />{roleLabel[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{u.cohort}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${u.status === "active" ? "text-green-600 bg-green-50" : "text-gray-500 bg-gray-100"}`}>{u.status}</span></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{u.joined}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{u.lastActive}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedUser(u)} className="text-purple-500 hover:text-purple-700 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                        <button className="text-blue-400 hover:text-blue-600 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">No users found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
