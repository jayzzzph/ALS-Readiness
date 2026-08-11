import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard, ClipboardList, Activity, BookOpen, BarChart3,
  LogOut, Menu, Bell, ChevronRight, Settings, Users, Check,
  Sun, Moon, Globe, Lock, Trash2, User, ChevronDown,
  TrendingUp, Trophy, CalendarDays, FileText, Cpu,
  Brain, Play, Target, ShieldCheck
} from "lucide-react";
import { ALSenseLogo } from "./ALSenseLogo";

/* ── Nav definitions ── */
const learnerNav = [
  // Pipeline
  { page:"learner-dashboard",   icon:LayoutDashboard, label:"Home",               group:"pipeline" },
  { page:"diagnostic-test",     icon:ClipboardList,   label:"Pre-test",           group:"pipeline", badge:"M02" },
  { page:"eeg-profiling",       icon:Brain,           label:"EEG Profiling",      group:"pipeline", badge:"M03" },
  { page:"readiness-profiling", icon:Activity,        label:"Readiness Index",    group:"pipeline", badge:"M03" },
  { page:"stimulus-content",    icon:BookOpen,        label:"Learning Content",   group:"pipeline", badge:"M04" },
  { page:"post-test",           icon:Target,          label:"Post-test",          group:"pipeline", badge:"M02" },
  // Track
  { page:"my-progress",         icon:TrendingUp,      label:"My Progress",        group:"track" },
  { page:"achievements",        icon:Trophy,          label:"Achievements",        group:"track" },
  { page:"learner-schedule",    icon:CalendarDays,    label:"Schedule",           group:"track" },
];

const facilitatorNav = [
  { page:"facilitator-dashboard", icon:LayoutDashboard, label:"Overview",    group:"main"   },
  { page:"facilitator-cohort",    icon:Users,           label:"Cohort",      group:"main"   },
  { page:"facilitator-content",   icon:Cpu,             label:"Content",     group:"manage" },
  { page:"facilitator-analytics", icon:BarChart3,       label:"Analytics",   group:"manage" },
  { page:"facilitator-reports",   icon:FileText,        label:"Reports",     group:"manage" },
];

const adminNav = [
  { page:"admin-dashboard",  icon:LayoutDashboard, label:"Overview",       group:"main"   },
  { page:"admin-users",      icon:Users,           label:"User Accounts",  group:"main"   },
  { page:"admin-analytics",  icon:BarChart3,       label:"Analytics",      group:"reports"},
  { page:"admin-reports",    icon:FileText,        label:"DepEd Reports",  group:"reports"},
];

const notifications = [
  { id:1, title:"Readiness profile updated",  desc:"Your AI readiness index changed to 74%",            time:"2 min ago",  read:false, type:"info"    },
  { id:2, title:"New content available",      desc:"Algebra Basics audio lesson added",                 time:"1 hr ago",   read:false, type:"success" },
  { id:3, title:"Test reminder",              desc:"You haven't completed the Science diagnostic test", time:"3 hrs ago",  read:true,  type:"warning" },
  { id:4, title:"Achievement unlocked!",      desc:"You earned the 'First Test' badge",                 time:"1 day ago",  read:true,  type:"info"    },
];

function NavItem({ item, active, open, onClick }) {
  const Icon = item.icon;
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 group ${active ? "bg-white/12 text-white" : "text-blue-300/75 hover:bg-white/5 hover:text-white"}`}
      title={!open ? item.label : undefined}>
      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-white" : "group-hover:text-white"}`} />
      {open && (
        <>
          <span className="flex-1 text-sm text-left truncate">{item.label}</span>
          {item.badge && !active && <span className="text-[10px] text-blue-500 font-mono opacity-70">{item.badge}</span>}
          {active && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />}
        </>
      )}
    </button>
  );
}

function SectionLabel({ label, open }) {
  if (!open) return <div className="my-1.5 border-t border-white/8" />;
  return <p className="px-3 pt-3 pb-1 text-[10px] text-blue-500/80 font-semibold uppercase tracking-widest">{label}</p>;
}

