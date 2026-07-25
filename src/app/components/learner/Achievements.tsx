import { useState } from "react";
import { Trophy, Star, Flame, BookOpen, ClipboardList, Activity, Zap, Lock, CheckCircle } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";

const badges = [
  /* Earned */
  { id:"first-test",    name:"First Step",         desc:"Completed your first diagnostic test",        icon:"🎯", color:"from-purple-400 to-purple-600", xp:50,  earned:true,  date:"Jun 3"  },
  { id:"streak-3",      name:"Consistent Learner",  desc:"Maintained a 3-day learning streak",         icon:"🔥", color:"from-orange-400 to-red-500",    xp:75,  earned:true,  date:"Jun 5"  },
  { id:"science-pass",  name:"Science Star",        desc:"Passed the Science diagnostic test (85%+)",  icon:"🔬", color:"from-teal-400 to-teal-600",     xp:100, earned:true,  date:"Jun 15" },
  { id:"profile-done",  name:"Profile Complete",    desc:"Completed your learner profile setup",       icon:"👤", color:"from-blue-400 to-blue-600",     xp:30,  earned:true,  date:"Jun 1"  },
  { id:"content-5",     name:"Content Explorer",   desc:"Viewed 5 learning content items",            icon:"📚", color:"from-green-400 to-green-600",   xp:60,  earned:true,  date:"Jun 12" },
  { id:"readiness-70",  name:"Readiness Milestone", desc:"Reached a readiness index of 70%",          icon:"⚡", color:"from-indigo-400 to-indigo-600", xp:120, earned:true,  date:"Jun 10" },
  { id:"streak-7",      name:"Week Warrior",        desc:"Maintained a 7-day learning streak",        icon:"🏅", color:"from-yellow-400 to-amber-500",  xp:150, earned:true,  date:"Jun 20" },
  { id:"english-pass",  name:"English Champion",   desc:"Passed the English diagnostic test (75%+)",  icon:"📝", color:"from-cyan-400 to-cyan-600",     xp:100, earned:true,  date:"Jun 18" },

  /* Locked */
  { id:"all-tests",     name:"Test Master",         desc:"Complete all 5 diagnostic tests",           icon:"🏆", color:"from-gray-300 to-gray-400",     xp:200, earned:false, progress:3, total:5   },
  { id:"readiness-80",  name:"High Achiever",       desc:"Reach a readiness index of 80%",            icon:"🎓", color:"from-gray-300 to-gray-400",     xp:150, earned:false, progress:74, total:80  },
  { id:"streak-14",     name:"Fortnight Fire",      desc:"Maintain a 14-day learning streak",         icon:"💎", color:"from-gray-300 to-gray-400",     xp:250, earned:false, progress:7,  total:14  },
  { id:"content-all",   name:"Content Champion",   desc:"Complete all available learning content",    icon:"📖", color:"from-gray-300 to-gray-400",     xp:200, earned:false, progress:3,  total:6   },
  { id:"math-pass",     name:"Math Whiz",           desc:"Pass the Mathematics diagnostic test",      icon:"🔢", color:"from-gray-300 to-gray-400",     xp:100, earned:false, progress:62, total:75  },
  { id:"perfect",       name:"Perfect Score",       desc:"Score 100% on any diagnostic test",         icon:"⭐", color:"from-gray-300 to-gray-400",     xp:300, earned:false, progress:0,  total:100 },
];

const levels = [
  { level:1, name:"Beginner",     minXp:0,   maxXp:200  },
  { level:2, name:"Explorer",     minXp:200, maxXp:500  },
  { level:3, name:"Practitioner", minXp:500, maxXp:900  },
  { level:4, name:"Achiever",     minXp:900, maxXp:1500 },
  { level:5, name:"Expert",       minXp:1500,maxXp:2500 },
];

const totalXp       = badges.filter(b => b.earned).reduce((s, b) => s + b.xp, 0);
const earnedBadges  = badges.filter(b => b.earned);
const lockedBadges  = badges.filter(b => !b.earned);
const currentLevel  = levels.find(l => totalXp >= l.minXp && totalXp < l.maxXp) || levels[levels.length - 1];
const nextLevel     = levels.find(l => l.level === currentLevel.level + 1);
const levelProgress = nextLevel ? Math.round(((totalXp - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)) * 100) : 100;

const tabs = ["All Badges", "Earned", "Locked"];

