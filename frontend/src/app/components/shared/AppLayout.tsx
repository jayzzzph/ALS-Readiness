import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard, ClipboardList, BookOpen, BarChart3,
  LogOut, Menu, Bell, Users, User, ChevronDown,
  TrendingUp, CalendarDays, FileText, Cpu, Target,
} from "lucide-react";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import { ALSenseLogo } from "./ALSenseLogo";
import { CohortControls } from "../facilitator/shared/CohortControls";

// TEMPORARY: loads fonts from Google Fonts. Replace with @fontsource imports once `pnpm add` works.
const fontCss = "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');";

const display = { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 } as const;
const body = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;

/* ── Nav definitions ── */
const learnerNav = [
  // Pipeline
  { page:"learner-dashboard",   icon:LayoutDashboard, label:"Home",               group:"pipeline" },
  { page:"diagnostic-test",     icon:ClipboardList,   label:"Pre-test",           group:"pipeline", badge:"M02" },
  // EEG Profiling — folded into the Pre-test flow, no longer a separate nav step
  // { page:"eeg-profiling",       icon:Brain,           label:"EEG Profiling",      group:"pipeline", badge:"M03" },
  { page:"stimulus-content",    icon:BookOpen,        label:"Learning Content",   group:"pipeline", badge:"M04" },
  { page:"post-test",           icon:Target,          label:"Post-test",          group:"pipeline", badge:"M02" },
  // Track
  { page:"my-progress",         icon:TrendingUp,      label:"My Progress",        group:"track" },
  // Achievements — hidden for now
  // { page:"achievements",        icon:Trophy,          label:"Achievements",        group:"track" },
  { page:"learner-schedule",    icon:CalendarDays,    label:"Schedule",           group:"track" },
];

// Detail pages (facilitator-learners/:learnerId, facilitator-tests/:testId) pass
// their list page's key as currentPage, so that entry stays highlighted.
const facilitatorNav = [
  { page:"facilitator-dashboard",  icon:LayoutDashboard, label:"Dashboard",       group:"main"   },
  { page:"facilitator-curriculum", icon:BookOpen,        label:"Curriculum",      group:"manage" },
  { page:"facilitator-learning-contents", icon:BookOpen, label:"Learning Contents", group:"manage" },
  { page:"facilitator-content",    icon:Cpu,             label:"Content Library", group:"manage" },
  { page:"facilitator-learners",   icon:Users,           label:"Learners",        group:"manage" },
  { page:"facilitator-reports",    icon:FileText,        label:"Reports",         group:"manage" },
  { page:"facilitator-tests",      icon:ClipboardList,   label:"Strand Tests",    group:"manage" },
  { page:"facilitator-cohorts",    icon:CalendarDays,    label:"My Cohorts",      group:"manage" },
];

const adminNav = [
  { page:"admin-dashboard",  icon:LayoutDashboard, label:"Overview",       group:"main"   },
  { page:"admin-users",      icon:Users,           label:"User Accounts",  group:"main"   },
  { page:"admin-cohorts",    icon:CalendarDays,    label:"Cohorts",        group:"main"   },
  { page:"admin-analytics",  icon:BarChart3,       label:"Analytics",      group:"reports"},
  { page:"admin-reports",    icon:FileText,        label:"DepEd Reports",  group:"reports"},
];

/* Pages reached from inside a nav section: highlight that section and title the page. */
const parentPage = { "participant-intake":"diagnostic-test", "readiness-profiling":"diagnostic-test", "eeg-profiling":"diagnostic-test" };
const extraLabels = { "profile":"My Profile", "participant-intake":"Participant Intake", "readiness-profiling":"Readiness Profile", "eeg-profiling":"EEG Profiling", "achievements":"Achievements" };

const roleLabels = { admin:"Coordinator / Admin", facilitator:"Facilitator", learner:"ALS Learner" };

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A]";
// One motion vocabulary for the shell: 150ms, strong ease-out, no movement under reduced motion.
const easeOut = "ease-[cubic-bezier(0.23,1,0.32,1)]";
const iconButton = `relative w-11 h-11 flex items-center justify-center rounded-xl text-[#4A4F5C] hover:text-[#1B1D26] hover:bg-[#F2F1ED] active:scale-95 motion-reduce:active:scale-100 transition-[color,background-color,scale] duration-150 ${easeOut} ${focus}`;
// Menus scale from the corner they open out of; exit is instant (unmount).
const popover = `absolute right-0 top-[calc(100%+8px)] z-50 origin-top-right overflow-hidden rounded-2xl border border-[#E2E0DA] bg-white shadow-[0_8px_24px_rgba(27,29,38,0.08)] transition-[opacity,scale] duration-150 ${easeOut} starting:opacity-0 starting:scale-[0.97] motion-reduce:starting:scale-100`;