export function AppLayout({ children, navigate, user, onLogout, currentPage }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotif,    setShowNotif]   = useState(false);
  const [showSettings, setShowSettings]= useState(false);
  const [showProfile,  setShowProfile] = useState(false);
  const [notifList,    setNotifList]   = useState(notifications);
  const [darkMode,     setDarkMode]    = useState(false);
  const [language,     setLanguage]    = useState("English");
  const [fontSize,     setFontSize]    = useState("Medium");

  const notifRef    = useRef(null);
  const settingsRef = useRef(null);
  const profileRef  = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (notifRef.current    && !notifRef.current.contains(e.target))    setShowNotif(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setShowSettings(false);
      if (profileRef.current  && !profileRef.current.contains(e.target))  setShowProfile(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const role    = user?.role;
  const navItems= role === "facilitator" ? facilitatorNav : role === "admin" ? adminNav : learnerNav;
  const roleLabel= role === "admin" ? "Coordinator / Admin" : role === "facilitator" ? "Facilitator" : "ALS Learner";
  const roleColor= role === "admin" ? "text-purple-400" : role === "facilitator" ? "text-orange-400" : "text-green-400";
  const roleBg   = role === "admin" ? "bg-purple-500/10" : role === "facilitator" ? "bg-orange-500/10" : "bg-green-500/10";
  const accentBtn= role === "admin" ? "bg-purple-500" : role === "facilitator" ? "bg-orange-500" : "bg-[#3535C5]";

  const unread   = notifList.filter(n => !n.read).length;
  const allPages = [...learnerNav, ...facilitatorNav, ...adminNav];
  const pageLabel= allPages.find(n => n.page === currentPage)?.label || "Dashboard";

  const markAllRead = () => setNotifList(p => p.map(n => ({ ...n, read:true })));
  const markRead    = (id) => setNotifList(p => p.map(n => n.id === id ? { ...n, read:true } : n));
  const deleteNotif = (id) => setNotifList(p => p.filter(n => n.id !== id));
  const notifDot    = { info:"bg-blue-500", success:"bg-green-500", warning:"bg-orange-500" };

  /* Group helpers */
  const pipline  = navItems.filter(n => n.group === "pipeline");
  const track    = navItems.filter(n => n.group === "track");
  const mainG    = navItems.filter(n => n.group === "main");
  const manageG  = navItems.filter(n => n.group === "manage" || n.group === "reports");

  return (
    <div className="flex h-screen bg-[#F0F4F8] overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={`${sidebarOpen ? "w-56" : "w-14"} flex-shrink-0 bg-[#0B1F3A] flex flex-col transition-all duration-300`}>
        <div className="flex items-center gap-3 px-4 border-b border-white/10 h-14 flex-shrink-0">
          {sidebarOpen
            ? <ALSenseLogo size="sm" light showSub subText="Empowering Adult Learners" />
            : <ALSenseLogo iconOnly size="sm" />}
        </div>

        <nav className="flex-1 px-2 py-2 overflow-y-auto">
          {/* Learner nav */}
          {role === "learner" && (
            <>
              <SectionLabel label="Learning Pipeline" open={sidebarOpen} />
              {pipline.map(item => <NavItem key={item.page} item={item} active={currentPage === item.page} open={sidebarOpen} onClick={() => navigate(item.page)} />)}
              <SectionLabel label="Track" open={sidebarOpen} />
              {track.map(item   => <NavItem key={item.page} item={item} active={currentPage === item.page} open={sidebarOpen} onClick={() => navigate(item.page)} />)}
            </>
          )}

          {/* Facilitator nav */}
          {role === "facilitator" && (
            <>
              <SectionLabel label="Dashboard" open={sidebarOpen} />
              {mainG.map(item   => <NavItem key={item.page} item={item} active={currentPage === item.page} open={sidebarOpen} onClick={() => navigate(item.page)} />)}
              <SectionLabel label="Manage" open={sidebarOpen} />
              {manageG.map(item => <NavItem key={item.page} item={item} active={currentPage === item.page} open={sidebarOpen} onClick={() => navigate(item.page)} />)}
            </>
          )}

          {/* Admin nav */}
          {role === "admin" && (
            <>
              <SectionLabel label="Dashboard" open={sidebarOpen} />
              {mainG.map(item   => <NavItem key={item.page} item={item} active={currentPage === item.page} open={sidebarOpen} onClick={() => navigate(item.page)} />)}
              <SectionLabel label="Reports" open={sidebarOpen} />
              {manageG.map(item => <NavItem key={item.page} item={item} active={currentPage === item.page} open={sidebarOpen} onClick={() => navigate(item.page)} />)}
            </>
          )}

          <div className="pt-2 mt-2 border-t border-white/8">
            <button onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-blue-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
              title={!sidebarOpen ? "Logout" : undefined}>
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">Logout</span>}
            </button>
          </div>
        </nav>

        {sidebarOpen && user && (
          <div className="p-2.5 border-t border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2.5 p-2.5 bg-white/5 rounded-xl">
              <div className="w-8 h-8 bg-gradient-to-br from-[#3535C5] to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{user.name[0]}</span>
              </div>
              <div className="overflow-hidden flex-1 min-w-0">
                <div className="text-white text-xs font-medium truncate">{user.name}</div>
                <span className={`text-[10px] ${roleColor} ${roleBg} px-1.5 py-0.5 rounded-full`}>{roleLabel}</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-5 flex-shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-gray-800 text-sm font-semibold leading-none">{pageLabel}</h1>
              <p className="text-gray-400 text-xs mt-0.5">ALSense · {roleLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => { setShowNotif(!showNotif); setShowSettings(false); setShowProfile(false); }}
                className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <Bell className="w-4 h-4" />
                {unread > 0 && <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center"><span className="text-white font-bold" style={{ fontSize:8 }}>{unread}</span></div>}
              </button>
              {showNotif && (
                <div className="absolute right-0 top-11 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden" style={{ width:300 }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="text-gray-800 font-semibold text-sm">Notifications{unread > 0 && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{unread}</span>}</span>
                    {unread > 0 && <button onClick={markAllRead} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"><Check className="w-3 h-3" />All read</button>}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifList.map(n => (
                      <div key={n.id} onClick={() => markRead(n.id)}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 ${!n.read ? "bg-blue-50/40" : ""}`}>
                        <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${!n.read ? notifDot[n.type] : "bg-gray-300"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-800 text-xs font-medium">{n.title}</div>
                          <div className="text-gray-500 text-xs">{n.desc}</div>
                          <div className="text-gray-400 text-xs">{n.time}</div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); deleteNotif(n.id); }} className="text-gray-300 hover:text-red-400 mt-0.5">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="relative" ref={settingsRef}>
              <button onClick={() => { setShowSettings(!showSettings); setShowNotif(false); setShowProfile(false); }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <Settings className="w-4 h-4" />
              </button>
              {showSettings && (
                <div className="absolute right-0 top-11 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100"><span className="text-gray-800 font-semibold text-sm">Settings</span></div>
                  <div className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">{darkMode ? <Moon className="w-4 h-4 text-blue-500" /> : <Sun className="w-4 h-4 text-yellow-500" />}<span className="text-gray-700 text-sm">{darkMode ? "Dark mode" : "Light mode"}</span></div>
                      <button onClick={() => setDarkMode(!darkMode)} className={`relative w-9 h-5 rounded-full transition-colors ${darkMode ? "bg-blue-500" : "bg-gray-200"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${darkMode ? "left-4" : "left-0.5"}`} />
                      </button>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5"><Globe className="w-4 h-4 text-green-500" /><span className="text-gray-700 text-sm">Language</span></div>
                      <div className="flex gap-1">{["English","Filipino","Bisaya"].map(l => <button key={l} onClick={() => setLanguage(l)} className={`flex-1 py-1 rounded-lg text-xs ${language===l?"bg-blue-500 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{l}</button>)}</div>
                    </div>
                    <div>
                      <span className="text-gray-700 text-sm block mb-1.5">Font Size</span>
                      <div className="flex gap-1">{["Small","Medium","Large"].map(s => <button key={s} onClick={() => setFontSize(s)} className={`flex-1 py-1 rounded-lg text-xs ${fontSize===s?"bg-blue-500 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{s}</button>)}</div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100">
                      <Lock className="w-4 h-4 text-gray-500" />
                      <div className="flex-1"><div className="text-gray-700 text-xs font-medium">Privacy & Security</div><div className="text-gray-400 text-xs">Manage data & permissions</div></div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button onClick={() => { setShowProfile(!showProfile); setShowNotif(false); setShowSettings(false); }}
                className="flex items-center gap-2 pl-2.5 pr-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                <div className="w-6 h-6 bg-gradient-to-br from-[#3535C5] to-cyan-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{user?.name?.[0] || "U"}</span>
                </div>
                <span className="text-gray-700 text-sm font-medium">{user?.name?.split(" ")[0] || "User"}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              {showProfile && (
                <div className="absolute right-0 top-11 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="p-3.5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-gradient-to-br from-[#3535C5] to-cyan-500 rounded-full flex items-center justify-center"><span className="text-white font-bold text-sm">{user?.name?.[0]}</span></div>
                      <div>
                        <div className="text-gray-800 font-semibold text-sm">{user?.name}</div>
                        <div className="text-gray-400 text-xs">{user?.email}</div>
                        <div className={`text-xs mt-0.5 px-1.5 py-0.5 rounded-full inline-block ${roleBg} ${roleColor}`}>{roleLabel}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-1.5">
                    {[{ icon:User, label:"My Profile", action:()=>{} }, { icon:Settings, label:"Account Settings", action:()=>{ setShowProfile(false); setShowSettings(true); } }].map(({ icon:Icon, label, action }) => (
                      <button key={label} onClick={action} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-50 text-sm text-left">
                        <Icon className="w-4 h-4" /> {label}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={() => { setShowProfile(false); onLogout(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 text-sm text-left">
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
