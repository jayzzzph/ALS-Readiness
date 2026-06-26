import { useState, useEffect } from "react";
import { ClipboardList, ChevronRight, ChevronLeft, Clock, CheckCircle, BookOpen, Calculator, FlaskConical, Globe, FileText, Star, X, RotateCcw, Zap } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";

const subjects = [
  { id: "english",  label: "English",             strandCode: "LS1", nextCode: "LS2", icon: BookOpen,     color: "blue",   questions: 20, status: "available",  score: null },
  { id: "math",     label: "Mathematics",          strandCode: "LS2", nextCode: "LS3", icon: Calculator,   color: "purple", questions: 20, status: "completed",  score: 78   },
  { id: "science",  label: "Science",              strandCode: "LS3", nextCode: "LS4", icon: FlaskConical, color: "teal",   questions: 20, status: "available",  score: null },
  { id: "ap",       label: "Araling Panlipunan",   strandCode: "LS4", nextCode: "LS5", icon: Globe,        color: "orange", questions: 20, status: "available",  score: null },
  { id: "filipino", label: "Filipino",             strandCode: "LS5", nextCode: null,  icon: FileText,     color: "red",    questions: 20, status: "available",  score: null },
];

const englishQuestions = [
  { id: 1, question: "Which sentence is grammatically correct?",                                           choices: ["She go to school every day.", "She goes to school every day.", "She going to school every day.", "She gone to school every day."], correct: 1, topic: "Grammar" },
  { id: 2, question: "What is the synonym of 'eloquent'?",                                                 choices: ["Quiet", "Articulate", "Confused", "Timid"],                                                                                    correct: 1, topic: "Vocabulary" },
  { id: 3, question: "In 'The book that was on the table is mine,' what is the relative clause?",          choices: ["The book", "that was on the table", "is mine", "on the table"],                                                                correct: 1, topic: "Sentence Structure" },
  { id: 4, question: "Choose the correct preposition: 'She is good ___ mathematics.'",                    choices: ["in", "at", "on", "for"],                                                                                                       correct: 1, topic: "Grammar" },
  { id: 5, question: "What literary device is used in 'The wind whispered through the trees'?",           choices: ["Simile", "Metaphor", "Personification", "Alliteration"],                                                                       correct: 2, topic: "Literature" },
];

const mathReviewData = [
  { question: "What is 15% of 200?",                choices: ["25", "30", "35", "40"],          correct: 1, userAnswer: 1, topic: "Percentage" },
  { question: "Solve for x: 3x + 6 = 21",          choices: ["3", "4", "5", "6"],              correct: 2, userAnswer: 0, topic: "Algebra" },
  { question: "Area of a circle with radius 7?",   choices: ["44π", "49π", "14π", "28π"],     correct: 1, userAnswer: 1, topic: "Geometry" },
];

const colorMap  = { blue: "text-blue-600 bg-blue-50 border-blue-200", purple: "text-purple-600 bg-purple-50 border-purple-200", teal: "text-teal-600 bg-teal-50 border-teal-200", orange: "text-orange-600 bg-orange-50 border-orange-200", red: "text-red-600 bg-red-50 border-red-200" };
const btnColor  = { blue: "bg-blue-500 hover:bg-blue-600 text-white", purple: "bg-purple-500 hover:bg-purple-600 text-white", teal: "bg-teal-500 hover:bg-teal-600 text-white", orange: "bg-orange-500 hover:bg-orange-600 text-white", red: "bg-red-500 hover:bg-red-600 text-white" };

