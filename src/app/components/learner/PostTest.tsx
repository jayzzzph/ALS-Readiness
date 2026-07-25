import { useState } from "react";
import { ClipboardList, ChevronRight, ChevronLeft, Clock, CheckCircle, Star, X, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";

const subjects = [
  { id:"english",  label:"English",           strandCode:"LS1", color:"blue",   questions:5, preScore:78 },
  { id:"math",     label:"Mathematics",        strandCode:"LS3", color:"purple", questions:5, preScore:62 },
  { id:"science",  label:"Science",            strandCode:"LS4", color:"teal",   questions:5, preScore:85 },
  { id:"filipino", label:"Filipino",           strandCode:"LS1", color:"orange", questions:5, preScore:71 },
  { id:"ap",       label:"Araling Panlipunan", strandCode:"LS6", color:"red",    questions:5, preScore:69 },
];

const postQuestions = {
  english: [
    { id:1, question:"Which word best completes: 'The scientist conducted a thorough ___.'", choices:["experiment","experimenting","experimental","experimentally"], correct:0, topic:"Vocabulary" },
    { id:2, question:"Identify the type of sentence: 'Although she was tired, she finished her work.'", choices:["Simple","Compound","Complex","Compound-Complex"], correct:2, topic:"Grammar" },
    { id:3, question:"What does the word 'eloquent' mean?", choices:["Quiet and reserved","Fluent and persuasive","Confused and uncertain","Loud and aggressive"], correct:1, topic:"Vocabulary" },
    { id:4, question:"Choose the correct form: 'Neither the students nor the teacher ___ ready.'", choices:["was","were","are","be"], correct:0, topic:"Grammar" },
    { id:5, question:"What literary device is in 'Life is a journey'?", choices:["Simile","Metaphor","Personification","Hyperbole"], correct:1, topic:"Literature" },
  ],
};

const colorMap = { blue:"text-blue-600 bg-blue-50 border-blue-200", purple:"text-purple-600 bg-purple-50 border-purple-200", teal:"text-teal-600 bg-teal-50 border-teal-200", orange:"text-orange-600 bg-orange-50 border-orange-200", red:"text-red-600 bg-red-50 border-red-200" };
const btnColor  = { blue:"bg-blue-500 hover:bg-blue-600 text-white", purple:"bg-purple-500 hover:bg-purple-600 text-white", teal:"bg-teal-500 hover:bg-teal-600 text-white", orange:"bg-orange-500 hover:bg-orange-600 text-white", red:"bg-red-500 hover:bg-red-600 text-white" };

export function PostTest({ navigate, user, onLogout }) {
  const [activeSubject,  setActiveSubject]  = useState(null);
  const [currentQ,       setCurrentQ]       = useState(0);
  const [answers,        setAnswers]        = useState({});
  const [testDone,       setTestDone]       = useState(false);
  const [completedSubs,  setCompletedSubs]  = useState({ english:null, math:null, science:null, filipino:null, ap:null });
  const [timeLeft]                          = useState(15 * 60);

  const questions = activeSubject ? (postQuestions[activeSubject] || postQuestions.english) : [];

  const handleStart = (sid) => { setActiveSubject(sid); setCurrentQ(0); setAnswers({}); setTestDone(false); };

  const handleAnswer = (idx) => setAnswers(p => ({ ...p, [currentQ]: idx }));

  const handleNext = () => {
    if (currentQ < questions.length - 1) setCurrentQ(q => q + 1);
    else {
      const correct = questions.filter((q, i) => answers[i] === q.correct).length;
      const score   = Math.round((correct / questions.length) * 100);
      setCompletedSubs(p => ({ ...p, [activeSubject]: score }));
      setTestDone(true);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const subject = subjects.find(s => s.id === activeSubject);
  const allDone = Object.values(completedSubs).every(v => v !== null);

  /* ── Results comparison ── */
  if (testDone && subject) {
    const postScore = completedSubs[activeSubject];
    const diff      = postScore - subject.preScore;
    const improved  = diff >= 0;
    return (
      <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="post-test">
        <div className="p-5 max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-gray-800 mb-1" style={{ fontSize:"1.4rem", fontWeight:700 }}>Post-test Complete!</h2>
            <p className="text-gray-500 text-sm mb-6">{subject.label} — Compare your pre- and post-test results</p>

            {/* Score comparison */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <div className="text-gray-400 text-xs mb-1">Pre-test Score</div>
                <div className="text-gray-700 text-2xl font-bold">{subject.preScore}%</div>
              </div>
              <div className={`p-4 rounded-2xl ${improved ? "bg-green-50 border border-green-200" : "bg-orange-50 border border-orange-200"}`}>
                <div className={`text-xs mb-1 ${improved ? "text-green-600" : "text-orange-600"}`}>Change</div>
                <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${improved ? "text-green-600" : "text-orange-600"}`}>
                  {improved ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                  {Math.abs(diff)}%
                </div>
              </div>
              <div className={`p-4 rounded-2xl ${postScore >= 75 ? "bg-green-50 border border-green-200" : "bg-blue-50 border border-blue-200"}`}>
                <div className={`text-xs mb-1 ${postScore >= 75 ? "text-green-600" : "text-blue-600"}`}>Post-test Score</div>
                <div className={`text-2xl font-bold ${postScore >= 75 ? "text-green-600" : "text-blue-600"}`}>{postScore}%</div>
              </div>
            </div>

            {improved
              ? <div className="flex items-center gap-2 justify-center text-green-600 bg-green-50 rounded-xl p-3 mb-4"><Star className="w-4 h-4" /><span className="text-sm">Great improvement! The stimulus content was effective for you.</span></div>
              : <div className="bg-orange-50 rounded-xl p-3 mb-4 text-orange-700 text-sm">Score dropped slightly. Consider reviewing the content again.</div>}

            <div className="flex gap-3">
              <button onClick={() => { setTestDone(false); setActiveSubject(null); }} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors">Back to Tests</button>
              <button onClick={() => navigate("my-progress")} className="flex-1 py-3 bg-gradient-to-r from-[#3535C5] to-cyan-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4" /> View Full Progress
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  /* ── Active test ── */
  if (activeSubject && !testDone) {
    const q = questions[currentQ];
    return (
      <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="post-test">
        <div className="p-5 max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded font-mono">POST-TEST</span>
                <h2 className="text-gray-800 font-semibold">{subject?.label}</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-xl">
                  <Clock className="w-4 h-4" /><span className="font-mono font-bold text-sm">{formatTime(timeLeft)}</span>
                </div>
                <button onClick={() => setActiveSubject(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Question {currentQ + 1} of {questions.length}</span>
              <span>{Object.keys(answers).length} answered</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all" style={{ width:`${((currentQ + 1) / questions.length) * 100}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded inline-block mb-4">{q?.topic}</span>
            <h3 className="text-gray-800 mb-5" style={{ fontSize:"1.05rem", fontWeight:500, lineHeight:1.6 }}>{q?.question}</h3>
            <div className="space-y-3">
              {q?.choices.map((choice, idx) => (
                <button key={idx} onClick={() => handleAnswer(idx)}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4 ${answers[currentQ] === idx ? "border-orange-400 bg-orange-50 text-orange-800" : "border-gray-200 bg-gray-50 text-gray-700 hover:border-orange-300"}`}>
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-sm font-bold ${answers[currentQ] === idx ? "border-orange-500 bg-orange-500 text-white" : "border-gray-300 text-gray-500"}`}>
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
              {questions.map((_, idx) => (
                <button key={idx} onClick={() => setCurrentQ(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium ${idx === currentQ ? "bg-orange-500 text-white" : answers[idx] !== undefined ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500"}`}>
                  {idx + 1}
                </button>
              ))}
            </div>
            <button onClick={handleNext} disabled={answers[currentQ] === undefined}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl disabled:opacity-40 transition-all">
              {currentQ === questions.length - 1 ? "Submit" : "Next"} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  /* ── Subject selection ── */
  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="post-test">
      <div className="p-5 space-y-5">
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-mono">M02</span>
            <span className="text-orange-100 text-xs">Post-test — After Stimulus Content</span>
          </div>
          <h2 className="mb-1" style={{ fontSize:"1.25rem", fontWeight:700 }}>Post-test Assessments</h2>
          <p className="text-orange-100 text-sm">Complete the post-test for each subject you studied. Results are compared against your pre-test scores to measure improvement.</p>
        </div>

        {/* Pre vs Post comparison panel */}
        {Object.values(completedSubs).some(v => v !== null) && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-gray-800 font-semibold text-sm mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-orange-500" /> Pre vs Post Comparison</h3>
            <div className="space-y-3">
              {subjects.filter(s => completedSubs[s.id] !== null).map(s => {
                const post = completedSubs[s.id];
                const diff = post - s.preScore;
                return (
                  <div key={s.id} className="flex items-center gap-4">
                    <span className="text-gray-700 text-sm w-24">{s.label}</span>
                    <div className="flex-1 flex items-center gap-3">
                      <span className="text-gray-400 text-xs w-8 text-right">{s.preScore}%</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative">
                        <div className="h-full bg-gray-300 rounded-full absolute" style={{ width:`${s.preScore}%` }} />
                        <div className={`h-full rounded-full absolute ${post >= s.preScore ? "bg-green-500" : "bg-orange-400"}`} style={{ width:`${post}%` }} />
                      </div>
                      <span className={`text-xs font-bold w-8 ${post >= s.preScore ? "text-green-600" : "text-orange-500"}`}>{post}%</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${diff >= 0 ? "text-green-600 bg-green-50" : "text-orange-600 bg-orange-50"}`}>
                      {diff >= 0 ? "+" : ""}{diff}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(sub => {
            const postScore = completedSubs[sub.id];
            const isDone    = postScore !== null;
            const diff      = isDone ? postScore - sub.preScore : null;
            return (
              <div key={sub.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-mono text-gray-400">{sub.strandCode}</span>
                    <h3 className="text-gray-800 font-semibold text-sm">{sub.label}</h3>
                  </div>
                  {isDone ? (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${diff >= 0 ? "text-green-700 bg-green-100" : "text-orange-700 bg-orange-100"}`}>{postScore}%</span>
                  ) : (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Pending</span>
                  )}
                </div>
                {/* Pre score */}
                <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Pre-test: <span className="font-semibold text-gray-700">{sub.preScore}%</span></span>
                </div>
                {isDone ? (
                  <div className="space-y-2">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden relative">
                      <div className="h-full bg-gray-200 absolute rounded-full" style={{ width:`${sub.preScore}%` }} />
                      <div className={`h-full absolute rounded-full ${diff >= 0 ? "bg-green-500" : "bg-orange-400"}`} style={{ width:`${postScore}%` }} />
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${diff >= 0 ? "text-green-600" : "text-orange-600"}`}>
                      {diff >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      {diff >= 0 ? `+${diff}%` : `${diff}%`} from pre-test
                    </div>
                    <button onClick={() => handleStart(sub.id)} className="w-full py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors">Retake</button>
                  </div>
                ) : (
                  <button onClick={() => handleStart(sub.id)} className={`w-full py-2.5 text-sm rounded-xl transition-colors flex items-center justify-center gap-2 ${btnColor[sub.color]}`}>
                    Start Post-test <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {allDone && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-4">
            <CheckCircle className="w-10 h-10 text-green-500 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-green-800 font-bold">All Post-tests Complete!</h3>
              <p className="text-green-700 text-sm">You've completed the full diagnostic-to-delivery pipeline. View your learning progress summary.</p>
            </div>
            <button onClick={() => navigate("my-progress")} className="px-5 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> View Progress
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
