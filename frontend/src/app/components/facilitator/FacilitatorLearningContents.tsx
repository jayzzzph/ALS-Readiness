import { useState } from "react";
import {
  BookOpen, ChevronLeft, ChevronRight, ExternalLink, Calendar,
  Sparkles, FileX2, FileCheck2, Link as LinkIcon,
} from "lucide-react";
import { AppLayout } from "../shared/AppLayout";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "../ui/accordion";

/* ── Mock data — placeholder until wired to the cohort/curriculum endpoints ── */
const cohortInfo = {
  name: "Cohort A2 — Cabuyao ALS",
  code: "CBY-A2-2026",
  schoolYear: "2026-2027",
  startDate: "Jun 15, 2026",
  endDate: "Mar 20, 2027",
  posterLink: "https://example.org/cohorts/cby-a2-2026/poster",
};

const learningStrands = [
  { code: "FIL-LSY", name: "Filipino",  status: "Active" },
  { code: "LS3",      name: "Math",      status: "Active" },
  { code: "LS1-ENG",  name: "English",   status: "Draft"  },
];

const curriculumByStrand = {
  "FIL-LSY": [
    {
      title: "Module 1 — Pagbasa at Pag-unawa",
      lessons: [
        {
          title: "Lesson 1 — Pagsusuri ng Teksto",
          readinessRecommendation: "Visual stimulus recommended (readiness score 78%)",
          fileNotEvaluated: "pagsusuri_raw_v1.pdf",
          fileEvaluated: "pagsusuri_evaluated_final.pdf",
        },
      ],
    },
    {
      title: "Module 2 — Pagsulat",
      lessons: [{ title: "Lesson 1 — Sanaysay", readinessRecommendation: null, fileNotEvaluated: null, fileEvaluated: null }],
    },
  ],
  LS3: [
    {
      title: "Module 1 — Basic Operations",
      lessons: [
        {
          title: "Lesson 1 — Word Problems",
          readinessRecommendation: "Auditory stimulus recommended (readiness score 65%)",
          fileNotEvaluated: "word_problems_draft.pdf",
          fileEvaluated: null,
        },
      ],
    },
  ],
  "LS1-ENG": [],
};

const statusStyle = (s) =>
  s === "Active" ? "text-green-600 bg-green-50 border-green-200" : "text-gray-500 bg-gray-100 border-gray-200";

function CohortInfoCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-gray-800 font-semibold text-sm mb-3">Cohort Info</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <div className="text-gray-400 text-xs">Cohort Name</div>
          <div className="text-gray-800 text-sm font-medium">{cohortInfo.name}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">Cohort Code</div>
          <div className="text-gray-800 text-sm font-medium font-mono">{cohortInfo.code}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">School Year</div>
          <div className="text-gray-800 text-sm font-medium">{cohortInfo.schoolYear}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" /> Start / End Date</div>
          <div className="text-gray-800 text-sm font-medium">{cohortInfo.startDate} – {cohortInfo.endDate}</div>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="text-gray-400 text-xs flex items-center gap-1"><LinkIcon className="w-3 h-3" /> Poster Link</div>
          <a href={cohortInfo.posterLink} target="_blank" rel="noreferrer"
            className="text-[#3535C5] text-sm font-medium hover:underline flex items-center gap-1 truncate">
            View poster <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
}

function LearningStrandCard({ strand, onOpen }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-2">
        <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-5 h-5 text-orange-500" />
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${statusStyle(strand.status)}`}>{strand.status}</span>
      </div>
      <div className="text-gray-400 text-xs font-mono">{strand.code}</div>
      <h4 className="text-gray-800 font-semibold text-sm mb-3">{strand.name}</h4>
      <button onClick={() => onOpen(strand)}
        className="w-full py-2 text-xs bg-gray-50 hover:bg-orange-50 hover:text-orange-600 text-gray-600 rounded-xl transition-colors font-medium">
        Open
      </button>
    </div>
  );
}

function CurriculumView({ strand, onBack }) {
  const modules = curriculumByStrand[strand.code] || [];

  return (
    <div className="space-y-4">
      {/* Breadcrumb / header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <div>
          <div className="text-gray-400 text-xs font-mono">{cohortInfo.code} - {strand.code} - {strand.name}</div>
          <h2 className="text-gray-800 font-bold text-lg">Learning Curriculum</h2>
        </div>
      </div>

      {modules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No modules published yet for this strand.
        </div>
      ) : (
        modules.map((mod, mi) => (
          <div key={mi} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h3 className="text-gray-800 font-semibold text-sm">{mod.title}</h3>
            </div>
            <Accordion type="multiple" className="px-5">
              {mod.lessons.map((lesson, li) => (
                <AccordionItem key={li} value={`${mi}-${li}`}>
                  <AccordionTrigger className="text-gray-700 text-sm">{lesson.title}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pl-1">
                      <div className="flex items-center gap-2 text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-[#3535C5] flex-shrink-0" />
                        <span className="text-gray-500">Readiness Profile Recommendation:</span>
                        <span className="text-gray-700 font-medium">{lesson.readinessRecommendation || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <FileX2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-500">File (Not Evaluated):</span>
                        <span className="text-gray-700 font-medium">{lesson.fileNotEvaluated || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <FileCheck2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-500">File (Evaluated):</span>
                        <span className="text-gray-700 font-medium">{lesson.fileEvaluated || "—"}</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))
      )}
    </div>
  );
}

export function FacilitatorLearningContents({ navigate, user, onLogout }) {
  const [openStrand, setOpenStrand] = useState(null);

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="facilitator-learning-contents">
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1a3a5c] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-white/15 px-2 py-0.5 rounded font-mono">M05</span>
            <span className="text-blue-300 text-xs">Learning Curriculum</span>
          </div>
          <h2 className="mb-1" style={{ fontSize: "1.25rem", fontWeight: 700 }}>Learning Contents</h2>
          <p className="text-blue-200/70 text-sm">Cohort info and per-strand learning curriculum, module by module.</p>
        </div>

        {openStrand ? (
          <CurriculumView strand={openStrand} onBack={() => setOpenStrand(null)} />
        ) : (
          <>
            <CohortInfoCard />
            <div>
              <h3 className="text-gray-800 font-semibold text-sm mb-3">Learning Strands</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {learningStrands.map((strand) => (
                  <LearningStrandCard key={strand.code} strand={strand} onOpen={setOpenStrand} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
