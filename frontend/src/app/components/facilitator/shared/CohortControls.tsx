import { useEffect, type ReactNode } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";
import { useAuthStore } from "../../../../lib/store/authStore";
import { cohortUserKey, useCohortSelection, useCohortStore } from "../../../../lib/store/cohortStore";
import { cohortStatusLabel } from "../../../../lib/labels";
import type { FacilitatorCohortItem } from "../../../../lib/api/types";
import { EASE_OUT, FOCUS_RING } from "./tokens";

interface CohortControlsProps {
  /** Whether the current page can show "All cohorts". Default: false. */
  allowAll?: boolean;
  /**
   * Shows nothing, for a page that takes its cohort from its URL (Learner
   * Detail) or has none (a strand test). The cohort store is still loaded.
   */
  hidden?: boolean;
}

/** "Cohort A", with the status spelled out for anything that isn't active (FD12: those are read-only). */
function cohortOptionLabel(cohort: FacilitatorCohortItem): string {
  return cohort.status === "active" ? cohort.name : `${cohort.name} (${cohortStatusLabel(cohort.status)})`;
}

const ALL_COHORTS = "all";

/** A native select dressed like the top bar's profile button. */
function TopBarSelect({
  label,
  value,
  onChange,
  disabled,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="relative flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        title={label}
        className={`appearance-none max-w-48 truncate min-h-10 pl-3 pr-9 py-2 bg-[#F2F1ED] hover:bg-[#E2E0DA] rounded-xl text-[#1B1D26] text-[0.9375rem] font-bold transition-colors duration-150 ${EASE_OUT} cursor-pointer ${FOCUS_RING} disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 w-4 h-4 text-[#4A4F5C]" aria-hidden="true" />
    </label>
  );
}

/**
 * The school year and cohort dropdowns in the shell's top bar (FD2). Rendered
 * for facilitators only. It also starts loading the cohort store for the
 * signed-in facilitator - on login and on every app load, since the shell is
 * the one thing every facilitator page mounts.
 */
export function CohortControls({ allowAll = false, hidden = false }: CohortControlsProps) {
  const user = useAuthStore((state) => state.user);
  const userKey = cohortUserKey(user);
  const init = useCohortStore((state) => state.init);
  const selection = useCohortSelection({ allowAll });

  useEffect(() => {
    // Does nothing when this user's cohorts are already loaded, so moving
    // between pages doesn't refetch.
    if (userKey) void init(userKey);
  }, [userKey, init]);

  if (!userKey || hidden) return null;

  if (selection.error) {
    return (
      <div className="flex items-center gap-2 mr-1.5 text-[0.9375rem] text-[#7A1A12]" role="alert">
        <span className="max-w-56 truncate" title={selection.error}>{selection.error}</span>
        <button
          type="button"
          onClick={selection.reload}
          className={`flex items-center gap-2 min-h-10 px-3 py-2 bg-[#F2F1ED] hover:bg-[#E2E0DA] text-[#1B1D26] rounded-xl font-bold transition-colors duration-150 ${EASE_OUT} ${FOCUS_RING}`}
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" /> Retry
        </button>
      </div>
    );
  }

  if (!selection.ready) {
    return <span className="mr-1.5 px-3 py-1.5 text-[#4A4F5C] text-[0.9375rem]" role="status">Loading cohorts…</span>;
  }

  // Not assigned to any cohort in any year: a plain statement, not an error.
  if (selection.schoolYears.length === 0) {
    return (
      <span className="mr-1.5 px-3 py-2 bg-[#F2F1ED] rounded-xl text-[#4A4F5C] text-[0.9375rem]" title="An administrator assigns facilitators to cohorts.">
        No cohorts assigned
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5 mr-1.5">
      <TopBarSelect
        label="School year"
        value={selection.schoolYear ?? ""}
        onChange={(schoolYear) => void selection.selectSchoolYear(schoolYear)}
        disabled={selection.loading}
      >
        {selection.schoolYears.map((schoolYear) => (
          <option key={schoolYear} value={schoolYear}>SY {schoolYear}</option>
        ))}
      </TopBarSelect>

      <TopBarSelect
        label="Cohort"
        value={selection.cohortId === null ? (selection.isAllCohorts ? ALL_COHORTS : "") : String(selection.cohortId)}
        onChange={(value) => selection.selectCohort(value === ALL_COHORTS ? null : Number(value))}
        disabled={selection.loading || selection.cohorts.length === 0}
      >
        {selection.loading && <option value="">Loading…</option>}
        {!selection.loading && selection.cohorts.length === 0 && <option value="">No cohorts</option>}
        {allowAll && selection.cohorts.length > 0 && <option value={ALL_COHORTS}>All cohorts</option>}
        {selection.cohorts.map((cohort) => (
          <option key={cohort.id} value={cohort.id}>{cohortOptionLabel(cohort)}</option>
        ))}
      </TopBarSelect>
    </div>
  );
}
