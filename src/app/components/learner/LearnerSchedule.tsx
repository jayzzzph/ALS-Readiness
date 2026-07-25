import { useState } from "react";
import { CalendarDays, Clock, ClipboardList, BookOpen, Activity, Bell, CheckCircle, ChevronLeft, ChevronRight, Plus, Flame } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";

const DAYS    = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS  = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const events = [
  { id:1,  date:"2026-07-07", type:"test",    title:"Science Diagnostic Test",   time:"9:00 AM",  duration:"30 min", module:"M02", done:false, urgent:true  },
  { id:2,  date:"2026-07-07", type:"content", title:"Algebra Basics — Audio",    time:"11:00 AM", duration:"18 min", module:"M04", done:false, urgent:false },
  { id:3,  date:"2026-07-08", type:"profile", title:"Readiness Profile Update",  time:"Any time", duration:"5 min",  module:"M03", done:false, urgent:false },
  { id:4,  date:"2026-07-08", type:"content", title:"Filipino Literature Video", time:"2:00 PM",  duration:"25 min", module:"M04", done:false, urgent:false },
  { id:5,  date:"2026-07-09", type:"test",    title:"Math Diagnostic Test",      time:"10:00 AM", duration:"30 min", module:"M02", done:false, urgent:true  },
  { id:6,  date:"2026-07-10", type:"content", title:"AP History Reading",        time:"3:00 PM",  duration:"20 min", module:"M04", done:false, urgent:false },
  { id:7,  date:"2026-07-11", type:"test",    title:"Filipino Diagnostic Test",  time:"9:00 AM",  duration:"30 min", module:"M02", done:false, urgent:false },
  { id:8,  date:"2026-07-12", type:"content", title:"English Grammar Podcast",   time:"11:00 AM", duration:"22 min", module:"M04", done:false, urgent:false },
  { id:9,  date:"2026-07-13", type:"profile", title:"Weekly Readiness Check",    time:"Any time", duration:"10 min", module:"M03", done:false, urgent:false },
];

const streakDays = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const streakDone = [true, true, true, true, true, true, false];

const typeStyle = {
  test:    { color:"bg-purple-100 text-purple-700 border-purple-200", icon:ClipboardList, dot:"bg-purple-500", bar:"bg-purple-500" },
  content: { color:"bg-blue-100 text-blue-700 border-blue-200",       icon:BookOpen,      dot:"bg-blue-500",   bar:"bg-blue-500"   },
  profile: { color:"bg-teal-100 text-teal-700 border-teal-200",       icon:Activity,      dot:"bg-teal-500",   bar:"bg-teal-500"   },
};

function buildCalendar(year, month) {
  const first    = new Date(year, month, 1).getDay();
  const daysInM  = new Date(year, month + 1, 0).getDate();
  const cells    = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= daysInM; d++) cells.push(d);
  return cells;
}

