import { useEffect, useState } from "react";
import { BookOpen, ChevronRight, CircleAlert, ExternalLink, FileText, LoaderCircle, Sparkles } from "lucide-react";
import { getMyCohorts, getMyCurriculum, getMyStrands } from "../../../lib/api/learningContents";
import type { LearningStrandProgress, MyCohort, MyCurriculumResponse } from "../../../lib/api/types";
import { getErrorMessage } from "../../../lib/api/errors";
import { AppLayout } from "../shared/AppLayout";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));
}

function strandStatus(strand: LearningStrandProgress): string {
  if (strand.progress_percent === 100) return "Completed";
  if (strand.progress_percent && strand.progress_percent > 0) return "In progress";
  return "Not started";
}

function contentTypeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function StimulusContent({ navigate, user, onLogout }) {
  const [cohorts, setCohorts] = useState<MyCohort[]>([]);
  const [strands, setStrands] = useState<LearningStrandProgress[]>([]);
  const [curriculum, setCurriculum] = useState<MyCurriculumResponse | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadPage() {
      setLoadingPage(true);
      setError(null);
      try {
        const [cohortResponse, strandResponse] = await Promise.all([getMyCohorts(), getMyStrands()]);
        if (!cancelled) {
          setCohorts(cohortResponse.cohorts);
          setStrands(strandResponse);
        }
      } catch (requestError) {
        if (!cancelled) setError(getErrorMessage(requestError, "Unable to load learning contents."));
      } finally {
        if (!cancelled) setLoadingPage(false);
      }
    }
    void loadPage();
    return () => { cancelled = true; };
  }, []);

  async function openStrand(strand: LearningStrandProgress) {
    setLoadingCurriculum(true);
    setError(null);
    try {
      // The id, rather than a display label, is the backend's curriculum key.
      setCurriculum(await getMyCurriculum(strand.strand_id));
    } catch (requestError) {
      setCurriculum(null);
      setError(getErrorMessage(requestError, "Unable to load this learning strand."));
    } finally {
      setLoadingCurriculum(false);
    }
  }

  const cohort = cohorts[0];
  const hasContents = curriculum?.modules.some((module) => module.lessons.some((lesson) => lesson.contents.length > 0)) ?? false;

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="stimulus-content">
      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        <header className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 text-white">
          <p className="text-xs bg-white/20 inline-block px-2 py-1 rounded font-mono mb-2">M04</p>
          <h1 className="text-2xl font-bold">Learning Contents</h1>
          <p className="text-green-100 text-sm mt-1">Browse the learning resources assigned to your cohort.</p>
        </header>

        {error && <div role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><CircleAlert className="w-5 h-5 shrink-0" />{error}</div>}

        <section className="bg-white rounded-2xl border border-gray-100 p-6" aria-labelledby="cohort-heading">
          <h2 id="cohort-heading" className="text-gray-800 font-semibold text-lg mb-4">Cohort Information</h2>
          {loadingPage ? <Loading /> : cohort ? (
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <Info label="Cohort Name" value={cohort.name} />
              <Info label="Cohort Code" value={cohort.code} />
              <Info label="School Year" value={cohort.school_year} />
              <Info label="Start Date" value={formatDate(cohort.start_date)} />
              <Info label="End Date" value={formatDate(cohort.end_date)} />
              <div><dt className="text-gray-500">Roster Link</dt><dd className="mt-1"><a href={`/api/cohorts/${cohort.id}/members`} className="inline-flex items-center gap-1 text-green-700 hover:underline font-medium">View cohort roster <ExternalLink className="w-3.5 h-3.5" /></a></dd></div>
            </dl>
          ) : <Empty message="No cohort information is available." />}
        </section>

        <section aria-labelledby="strands-heading">
          <h2 id="strands-heading" className="text-gray-800 font-semibold text-lg mb-4">Learning Strands</h2>
          {loadingPage ? <Loading /> : strands.length ? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {strands.map((strand) => <article key={strand.strand_id} className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col min-h-48 shadow-sm">
              <p className="text-xs font-mono text-green-700 font-semibold">{strand.code}</p>
              <h3 className="font-semibold text-gray-800 mt-2">{strand.name}</h3>
              <p className="text-sm text-gray-500 mt-auto pt-4">Status: <span className="font-medium text-gray-700">{strandStatus(strand)}</span></p>
              <button type="button" onClick={() => void openStrand(strand)} disabled={loadingCurriculum} className="mt-4 self-end rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">Open</button>
            </article>)}
          </div> : <Empty message="No learning strands are available for your cohort." />}
        </section>

        {loadingCurriculum && <Loading label="Loading curriculum…" />}
        {curriculum && !loadingCurriculum && <section className="bg-white rounded-2xl border border-gray-100 p-6" aria-labelledby="selected-strand-heading">
          <div className="border-b border-gray-100 pb-4 mb-5"><p className="text-sm text-gray-500">Selected Learning Strand</p><h2 id="selected-strand-heading" className="text-lg font-semibold text-gray-800 mt-1">{cohort?.code ? `${cohort.code} - ` : ""}{curriculum.strand_code} - {curriculum.strand_name}</h2></div>
          {!hasContents ? <Empty message="No learning contents available." /> : <div className="space-y-6">
            {curriculum.modules.map((module, moduleIndex) => <section key={module.module_id} aria-labelledby={`module-${module.module_id}`}>
              <h3 id={`module-${module.module_id}`} className="font-semibold text-gray-800 flex items-center gap-2"><BookOpen className="w-5 h-5 text-green-600" />Module {moduleIndex + 1} - {module.title}</h3>
              <div className="ml-3 mt-3 border-l-2 border-green-100 pl-5 space-y-4">
                {module.lessons.map((lesson, lessonIndex) => <article key={lesson.lesson_id}><h4 className="font-medium text-gray-700">Lesson {lessonIndex + 1} - {lesson.title}</h4>
                  {lesson.contents.length ? <ul className="mt-2 space-y-2">{lesson.contents.map((content) => <li key={content.content_id} className="flex items-start gap-2 text-sm text-gray-600"><ChevronRight className="w-4 h-4 mt-0.5 text-green-600 shrink-0" /><span>{content.stimulus_level && <span className="block text-green-700 mb-1"><Sparkles className="inline w-3.5 h-3.5 mr-1" />Readiness Profile Recommendation: {content.stimulus_level}</span>}<span className="inline-flex items-center gap-1"><FileText className="w-3.5 h-3.5" />File ({contentTypeLabel(content.content_type)}) - {content.title}</span></span></li>)}</ul> : <p className="mt-2 text-sm text-gray-400">No learning contents available for this lesson.</p>}</article>)}
              </div>
            </section>)}
          </div>}
        </section>}
      </main>
    </AppLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-gray-500">{label}</dt><dd className="font-medium text-gray-800 mt-1">{value}</dd></div>; }
function Empty({ message }: { message: string }) { return <div className="py-8 text-center text-sm text-gray-500">{message}</div>; }
function Loading({ label = "Loading…" }: { label?: string }) { return <div className="py-8 flex justify-center items-center gap-2 text-sm text-gray-500"><LoaderCircle className="w-5 h-5 animate-spin" />{label}</div>; }