/* ─── Break Screen ─────────────────────────────────────────────── */
function BreakScreen({ completedSubject, onContinue, completedCount, totalCount }) {
  const [mood, setMood]         = useState(null);
  const [breaking, setBreaking] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const moods = ["Focused", "Neutral", "Tired", "Anxious"];
  const nextLabel = completedSubject?.nextCode ? `Continue to ${completedSubject.nextCode}` : "Finish Test";

  const handleBreak = () => {
    setBreaking(true);
    setCountdown(120);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) { setBreaking(false); setCountdown(null); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const fmtCountdown = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-[#1c1c1e] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-black" />
          </div>
          <span className="text-white font-semibold">ALS Readiness</span>
          <span className="text-gray-500 text-sm">Diagnostic test</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400 text-sm">
          <Clock className="w-4 h-4" />
          <span className="font-mono">Break</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-xl mx-auto w-full py-12">
        {/* Check circle */}
        <div className="w-16 h-16 rounded-full border-2 border-green-500 bg-green-500/10 flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>

        {/* Strand label */}
        <p className="text-yellow-400 text-xs font-bold tracking-widest uppercase mb-3">
          {completedSubject?.strandCode} — {completedSubject?.label?.toUpperCase()} COMPLETE
        </p>

        {/* Headline */}
        <h1 className="text-white text-center mb-8" style={{ fontSize: "1.75rem", fontWeight: 700, lineHeight: 1.3 }}>
          Nice work. Take a short break<br />before continuing.
        </h1>

        {/* Progress bar */}
        <div className="w-full mb-8">
          <div className="flex justify-between text-gray-400 text-xs mb-2">
            <span>Overall progress</span>
            <span>{completedCount} of {totalCount} strands</span>
          </div>
          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 rounded-full transition-all duration-700" style={{ width: `${(completedCount / totalCount) * 100}%` }} />
          </div>
        </div>

        {/* Quick check-in */}
        <div className="w-full bg-[#2c2c2e] rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-400 text-sm">✦</span>
            <span className="text-white font-semibold text-sm">Quick check-in</span>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            How are you feeling right now? This helps us pace the rest of the test.
          </p>
          <div className="flex gap-2 flex-wrap">
            {moods.map(m => (
              <button key={m} onClick={() => setMood(m)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${mood === m ? "border-yellow-400 bg-yellow-400/10 text-yellow-300" : "border-white/20 text-white hover:border-white/40"}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Break / Continue buttons */}
        {breaking && countdown !== null ? (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="text-gray-400 text-sm">Break ends in</div>
            <div className="text-yellow-400 font-mono text-4xl font-bold">{fmtCountdown(countdown)}</div>
            <button onClick={() => { setBreaking(false); setCountdown(null); onContinue(mood); }}
              className="px-8 py-3 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl font-semibold text-sm transition-colors">
              Skip break &amp; Continue
            </button>
          </div>
        ) : (
          <div className="flex gap-3 w-full">
            <button onClick={handleBreak}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/15 text-white rounded-xl font-medium text-sm transition-colors">
              Take a 2-min break
            </button>
            <button onClick={() => onContinue(mood)}
              className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
              {nextLabel} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Review Screen ────────────────────────────────────────────── */
function ReviewScreen({ onClose, onRetake }) {
  return (
    <AppLayout navigate={() => {}} user={null} onLogout={() => {}} currentPage="diagnostic-test">
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-gray-800" style={{ fontSize: "1.25rem", fontWeight: 700 }}>Mathematics — Test Review</h2>
            <p className="text-gray-500 text-sm">Reviewing your previous answers</p>
          </div>
          <button onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors text-sm">
            <X className="w-4 h-4" /> Close Review
          </button>
        </div>
        <div className="space-y-4">
          {mathReviewData.map((q, idx) => {
            const isCorrect = q.userAnswer === q.correct;
            return (
              <div key={idx} className={`bg-white rounded-2xl border p-5 ${isCorrect ? "border-green-200" : "border-red-200"}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{q.topic}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                  </span>
                </div>
                <p className="text-gray-800 font-medium mb-3">{q.question}</p>
                <div className="space-y-2">
                  {q.choices.map((choice, cidx) => (
                    <div key={cidx} className={`flex items-center gap-3 p-3 rounded-xl text-sm ${cidx === q.correct ? "bg-green-50 border border-green-300 text-green-800" : cidx === q.userAnswer && !isCorrect ? "bg-red-50 border border-red-300 text-red-800" : "bg-gray-50 text-gray-600"}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${cidx === q.correct ? "bg-green-500 text-white" : cidx === q.userAnswer && !isCorrect ? "bg-red-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                        {String.fromCharCode(65 + cidx)}
                      </div>
                      {choice}
                      {cidx === q.correct && <span className="ml-auto text-xs text-green-600 font-medium">Correct</span>}
                      {cidx === q.userAnswer && !isCorrect && <span className="ml-auto text-xs text-red-600 font-medium">Your Answer</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onRetake} className="flex items-center gap-2 px-5 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors">
            <RotateCcw className="w-4 h-4" /> Retake Test
          </button>
          <button onClick={onClose} className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors">
            Back to Tests
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

/* ─── Main Component ───────────────────────────────────────────── */
export function DiagnosticTest({ navigate, user, onLogout }) {
  const [activeSubject, setActiveSubject]   = useState(null);
  const [currentQ, setCurrentQ]             = useState(0);
  const [answers, setAnswers]               = useState({});
  const [testCompleted, setTestCompleted]   = useState(false);
  const [showBreak, setShowBreak]           = useState(false);
  const [completedCount, setCompletedCount] = useState(1);
  const [reviewMode, setReviewMode]         = useState(false);
  const [timeLeft]                          = useState(30 * 60);

  const totalStrands = subjects.length;

  const handleStartTest = (subjectId) => {
    setActiveSubject(subjectId);
    setCurrentQ(0);
    setAnswers({});
    setTestCompleted(false);
    setShowBreak(false);
  };

  const handleAnswer = (idx) => setAnswers(prev => ({ ...prev, [currentQ]: idx }));

  const handleNext = () => {
    if (currentQ < englishQuestions.length - 1) setCurrentQ(q => q + 1);
    else setTestCompleted(true);
  };

  const handleSubmitTest = () => {
    setTestCompleted(false);
    setShowBreak(true);
    setCompletedCount(c => c + 1);
  };

  const handleBreakContinue = () => {
    setShowBreak(false);
    setActiveSubject(null);
  };

  const calcScore = () => {
    let c = 0;
    englishQuestions.forEach((q, idx) => { if (answers[idx] === q.correct) c++; });
    return Math.round((c / englishQuestions.length) * 100);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const completedSubject = subjects.find(s => s.id === activeSubject) || subjects[0];

  /* ── Break screen (full-page, no sidebar) */
  if (showBreak) {
    return (
      <BreakScreen
        completedSubject={completedSubject}
        onContinue={handleBreakContinue}
        completedCount={completedCount}
        totalCount={totalStrands}
      />
    );
  }

  /* ── Review screen */
  if (reviewMode) {
    return (
      <ReviewScreen
        onClose={() => setReviewMode(false)}
        onRetake={() => { setReviewMode(false); handleStartTest("math"); }}
      />
    );
  }

  /* ── Active test */
  if (activeSubject && !testCompleted) {
    const q       = englishQuestions[currentQ];
    const subject = subjects.find(s => s.id === activeSubject);
    return (
      <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="diagnostic-test">
        <div className="p-6 max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-purple-500 bg-purple-50 px-2 py-1 rounded font-mono">M02</span>
                <h2 className="text-gray-800" style={{ fontWeight: 600 }}>{subject.label} — Diagnostic Test</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-xl">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                </div>
                <button onClick={() => setActiveSubject(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>Question {currentQ + 1} of {englishQuestions.length}</span>
              <span>{Object.keys(answers).length} answered</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${((currentQ + 1) / englishQuestions.length) * 100}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded inline-block mb-4">{q.topic}</span>
            <h3 className="text-gray-800 mb-6" style={{ fontSize: "1.1rem", fontWeight: 500, lineHeight: 1.6 }}>{q.question}</h3>
            <div className="space-y-3">
              {q.choices.map((choice, idx) => (
                <button key={idx} onClick={() => handleAnswer(idx)}
                  className={`w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-4 ${answers[currentQ] === idx ? "border-blue-400 bg-blue-50 text-blue-800" : "border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-300 hover:bg-blue-50/50"}`}>
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-sm font-bold ${answers[currentQ] === idx ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300 text-gray-500"}`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  {choice}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentQ(q => q - 1)} disabled={currentQ === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <div className="flex gap-2">
              {englishQuestions.map((_, idx) => (
                <button key={idx} onClick={() => setCurrentQ(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${idx === currentQ ? "bg-blue-500 text-white" : answers[idx] !== undefined ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500"}`}>
                  {idx + 1}
                </button>
              ))}
            </div>
            <button onClick={handleNext} disabled={answers[currentQ] === undefined}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl disabled:opacity-40 transition-all">
              {currentQ === englishQuestions.length - 1 ? "Submit Test" : "Next"} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  /* ── Results screen */
  if (testCompleted) {
    const score   = calcScore();
    const correct = englishQuestions.filter((q, idx) => answers[idx] === q.correct).length;
    return (
      <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="diagnostic-test">
        <div className="p-6 max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-gray-800 mb-2" style={{ fontSize: "1.5rem", fontWeight: 700 }}>Test Completed!</h2>
            <p className="text-gray-500 mb-6">Your {subjects.find(s => s.id === activeSubject)?.label || "English"} Diagnostic Test results are in.</p>
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-6">
              <div><div className="text-white text-3xl font-bold">{score}%</div><div className="text-blue-100 text-xs">Score</div></div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-3 bg-green-50 rounded-xl"><div className="text-green-600 text-xl font-bold">{correct}</div><div className="text-green-700 text-xs">Correct</div></div>
              <div className="p-3 bg-red-50 rounded-xl"><div className="text-red-600 text-xl font-bold">{englishQuestions.length - correct}</div><div className="text-red-700 text-xs">Incorrect</div></div>
              <div className="p-3 bg-blue-50 rounded-xl"><div className="text-blue-600 text-xl font-bold">{englishQuestions.length}</div><div className="text-blue-700 text-xs">Total</div></div>
            </div>
            {score >= 75 && <div className="flex items-center gap-2 justify-center text-green-600 bg-green-50 rounded-xl p-3 mb-4"><Star className="w-4 h-4" /><span className="text-sm">Excellent! You passed this module.</span></div>}
            {score < 75 && <div className="bg-orange-50 rounded-xl p-3 mb-4 text-orange-700 text-sm">Keep practicing! Review the topics you missed.</div>}
            <div className="flex gap-3">
              <button onClick={() => { setTestCompleted(false); setActiveSubject(null); }} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors">Back to Tests</button>
              <button onClick={() => { setReviewMode(true); setTestCompleted(false); setActiveSubject(null); }}
                className="flex-1 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl transition-colors">Review Answers</button>
              <button onClick={handleSubmitTest}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-400 hover:to-cyan-400 transition-all">
                Next Strand →
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  /* ── Subject list */
  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="diagnostic-test">
      <div className="p-6">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-white/20 px-2 py-1 rounded font-mono">M02</span>
            <span className="text-purple-100 text-sm">Diagnostic & Inventory Test Module</span>
          </div>
          <h2 className="mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>Diagnostic Tests</h2>
          <p className="text-purple-100 text-sm">Preparatory Equivalency Exams — Complete all strands. A short break screen will appear after each strand.</p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Tests Completed", value: "1/5", icon: CheckCircle, cls: "text-green-600 bg-green-50" },
            { label: "Average Score",   value: "78%", icon: Star,         cls: "text-blue-600 bg-blue-50"  },
            { label: "Time Remaining",  value: "∞",   icon: Clock,        cls: "text-orange-600 bg-orange-50" },
            { label: "Strands Pending", value: "4",   icon: ClipboardList,cls: "text-purple-600 bg-purple-50" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.cls}`}><Icon className="w-5 h-5" /></div>
                <div><div className="text-gray-800 font-bold">{stat.value}</div><div className="text-gray-500 text-xs">{stat.label}</div></div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub) => {
            const Icon = sub.icon;
            return (
              <div key={sub.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${colorMap[sub.color]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono">{sub.strandCode}</span>
                    {sub.status === "completed" && sub.score !== null
                      ? <div className={`text-sm font-bold px-3 py-1 rounded-full ${sub.score >= 75 ? "text-green-700 bg-green-100" : "text-orange-700 bg-orange-100"}`}>{sub.score}%</div>
                      : <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Available</span>}
                  </div>
                </div>
                <h3 className="text-gray-800 mb-1" style={{ fontWeight: 600 }}>{sub.label}</h3>
                <p className="text-gray-500 text-sm mb-4">{sub.questions} questions • ~30 minutes</p>
                {sub.status === "completed" ? (
                  <div className="space-y-2">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${sub.score >= 75 ? "bg-green-500" : "bg-orange-400"}`} style={{ width: `${sub.score}%` }} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setReviewMode(true)} className="flex-1 py-2 text-sm bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors">Review</button>
                      <button onClick={() => handleStartTest(sub.id)} className={`flex-1 py-2 text-sm rounded-xl transition-colors ${btnColor[sub.color]}`}>Retake</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => handleStartTest(sub.id)} className={`w-full py-2.5 text-sm rounded-xl transition-colors flex items-center justify-center gap-2 ${btnColor[sub.color]}`}>
                    Start Test <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-5 flex items-start gap-3">
          <Zap className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-yellow-800 font-semibold mb-1">Break screens between strands</h4>
            <p className="text-yellow-700 text-sm">After completing each strand you'll see a short break screen with a mood check-in. You can take a 2-minute break or continue directly to the next strand.</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