export function LearnerSchedule({ navigate, user, onLogout }) {
  const today       = new Date("2026-07-06");
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [selected,  setSelected]  = useState(7); // July 7

  const cells       = buildCalendar(viewYear, viewMonth);
  const fmtDate     = (d) => `${viewYear}-${String(viewMonth + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const hasEvent    = (d) => events.some(e => e.date === fmtDate(d));
  const hasUrgent   = (d) => events.some(e => e.date === fmtDate(d) && e.urgent);
  const selectedFmt = fmtDate(selected);
  const dayEvents   = events.filter(e => e.date === selectedFmt);
  const upcomingAll = events.filter(e => e.date >= "2026-07-06").slice(0, 6);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const [tasksDone, setTasksDone] = useState({});
  const toggleDone = (id) => setTasksDone(p => ({ ...p, [id]: !p[id] }));

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="learner-schedule">
      <div className="p-5 space-y-5">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1a3a5c] rounded-2xl p-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-white/15 px-2 py-0.5 rounded font-mono">M04</span>
              <span className="text-blue-300 text-xs">Learning Schedule & Calendar</span>
            </div>
            <h2 className="mb-1" style={{ fontSize:"1.25rem", fontWeight:700 }}>My Schedule</h2>
            <p className="text-blue-200/70 text-sm">Plan your diagnostic tests, content sessions, and readiness check-ins.</p>
          </div>
          <div className="flex items-center gap-2 bg-orange-500/20 border border-orange-400/30 rounded-xl px-4 py-2.5">
            <Flame className="w-5 h-5 text-orange-400" />
            <div>
              <div className="text-orange-300 text-xs">Current streak</div>
              <div className="text-white font-bold">7 days 🔥</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">

          {/* ── Calendar ── */}
          <div className="col-span-1 bg-white rounded-2xl border border-gray-100 p-4">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <h3 className="text-gray-800 font-semibold text-sm">{MONTHS[viewMonth]} {viewYear}</h3>
              <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => <div key={d} className="text-center text-gray-400 text-xs py-1">{d[0]}</div>)}
            </div>

            {/* Date cells */}
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((d, i) => {
                if (!d) return <div key={i} />;
                const isToday   = d === today.getDate() && viewMonth === today.getMonth();
                const isSel     = d === selected;
                const hasEv     = hasEvent(d);
                const isUrgent  = hasUrgent(d);
                return (
                  <button key={i} onClick={() => setSelected(d)}
                    className={`relative w-full aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-medium transition-all ${isSel ? "bg-[#3535C5] text-white" : isToday ? "bg-blue-50 text-[#3535C5] font-bold" : "hover:bg-gray-50 text-gray-700"}`}>
                    {d}
                    {hasEv && !isSel && (
                      <div className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isUrgent ? "bg-red-400" : "bg-[#3535C5]"}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 space-y-1.5">
              {[
                { dot:"bg-purple-500",  label:"Diagnostic Test" },
                { dot:"bg-blue-500",    label:"Learning Content" },
                { dot:"bg-teal-500",    label:"Profile Update" },
                { dot:"bg-red-400",     label:"Urgent / Due soon" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-2 text-xs text-gray-500">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${l.dot}`} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* ── Day Detail + Upcoming ── */}
          <div className="col-span-2 space-y-4">

            {/* Selected day */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-gray-800 font-semibold">
                    {MONTHS[viewMonth]} {selected}, {viewYear}
                    {selected === today.getDate() && viewMonth === today.getMonth() && (
                      <span className="ml-2 text-xs text-[#3535C5] bg-blue-50 px-2 py-0.5 rounded-full">Today</span>
                    )}
                  </h3>
                  <p className="text-gray-400 text-xs mt-0.5">{dayEvents.length} item{dayEvents.length !== 1 ? "s" : ""} scheduled</p>
                </div>
              </div>

              {dayEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No tasks scheduled for this day.</p>
                  <p className="text-xs mt-1">Select another date to view tasks.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {dayEvents.map(ev => {
                    const style  = typeStyle[ev.type];
                    const Icon   = style.icon;
                    const isDone = tasksDone[ev.id];
                    return (
                      <div key={ev.id}
                        className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all ${isDone ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-100"}`}>
                        <div className={`w-1 h-12 rounded-full flex-shrink-0 ${isDone ? "bg-green-400" : style.bar}`} />
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isDone ? "bg-green-100" : style.color.split(" ").slice(0,2).join(" ")}`}>
                          {isDone ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${isDone ? "text-green-700 line-through" : "text-gray-800"}`}>{ev.title}</div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-gray-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{ev.time}</span>
                            <span className="text-gray-400 text-xs">{ev.duration}</span>
                            {ev.urgent && !isDone && <span className="text-red-500 text-xs bg-red-50 px-1.5 py-0.5 rounded-full">Urgent</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-mono">{ev.module}</span>
                          <button onClick={() => toggleDone(ev.id)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isDone ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-400"}`}>
                            {isDone && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Upcoming */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-gray-800 font-semibold text-sm mb-4">Upcoming This Week</h3>
              <div className="space-y-2">
                {upcomingAll.map(ev => {
                  const style = typeStyle[ev.type];
                  const Icon  = style.icon;
                  const d     = new Date(ev.date);
                  const label = `${MONTHS[d.getMonth()].slice(0,3)} ${d.getDate()}`;
                  return (
                    <div key={ev.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelected(d.getDate())}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${style.color.split(" ").slice(0,2).join(" ")}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-700 text-xs font-medium truncate">{ev.title}</div>
                        <div className="text-gray-400 text-xs">{ev.time} · {ev.duration}</div>
                      </div>
                      <span className="text-gray-400 text-xs flex-shrink-0">{label}</span>
                      {ev.urgent && <span className="text-red-400 text-xs flex-shrink-0 font-medium">!</span>}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* ── Weekly Streak ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-gray-800 font-semibold text-sm">This Week's Streak</h3>
              <p className="text-gray-400 text-xs mt-0.5">Keep studying every day to maintain your streak!</p>
            </div>
            <div className="flex items-center gap-1.5 text-orange-500">
              <Flame className="w-5 h-5" />
              <span className="font-bold">7 days</span>
            </div>
          </div>
          <div className="flex gap-3">
            {streakDays.map((day, i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <div className={`w-full aspect-square rounded-xl flex items-center justify-center ${streakDone[i] ? "bg-gradient-to-br from-orange-400 to-red-500" : "bg-gray-100 border-2 border-dashed border-gray-200"}`}>
                  {streakDone[i] ? <Flame className="w-5 h-5 text-white" /> : <div className="w-2 h-2 rounded-full bg-gray-300" />}
                </div>
                <span className={`text-xs font-medium ${streakDone[i] ? "text-orange-500" : "text-gray-400"}`}>{day}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
