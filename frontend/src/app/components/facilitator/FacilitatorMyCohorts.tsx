import { useSearchParams } from "react-router";
import { CalendarDays, LayoutDashboard, Users } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";
import type { PageProps } from "../../routes/ProtectedPage";
import { getCohort } from "../../../lib/api/facilitator";
import type { FacilitatorCohortItem, FacilitatorRosterRow } from "../../../lib/api/types";
import { formatDate } from "../../../lib/dates";
import { learnerCountLabel } from "../../../lib/dashboardText";
import { useFetch } from "../../../lib/hooks/useFetch";
import { DASH, orDash, personName } from "../../../lib/labels";
import { parseIdParam } from "../../../lib/learnersText";
import { learnerDetailPage } from "../../../lib/navigation";
import {
  COHORTS_ASSIGNED_TEXT,
  cohortDatesText,
  cohortsSubtitle,
  defaultCohortId,
  rosterCounts,
  rosterCountsText,
  rosterFailureText,
} from "../../../lib/reportsText";
import { useCohortSelection } from "../../../lib/store/cohortStore";
import {
  Button,
  Card,
  CohortStatus,
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  MemberStatus,
  PageHeader,
  type DataTableColumn,
} from "./shared";
import { PAGE_BODY } from "./shared/tokens";

/** The query parameter that keeps the selected cohort across a reload. */
const COHORT_PARAM = "cohort";

const DASHBOARD_PAGE = "facilitator-dashboard";
const LEARNERS_PAGE = "facilitator-learners";

const ROSTER_COLUMNS: DataTableColumn<FacilitatorRosterRow>[] = [
  { key: "learner", header: "Learner", render: (row) => <span className="text-[#1B1D26] font-bold whitespace-nowrap">{personName(row, "Unnamed learner")}</span> },
  { key: "id-no", header: "ID number", className: "text-[#4A4F5C] tabular-nums", render: (row) => orDash(row.id_no) },
  {
    key: "status",
    header: "Membership",
    render: (row) => <MemberStatus status={row.status} />,
  },
  { key: "assigned", header: "Date assigned", className: "text-[#4A4F5C] text-[0.9375rem]", render: (row) => formatDate(row.assigned_at) ?? DASH },
];

interface CohortCardProps {
  cohort: FacilitatorCohortItem;
  selected: boolean;
  onSelect: () => void;
}