export function Achievements({ navigate, user, onLogout }) {
  const [tab, setTab] = useState("All Badges");

  const displayed = tab === "All Badges" ? badges : tab === "Earned" ? earnedBadges : lockedBadges;

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="achievements">
      <div className="p-5 space-y-5">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1a3a5c] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-white/15 px-2 py-0.5 rounded font-mono">M04</span>
            <span className="text-blue-300 text-xs">Achievements & Badges</span>
          </div>
          <h2 className="mb-1" style={{ fontSize:"1.25rem", fontWeight:700 }}>Your Achievements</h2>
          <p className="text-blue-200/70 text-sm">Collect badges and earn XP by completing learning goals.</p>
        </div>

        {/* Level Card + Stats */}
        <div className="grid grid-cols-3 gap-4">
          {/* Level */}
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Current Level</p>
                <h3 className="text-gray-800" style={{ fontSize:"1.1rem", fontWeight:700 }}>{currentLevel.name}</h3>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-[#3535C5] to-cyan-500 rounded-2xl flex flex-col items-center justify-center">
                <span className="text-white text-xs font-medium opacity-80">LVL</span>
                <span className="text-white text-xl font-bold leading-none">{currentLevel.level}</span>
              </div>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>{totalXp} XP earned</span>
                {nextLevel && <span>{nextLevel.minXp - totalXp} XP to Level {nextLevel.level}</span>}
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#3535C5] to-cyan-400 rounded-full transition-all duration-700" style={{ width:`${levelProgress}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-6 mt-3">
              {levels.map(l => (
                <div key={l.level} className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${totalXp >= l.minXp ? "bg-[#3535C5] text-white" : "bg-gray-200 text-gray-400"}`}>{l.level}</div>
                  <span className="text-gray-400 text-xs mt-1">{l.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* XP Stats */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col justify-between">
            <div>
              <p className="text-gray-500 text-xs mb-1">Total XP</p>
              <p className="text-gray-800 text-2xl font-bold">{totalXp}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs"><span className="text-gray-500">Badges earned</span><span className="text-gray-800 font-semibold">{earnedBadges.length}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Badges locked</span><span className="text-gray-800 font-semibold">{lockedBadges.length}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Completion</span><span className="text-[#3535C5] font-semibold">{Math.round((earnedBadges.length / badges.length) * 100)}%</span></div>
            </div>
            <div className="mt-2">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full" style={{ width:`${(earnedBadges.length / badges.length) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent earned */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="text-3xl">🏅</div>
          <div className="flex-1">
            <p className="text-amber-800 font-semibold text-sm">Latest Achievement: Week Warrior</p>
            <p className="text-amber-600 text-xs">You maintained a 7-day streak! +150 XP earned — Jun 20</p>
          </div>
          <div className="bg-amber-400/20 border border-amber-300 rounded-full px-3 py-1">
            <span className="text-amber-700 text-xs font-bold">+150 XP</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 p-1.5 flex gap-1">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? "bg-[#3535C5] text-white" : "text-gray-500 hover:bg-gray-50"}`}>
              {t} {t === "Earned" && <span className="ml-1 text-xs opacity-70">{earnedBadges.length}</span>}
              {t === "Locked" && <span className="ml-1 text-xs opacity-70">{lockedBadges.length}</span>}
            </button>
          ))}
        </div>

        {/* Badge Grid */}
        <div className="grid grid-cols-3 gap-4">
          {displayed.map(badge => (
            <div key={badge.id}
              className={`bg-white rounded-2xl border p-4 transition-all duration-200 ${badge.earned ? "border-gray-100 hover:shadow-md hover:-translate-y-0.5" : "border-gray-100 opacity-70"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl ${badge.earned ? badge.color : "from-gray-100 to-gray-200"}`}>
                  {badge.earned ? badge.icon : <Lock className="w-5 h-5 text-gray-400" />}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {badge.earned
                    ? <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" /> Earned</span>
                    : <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Locked</span>}
                  <span className="text-xs text-amber-600 font-semibold">+{badge.xp} XP</span>
                </div>
              </div>
              <h4 className="text-gray-800 font-semibold text-sm mb-0.5">{badge.name}</h4>
              <p className="text-gray-400 text-xs leading-relaxed">{badge.desc}</p>
              {badge.earned && <p className="text-green-500 text-xs mt-2">Earned {badge.date}</p>}
              {!badge.earned && badge.progress !== undefined && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{badge.progress} / {badge.total}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#3535C5]/40 rounded-full" style={{ width:`${(badge.progress / badge.total) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </AppLayout>
  );
}
