import { useState, useRef, useEffect } from "react";
import {
  Brain, LayoutDashboard, ClipboardList, Activity, BookOpen, BarChart3,
  LogOut, Menu, X, Bell, ChevronRight, Settings, Users, Check,
  Sun, Moon, Globe, Lock, Trash2, User, ChevronDown
} from "lucide-react";

const learnerNav = [
  { page: "learner-dashboard", icon: LayoutDashboard, label: "Dashboard", module: "M04" },
  { page: "diagnostic-test", icon: ClipboardList, label: "Diagnostic Test", module: "M02" },
  { page: "readiness-profiling", icon: Activity, label: "Readiness Profile", module: "M03" },
  { page: "stimulus-content", icon: BookOpen, label: "Stimulus Content", module: "M04" },
];

const facilitatorNav = [
  { page: "facilitator-dashboard", icon: BarChart3, label: "Dashboard", module: "M05" },
  { page: "learner-dashboard", icon: Users, label: "Learner Profiles", module: "M05" },
];

const moduleColors = {
  "M01": "text-blue-400", "M02": "text-purple-400",
  "M03": "text-teal-400", "M04": "text-green-400", "M05": "text-orange-400",
};

const notifications = [
  { id: 1, title: "Readiness profile updated", desc: "Your AI readiness index changed to 74%", time: "2 min ago", read: false, type: "info" },
  { id: 2, title: "New content available", desc: "Algebra Basics audio lesson added", time: "1 hr ago", read: false, type: "success" },
  { id: 3, title: "Test reminder", desc: "You haven't completed the Science diagnostic test", time: "3 hrs ago", read: true, type: "warning" },
  { id: 4, title: "Welcome to ALS Readiness!", desc: "Complete your profile to get started", time: "1 day ago", read: true, type: "info" },
];