function NavItem({ item, active, open, onClick }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      title={!open ? item.label : undefined}
      className={`w-full h-11 flex items-center gap-3 rounded-lg ${open ? "px-3.5" : "justify-center"} text-[0.9375rem] font-bold tracking-[0.01em] text-left transition-[background-color,scale] duration-150 ${easeOut} active:scale-[0.98] motion-reduce:active:scale-100 ${focus} ${
        active ? "bg-[#FFAB2E] text-[#1B1D26]" : "text-[#1B1D26] hover:bg-white"
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      {open ? <span className="truncate">{item.label}</span> : <span className="sr-only">{item.label}</span>}
    </button>
  );
}

function Initial({ name, size = "w-9 h-9 text-sm" }) {
  return (
    <span className={`${size} shrink-0 rounded-full bg-[#CFE4FF] text-[#00538A] font-bold flex items-center justify-center`} aria-hidden="true">
      {name?.[0]?.toUpperCase() || "U"}
    </span>
  );
}

// allowAllCohorts: facilitator pages only - whether the top bar's cohort dropdown offers "All cohorts".
// hideCohortControls: facilitator pages only - no school year and cohort dropdowns, for a page that
// takes its context from its URL and would otherwise show a selection it does not follow.
export function AppLayout({ children, navigate, user, onLogout, currentPage, allowAllCohorts = false, hideCohortControls = false }) {
  // Below 1024px the sidebar starts as an icon rail; the menu button toggles it at any width.
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window === "undefined" || window.matchMedia("(min-width: 1024px)").matches);
  const [showNotif,   setShowNotif]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const notifRef   = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    const esc = (e) => { if (e.key === "Escape") { setShowNotif(false); setShowProfile(false); } };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", esc); };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e) => setSidebarOpen(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const role      = user?.role;
  const navItems  = role === "facilitator" ? facilitatorNav : role === "admin" ? adminNav : learnerNav;
  const roleLabel = roleLabels[role] || roleLabels.learner;
  const activePage= parentPage[currentPage] || currentPage;
  const pageLabel = navItems.find(n => n.page === currentPage)?.label || extraLabels[currentPage] || "Dashboard";
  const firstName = user?.name?.split(" ")[0] || "Account";

  // Each role sees only its own nav, split into its two groups by a hairline.
  const groups = role === "learner" || !role
    ? [navItems.filter(n => n.group === "pipeline"), navItems.filter(n => n.group === "track")]
    : [navItems.filter(n => n.group === "main"), navItems.filter(n => n.group === "manage" || n.group === "reports")];

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#F8F6F2] text-[#1B1D26] selection:bg-[#FFAB2E]/50" style={body}>
      <style>{fontCss}</style>

      {/* ── Sidebar ── */}
      <aside className={`${sidebarOpen ? "w-60" : "w-[4.5rem]"} shrink-0 flex flex-col bg-[#F2F1ED] border-r border-[#E2E0DA]`}>
        <div className={`h-16 shrink-0 flex items-center ${sidebarOpen ? "px-5" : "justify-center"} border-b border-[#E2E0DA]`}>
          {sidebarOpen ? (
            // Wordmark and tagline as in the mockup; the waveform mark stands in for them on the collapsed rail.
            <div className="min-w-0">
              <div className="text-[#00538A] text-[1.75rem] leading-none" style={display}>ALSense</div>
              <div className="mt-1 text-[0.9375rem] leading-none text-[#4A4F5C] truncate">Empowering Adult Learners</div>
            </div>
          ) : (
            <ALSenseLogo iconOnly size="sm" />
          )}
        </div>

        <nav aria-label="Main" className={`flex-1 overflow-y-auto py-4 ${sidebarOpen ? "px-3" : "px-2"}`}>
          {groups.filter(g => g.length).map((group, gi) => (
            <ul key={gi} className={`space-y-1 ${gi > 0 ? "mt-4 pt-4 border-t border-[#E2E0DA]" : ""}`}>
              {group.map(item => (
                <li key={item.page}>
                  <NavItem item={item} active={activePage === item.page} open={sidebarOpen} onClick={() => navigate(item.page)} />
                </li>
              ))}
            </ul>
          ))}
        </nav>

        <div className={`shrink-0 border-t border-[#E2E0DA] py-3 ${sidebarOpen ? "px-3" : "px-2"}`}>
          <button
            onClick={onLogout}
            title={!sidebarOpen ? "Log out" : undefined}
            className={`w-full h-11 flex items-center gap-3 rounded-lg ${sidebarOpen ? "px-3.5" : "justify-center"} text-[0.9375rem] font-bold tracking-[0.01em] text-[#1B1D26] hover:bg-white transition-[background-color,scale] duration-150 ${easeOut} active:scale-[0.98] motion-reduce:active:scale-100 ${focus}`}
          >
            <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            {sidebarOpen ? <span>Log out</span> : <span className="sr-only">Log out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="h-16 shrink-0 flex items-center justify-between gap-4 px-4 lg:px-6 bg-white border-b border-[#E2E0DA]">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              aria-expanded={sidebarOpen}
              className={iconButton}
            >
              <Menu className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <h1 className="text-lg font-medium leading-tight text-[#1B1D26] truncate">{pageLabel}</h1>
          </div>

          <div className="flex items-center gap-1">
            {/* School year + cohort (facilitator only) */}
            {role === "facilitator" && <CohortControls allowAll={allowAllCohorts} hidden={hideCohortControls} />}

            {/* Notifications: no backend feed exists yet, so this is an honest empty state. */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
                aria-label="Notifications"
                aria-expanded={showNotif}
                aria-haspopup="true"
                className={iconButton}
              >
                <Bell className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
              </button>
              {showNotif && (
                <div className={`${popover} w-80`} role="dialog" aria-label="Notifications">
                  <div className="px-5 py-4 border-b border-[#E2E0DA]">
                    <h2 className="text-base font-bold text-[#1B1D26]">Notifications</h2>
                  </div>
                  <div className="px-5 py-8 text-center">
                    <Bell className="mx-auto mb-3 w-6 h-6 text-[#4A4F5C]" strokeWidth={1.5} aria-hidden="true" />
                    <p className="text-[0.9375rem] font-bold text-[#1B1D26]">No notifications yet</p>
                    <p className="mt-1 text-sm text-[#4A4F5C]">Reminders about your tests and lessons will show here.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
                aria-expanded={showProfile}
                aria-haspopup="menu"
                className={`h-11 flex items-center gap-2 pl-1.5 pr-3 rounded-xl hover:bg-[#F2F1ED] active:scale-[0.98] motion-reduce:active:scale-100 transition-[background-color,scale] duration-150 ${easeOut} ${focus}`}
              >
                <Initial name={user?.name} size="w-8 h-8 text-sm" />
                <span className="text-[0.9375rem] font-bold text-[#1B1D26] max-w-[10rem] truncate">{firstName}</span>
                <ChevronDown className="w-4 h-4 text-[#4A4F5C]" aria-hidden="true" />
              </button>
              {showProfile && (
                <div className={`${popover} w-64`} role="menu">
                  <div className="flex items-center gap-3 px-4 py-4 border-b border-[#E2E0DA]">
                    <Initial name={user?.name} />
                    <div className="min-w-0">
                      <div className="text-[0.9375rem] font-bold text-[#1B1D26] truncate">{user?.name}</div>
                      <div className="text-sm text-[#4A4F5C] truncate">{roleLabel}</div>
                    </div>
                  </div>
                  <div className="p-1.5">
                    <button
                      role="menuitem"
                      onClick={() => { setShowProfile(false); navigate("profile"); }}
                      className={`w-full h-11 flex items-center gap-3 px-3 rounded-lg text-[0.9375rem] text-[#1B1D26] hover:bg-[#F2F1ED] text-left transition-colors duration-150 ${focus}`}
                    >
                      <User className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" /> My Profile
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => { setShowProfile(false); onLogout(); }}
                      className={`w-full h-11 flex items-center gap-3 px-3 rounded-lg text-[0.9375rem] text-[#1B1D26] hover:bg-[#F2F1ED] text-left transition-colors duration-150 ${focus}`}
                    >
                      <LogOut className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" /> Log out
                    </button>
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