function CohortCard({ cohort, selected, onSelect }: CohortCardProps) {
  const dates = cohortDatesText(cohort);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      // One background class per state: two competing bg classes left the selected card white.
      className={`w-full text-left rounded-2xl border-2 p-5 transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A] ${selected ? "border-[#00538A] bg-[#CFE4FF]" : "bg-white border-[#E2E0DA] hover:border-[#00538A]"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[#1B1D26] text-base font-bold">{cohort.name}</div>
          {cohort.code && <div className="text-[#4A4F5C] text-[0.9375rem] tabular-nums truncate">{cohort.code}</div>}
        </div>
        <CohortStatus status={cohort.status} />
      </div>
      <div className="flex items-center gap-3 flex-wrap text-[#4A4F5C] text-[0.9375rem] mt-3">
        <span className="inline-flex items-center gap-1"><Users className="w-4 h-4" aria-hidden="true" /> {learnerCountLabel(cohort.learner_count)}</span>
        {dates && <span className="inline-flex items-center gap-1"><CalendarDays className="w-4 h-4" aria-hidden="true" /> {dates}</span>}
      </div>
    </button>
  );
}

export function FacilitatorMyCohorts({ navigate, user, onLogout }: PageProps) {
  // The school year drives the list: every cohort of that year is shown,
  // whichever cohort the top bar has selected.
  const selection = useCohortSelection({ allowAll: true });
  const cohorts = selection.cohorts;
  const cohortsReady = selection.ready && !selection.loading && !selection.error;

  // The selected cohort lives in the URL, so a reload keeps it. Anything that
  // is not a positive whole number is ignored.
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCohortId = parseIdParam(searchParams.get(COHORT_PARAM));
  // With nothing in the URL the top bar's cohort is shown, or the first one listed.
  const cohortId = urlCohortId ?? (cohortsReady ? defaultCohortId(cohorts, selection.cohortId) : null);
  const listedCohort = cohorts.find((cohort) => cohort.id === cohortId) ?? null;

  // Keyed on the cohort: a slow roster for an earlier one is dropped by the hook.
  const detail = useFetch(() => getCohort(cohortId as number), [cohortId], {
    enabled: cohortId !== null,
    fallbackError: "Unable to load this cohort.",
  });
  const data = detail.data;

  const selectCohort = (id: number) => setSearchParams({ [COHORT_PARAM]: String(id) });

  // The shortcuts make the cohort the top bar's selection, then open the page.
  // The store only accepts a cohort of the selected school year.
  const openWithCohort = (page: string) => {
    if (!listedCohort) return;
    selection.selectCohort(listedCohort.id);
    navigate(page);
  };

  let roster;
  if (cohortId === null) {
    roster = null;
  } else if (detail.error) {
    const failure = rosterFailureText(detail.errorStatus, detail.error);
    roster = <ErrorState title={failure.title} message={failure.message} onRetry={failure.canRetry ? detail.reload : undefined} />;
  } else if (!data) {
    roster = <LoadingState label="Loading the roster…" />;
  } else {
    roster = (
      // The selected cohort and its roster are one region, the same white panel as the cohort cards on the left.
      <section aria-labelledby="cohort-detail-title">
        <DataTable
          title={data.name}
          titleId="cohort-detail-title"
          titleNote={
            <>
              <p className="flex items-center gap-3 flex-wrap tabular-nums">
                <span>
                  {/* Cohort names often carry the school year already; say it once. */}
                  {data.name.includes(data.school_year) ? "" : `SY ${data.school_year} · `}
                  {rosterCountsText(rosterCounts(data.roster))}
                </span>
                <CohortStatus status={data.status} />
              </p>
              {cohortsReady && !listedCohort && (
                <p>This cohort is in school year {data.school_year}, not the school year selected in the top bar.</p>
              )}
            </>
          }
          titleAction={
            listedCohort && (
              <>
                <Button size="sm" onClick={() => openWithCohort(DASHBOARD_PAGE)}>
                  <LayoutDashboard className="w-4 h-4" aria-hidden="true" /> Open dashboard
                </Button>
                <Button size="sm" onClick={() => openWithCohort(LEARNERS_PAGE)}>
                  <Users className="w-4 h-4" aria-hidden="true" /> View learners
                </Button>
              </>
            )
          }
          columns={ROSTER_COLUMNS}
          rows={data.roster}
          rowKey={(row) => row.learner_id}
          onRowClick={(row) => navigate(learnerDetailPage(row.learner_id, data.id))}
          emptyMessage="No learners have been assigned to this cohort yet."
        />
      </section>
    );
  }

  let body;
  if (selection.error) {
    body = <ErrorState title="Your cohorts could not be loaded" message={selection.error} onRetry={selection.reload} />;
  } else if (!cohortsReady) {
    body = <LoadingState label="Loading your cohorts…" />;
  } else {
    const noCohorts = (
      <Card padding="none">
        <EmptyState
          icon={Users}
          title="No cohorts in this school year"
          description={`You are not assigned to any cohort in this school year. ${COHORTS_ASSIGNED_TEXT}`}
        />
      </Card>
    );
    // With no list and no cohort in the URL there is nothing to put beside the empty state.
    body =
      cohorts.length === 0 && cohortId === null ? (
        noCohorts
      ) : (
        <div className="grid grid-cols-3 gap-4 items-start">
          <div className="space-y-3">
            {cohorts.length === 0
              ? noCohorts
              : cohorts.map((cohort) => (
                  <CohortCard key={cohort.id} cohort={cohort} selected={cohort.id === cohortId} onSelect={() => selectCohort(cohort.id)} />
                ))}
          </div>
          <div className="col-span-2 min-w-0">{roster}</div>
        </div>
      );
  }

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="facilitator-cohorts">
      <div className={PAGE_BODY}>
        <PageHeader
          title="My Cohorts"
          subtitle={cohortsReady ? cohortsSubtitle(cohorts.length, selection.schoolYear) : undefined}
          // Who assigns cohorts is worth knowing but asks nothing of you: the quiet note line, not a notice bar.
          note={COHORTS_ASSIGNED_TEXT}
        />
        {body}
      </div>
    </AppLayout>
  );
}