export function AppLayout({ children, navigate, user, onLogout, currentPage }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifList, setNotifList] = useState(notifications);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("English");
  const [fontSize, setFontSize] = useState("Medium");

  const notifRef = useRef(null);
  const settingsRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setShowSettings(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navItems = user?.role === "facilitator" || user?.role === "admin" ? facilitatorNav : learnerNav;
  const roleLabel = user?.role === "facilitator" ? "Facilitator" : user?.role === "admin" ? "Administrator" : "Learner";
  const roleColor = user?.role === "facilitator" ? "text-orange-400" : user?.role === "admin" ? "text-purple-400" : "text-green-400";
  const roleBg = user?.role === "facilitator" ? "bg-orange-500/10" : user?.role === "admin" ? "bg-purple-500/10" : "bg-green-500/10";

  const unread = notifList.filter(n => !n.read).length;

  const markAllRead = () => setNotifList(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id) => setNotifList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const deleteNotif = (id) => setNotifList(prev => prev.filter(n => n.id !== id));

  const notifColor = { info: "bg-blue-500", success: "bg-green-500", warning: "bg-orange-500" };

  const pageLabel = [...learnerNav, ...facilitatorNav].find(n => n.page === currentPage)?.label || "Dashboard";

  return (
    <div className="flex h-screen bg-[#F0F4F8] overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} flex-shrink-0 bg-[#0B1F3A] flex flex-col transition-all duration-300 ease-in-out`}>
        <div className="flex items-center gap-3 p-4 border-b border-white/10 h-16">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <div className="text-white font-semibold text-sm whitespace-nowrap">ALS Readiness</div>
              <div className="text-blue-400 text-xs whitespace-nowrap">Empowering Adult Learners</div>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarOpen && (
            <div className="px-3 pb-2 pt-1">
              <p className="text-blue-500 text-xs font-medium uppercase tracking-wider">Navigation</p>
            </div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            return (
              <button key={item.page} onClick={() => navigate(item.page)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive ? "bg-blue-500/20 text-white border border-blue-500/30" : "text-blue-300 hover:bg-white/5 hover:text-white"}`}
                title={!sidebarOpen ? item.label : undefined}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-sm text-left whitespace-nowrap">{item.label}</span>
                    <span className={`text-xs font-mono ${moduleColors[item.module] || "text-blue-400"} opacity-60`}>{item.module}</span>
                  </>
                )}
                {isActive && sidebarOpen && <ChevronRight className="w-4 h-4 text-blue-400" />}
              </button>
            );
          })}

          {sidebarOpen && (
            <div className="px-3 pb-2 pt-4">
              <p className="text-blue-500 text-xs font-medium uppercase tracking-wider">Account</p>
            </div>
          )}
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-blue-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
            title={!sidebarOpen ? "Logout" : undefined}>
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </nav>

        {sidebarOpen && user && (
          <div className="p-3 border-t border-white/10">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">{user.name[0]}</span>
              </div>
              <div className="overflow-hidden flex-1">
                <div className="text-white text-sm font-medium truncate">{user.name}</div>
                <div className={`text-xs ${roleColor} ${roleBg} inline-block px-2 py-0.5 rounded-full`}>{roleLabel}</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 relative z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="text-gray-800" style={{ fontSize: "1.1rem", fontWeight: 600 }}>{pageLabel}</h1>
              <p className="text-gray-400 text-xs">ALS Readiness Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => { setShowNotifications(!showNotifications); setShowSettings(false); setShowProfile(false); }}
                className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold" style={{ fontSize: 9 }}>{unread}</span>
                  </div>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div>
                      <span className="text-gray-800 font-semibold text-sm">Notifications</span>
                      {unread > 0 && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{unread} new</span>}
                    </div>
                    {unread > 0 && (
                      <button onClick={markAllRead} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifList.length === 0 && (
                      <div className="p-6 text-center text-gray-400 text-sm">No notifications</div>
                    )}
                    {notifList.map(n => (
                      <div key={n.id} onClick={() => markRead(n.id)}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 ${!n.read ? "bg-blue-50/50" : ""}`}>
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? notifColor[n.type] : "bg-gray-300"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-800 text-sm font-medium">{n.title}</div>
                          <div className="text-gray-500 text-xs">{n.desc}</div>
                          <div className="text-gray-400 text-xs mt-0.5">{n.time}</div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-gray-100 text-center">
                    <button className="text-xs text-blue-500 hover:text-blue-700">View all notifications</button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="relative" ref={settingsRef}>
              <button onClick={() => { setShowSettings(!showSettings); setShowNotifications(false); setShowProfile(false); }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              {showSettings && (
                <div className="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <span className="text-gray-800 font-semibold text-sm">Settings</span>
                  </div>
                  <div className="p-4 space-y-4">
                    {/* Dark Mode */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {darkMode ? <Moon className="w-4 h-4 text-blue-500" /> : <Sun className="w-4 h-4 text-yellow-500" />}
                        <div>
                          <div className="text-gray-700 text-sm font-medium">Appearance</div>
                          <div className="text-gray-400 text-xs">{darkMode ? "Dark mode" : "Light mode"}</div>
                        </div>
                      </div>
                      <button onClick={() => setDarkMode(!darkMode)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${darkMode ? "bg-blue-500" : "bg-gray-200"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${darkMode ? "left-5" : "left-0.5"}`} />
                      </button>
                    </div>

                    {/* Language */}
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Globe className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700 text-sm font-medium">Language</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {["English", "Filipino", "Bisaya"].map(lang => (
                          <button key={lang} onClick={() => setLanguage(lang)}
                            className={`py-1.5 rounded-lg text-xs transition-colors ${language === lang ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Size */}
                    <div>
                      <div className="text-gray-700 text-sm font-medium mb-2">Font Size</div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {["Small", "Medium", "Large"].map(size => (
                          <button key={size} onClick={() => setFontSize(size)}
                            className={`py-1.5 rounded-lg text-xs transition-colors ${fontSize === size ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Privacy */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                      <Lock className="w-4 h-4 text-gray-500" />
                      <div className="flex-1">
                        <div className="text-gray-700 text-sm font-medium">Privacy & Security</div>
                        <div className="text-gray-400 text-xs">Manage data & permissions</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); setShowSettings(false); }}
                className="flex items-center gap-2 pl-3 pr-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{user?.name?.[0] || "U"}</span>
                </div>
                <span className="text-gray-700 text-sm font-medium">{user?.name || "User"}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>
              {showProfile && (
                <div className="absolute right-0 top-12 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">{user?.name?.[0] || "U"}</span>
                      </div>
                      <div>
                        <div className="text-gray-800 font-semibold text-sm">{user?.name}</div>
                        <div className="text-gray-500 text-xs">{user?.email}</div>
                        <div className={`text-xs mt-0.5 inline-block px-2 py-0.5 rounded-full ${
                          user?.role === "facilitator" ? "bg-orange-100 text-orange-600" :
                          user?.role === "admin" ? "bg-purple-100 text-purple-600" :
                          "bg-green-100 text-green-600"
                        }`}>{user?.role}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    {[
                      { icon: User, label: "My Profile", action: () => {} },
                      { icon: Settings, label: "Account Settings", action: () => { setShowProfile(false); setShowSettings(true); } },
                      { icon: Bell, label: "Notifications", action: () => { setShowProfile(false); setShowNotifications(true); } },
                    ].map(({ icon: Icon, label, action }) => (
                      <button key={label} onClick={action}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors text-sm text-left">
                        <Icon className="w-4 h-4" /> {label}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={() => { setShowProfile(false); onLogout(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm text-left">
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
