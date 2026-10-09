import { useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { CalendarDays, Plus, UserPlus } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";
import type { PageProps } from "../../routes/ProtectedPage";
import {
  createCohort,
  getCohortMembers,
  listCohorts,
  updateCohortStatus,
  updateFacilitatorAssignmentStatus,
  updateLearnerMembershipStatus,
} from "../../../lib/api/adminCohorts";
import { getErrorCode, getErrorMessage, getErrorStatus } from "../../../lib/api/errors";
import type {
  CohortFacilitatorMemberResponse,
  CohortLearnerMemberResponse,
  CohortMemberStatus,
  CohortResponse,
  CohortStatus,
  CohortWithMembersResponse,
} from "../../../lib/api/types";
import {
  COHORT_NAME_MAX_LENGTH,
  COHORT_STATUSES,
  SCHOOL_YEAR_FORMAT_TEXT,
  YEAR_END_HINT,
  adminCohortErrorMessage,
  assignmentRule,
  buildCohortsQuery,
  cohortCreatePayload,
  cohortDetailFailureText,
  cohortFormErrors,
  cohortsCountText,
  dateEndedText,
  distinctSchoolYears,
  endConfirmText,
  memberAction,
  memberActionStatus,
  memberCounts,
  memberCountsText,
  shouldReloadCohort,
  sortCohorts,
  statusMeaning,
  statusOptions,
  type MemberRole,
} from "../../../lib/adminCohortsText";
import { formatCalendarDate, formatDate } from "../../../lib/dates";
import { useFetch } from "../../../lib/hooks/useFetch";
import { DASH, cohortStatusLabel, memberStatusLabel, orDash, personName } from "../../../lib/labels";
import { parseIdParam } from "../../../lib/learnersText";
import { toast } from "../../../lib/toast";
import {
  Card,
  ConfirmDialog,
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
  Notice,
  Pill,
  type DataTableColumn,
  type PillTone,
} from "../facilitator/shared";
import { CohortMemberPicker } from "./CohortMemberPicker";
import {
  ADMIN_CANCEL_BUTTON,
  ADMIN_FIELD,
  ADMIN_HEADER_BUTTON,
  ADMIN_LABEL,
  ADMIN_LINK_BUTTON,
  ADMIN_PRIMARY_BUTTON,
  ADMIN_SMALL_BUTTON,
  adminChipClass,
} from "./adminStyles";

/** The query parameter that keeps the selected cohort across a reload. */
const COHORT_PARAM = "cohort";

const STATUS_TONE: Record<CohortStatus, PillTone> = {
  active: "success",
  upcoming: "neutral",
  completed: "muted",
  archived: "muted",
};

// ── New Cohort dialog ────────────────────────────────────────────────────────

interface NewCohortDialogProps {
  onClose: () => void;
  onCreated: (cohort: CohortResponse) => void;
}

function NewCohortDialog({ onClose, onCreated }: NewCohortDialogProps) {
  const [name, setName] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // Problems are pointed out once the form has been submitted, not while it is first being filled in.
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const form = { name, schoolYear, startDate, endDate };
  const errors = cohortFormErrors(form);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    const payload = cohortCreatePayload(form);
    if (payload === null || saving) return;

    setSaving(true);
    try {
      const created = await createCohort(payload);
      toast.success(`${created.name} created.`);
      onCreated(created);
    } catch (requestError) {
      // The dialog stays open with what was typed.
      toast.error(
        adminCohortErrorMessage(getErrorCode(requestError), getErrorStatus(requestError), getErrorMessage(requestError, "The cohort could not be created.")),
      );
      setSaving(false);
    }
  };

  const problem = (message: string | null) =>
    submitted && message ? <p className="text-red-600 text-xs mt-1.5" role="alert">{message}</p> : null;

  return (
    <Modal title="New Cohort" onClose={onClose} busy={saving} initialFocusRef={nameRef}>
      <form onSubmit={(event) => void submit(event)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="cohort-name" className={ADMIN_LABEL}>Name</label>
          <input
            id="cohort-name"
            ref={nameRef}
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={COHORT_NAME_MAX_LENGTH}
            disabled={saving}
            className={ADMIN_FIELD}
          />
          {problem(errors.name)}
        </div>

        <div>
          <label htmlFor="cohort-school-year" className={ADMIN_LABEL}>School year</label>
          <input
            id="cohort-school-year"
            type="text"
            inputMode="numeric"
            value={schoolYear}
            onChange={(event) => setSchoolYear(event.target.value)}
            placeholder="2026-2027"
            maxLength={9}
            disabled={saving}
            className={ADMIN_FIELD}
          />
          {problem(errors.schoolYear) ?? <p className="text-gray-400 text-xs mt-1.5">{SCHOOL_YEAR_FORMAT_TEXT}</p>}
        </div>

        <div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="cohort-start" className={ADMIN_LABEL}>Start date</label>
              <input id="cohort-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} disabled={saving} className={ADMIN_FIELD} />
            </div>
            <div>
              <label htmlFor="cohort-end" className={ADMIN_LABEL}>End date</label>
              <input id="cohort-end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} disabled={saving} className={ADMIN_FIELD} />
            </div>
          </div>
          {problem(errors.dates) ?? <p className="text-gray-400 text-xs mt-1.5">Both dates are required, and the start must be before the end.</p>}
        </div>

        <p className="text-gray-400 text-xs">A new cohort starts as Upcoming. Its code is generated when it is created.</p>

        <div className="flex gap-3">
          <button type="button" onClick={onClose} disabled={saving} className={ADMIN_CANCEL_BUTTON}>Cancel</button>
          <button type="submit" disabled={saving} className={ADMIN_PRIMARY_BUTTON}>{saving ? "Creating…" : "Create Cohort"}</button>
        </div>
      </form>
    </Modal>
  );
}

// ── Members ──────────────────────────────────────────────────────────────────

type Member = CohortFacilitatorMemberResponse | CohortLearnerMemberResponse;

interface MembersSectionProps<T extends Member> {
  role: MemberRole;
  heading: string;
  members: T[];
  emptyMessage: string;
  canAssign: boolean;
  busy: boolean;
  onAssign: () => void;
  onEnd: (member: T) => void;
  onReactivate: (member: T) => void;
}

function MembersSection<T extends Member>({ role, heading, members, emptyMessage, canAssign, busy, onAssign, onEnd, onReactivate }: MembersSectionProps<T>) {
  // Of each member's profile, only the name is read. The ID number is on the row itself.
  const columns: DataTableColumn<T>[] = [
    { key: "name", header: "Name", render: (member) => <span className="text-gray-800 font-medium">{personName(member.profile, "Unnamed account")}</span> },
    { key: "id-no", header: "ID Number", className: "text-gray-500 text-xs font-mono", render: (member) => orDash(member.id_no) },
    {
      key: "status",
      header: role === "facilitator" ? "Assignment" : "Membership",
      render: (member) => <Pill tone={member.status === "active" ? "success" : "muted"}>{memberStatusLabel(member.status)}</Pill>,
    },
    { key: "assigned", header: "Date assigned", className: "text-gray-500 text-xs", render: (member) => formatDate(member.assigned_at) ?? DASH },
    { key: "ended", header: "Date ended", className: "text-gray-500 text-xs", render: (member) => dateEndedText(member.ended_at) },
    {
      key: "action",
      header: "Actions",
      render: (member) =>
        memberAction(member.status) === "end" ? (
          <button type="button" onClick={() => onEnd(member)} disabled={busy} className={ADMIN_LINK_BUTTON}>End</button>
        ) : (
          <button type="button" onClick={() => onReactivate(member)} disabled={busy} className={ADMIN_LINK_BUTTON}>Reactivate</button>
        ),
    },
  ];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h4 className="text-gray-800 font-semibold text-sm">{heading}</h4>
          <div className="text-gray-400 text-xs">{memberCountsText(memberCounts(members))}</div>
        </div>
        {canAssign && (
          <button type="button" onClick={onAssign} disabled={busy} className={ADMIN_SMALL_BUTTON}>
            <UserPlus className="w-3.5 h-3.5" aria-hidden="true" /> Assign {role}
          </button>
        )}
      </div>
      <DataTable columns={columns} rows={members} rowKey={(member) => member.id} emptyMessage={emptyMessage} accent="purple" />
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type DialogState =
  | { kind: "create" }
  | { kind: "status"; status: CohortStatus }
  | { kind: "end"; role: MemberRole; member: Member }
  | { kind: "pick"; role: MemberRole };

export function AdminCohorts({ navigate, user, onLogout }: PageProps) {
  const [yearFilter, setYearFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<CohortStatus | null>(null);
  const filtered = yearFilter !== null || statusFilter !== null;

  // The unfiltered list gives the school year chips and the total; the
  // filtered one is asked for with the API's own school_year and status
  // parameters. Each is keyed on its inputs, so a slow earlier response is dropped.
  const everyCohort = useFetch(() => listCohorts(), [], { fallbackError: "Unable to load the cohorts." });
  const filteredCohorts = useFetch(
    () => listCohorts(buildCohortsQuery({ schoolYear: yearFilter, status: statusFilter })),
    [yearFilter, statusFilter],
    { enabled: filtered, fallbackError: "Unable to load the cohorts." },
  );
  const list = filtered ? filteredCohorts : everyCohort;
  const cohorts = list.data ? sortCohorts(list.data.cohorts) : [];
  const schoolYears = everyCohort.data ? distinctSchoolYears(everyCohort.data.cohorts) : [];

  // The selected cohort lives in the URL, so a reload or a shared link keeps
  // it. Anything that is not a positive whole number is ignored.
  const [searchParams, setSearchParams] = useSearchParams();
  const cohortId = parseIdParam(searchParams.get(COHORT_PARAM));
  const selectCohort = (id: number) => setSearchParams({ [COHORT_PARAM]: String(id) });

  const detail = useFetch(() => getCohortMembers(cohortId as number), [cohortId], {
    enabled: cohortId !== null,
    fallbackError: "Unable to load this cohort.",
  });
  const data: CohortWithMembersResponse | null = detail.data;

  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [busy, setBusy] = useState(false);

  const reloadLists = () => {
    everyCohort.reload();
    if (filtered) filteredCohorts.reload();
  };

  /**
   * Every change to the selected cohort goes through here: a toast and a
   * reload on success; on failure the reason in a toast, and a reload when
   * the screen no longer matches the server. Resolves to whether it worked.
   */
  const run = async (request: () => Promise<unknown>, done: string, fallback: string): Promise<boolean> => {
    setBusy(true);
    try {
      await request();
      toast.success(done);
      detail.reload();
      return true;
    } catch (requestError) {
      const status = getErrorStatus(requestError);
      toast.error(adminCohortErrorMessage(getErrorCode(requestError), status, getErrorMessage(requestError, fallback)));
      if (shouldReloadCohort(status)) detail.reload();
      return false;
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (status: CohortStatus) => {
    if (!data) return;
    const ok = await run(() => updateCohortStatus(data.id, status), `${data.name} is now ${cohortStatusLabel(status)}.`, "The status could not be changed.");
    if (ok) {
      setDialog(null);
      reloadLists();
    }
  };

  const setMemberStatus = async (role: MemberRole, member: Member, status: CohortMemberStatus) => {
    const who = personName(member.profile, role === "facilitator" ? "The facilitator" : "The learner");
    const request = role === "facilitator" ? () => updateFacilitatorAssignmentStatus(member.id, status) : () => updateLearnerMembershipStatus(member.id, status);
    const what = role === "facilitator" ? "assignment" : "membership";
    const ok = await run(request, status === "ended" ? `${who}'s ${what} ended.` : `${who}'s ${what} reactivated.`, `The ${what} could not be changed.`);
    if (ok) setDialog(null);
  };

  const cohortColumns: DataTableColumn<CohortResponse>[] = [
    {
      key: "name",
      header: "Name",
      render: (cohort) => (
        <span className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cohort.id === cohortId ? "bg-purple-500" : "bg-transparent"}`} aria-hidden="true" />
          <span className="text-gray-800 font-medium">{cohort.name}</span>
          {cohort.id === cohortId && <span className="sr-only">(selected)</span>}
        </span>
      ),
    },
    { key: "code", header: "Code", className: "text-gray-500 text-xs font-mono", render: (cohort) => orDash(cohort.code) },
    { key: "school-year", header: "School Year", className: "text-gray-500", render: (cohort) => cohort.school_year },
    { key: "status", header: "Status", render: (cohort) => <Pill tone={STATUS_TONE[cohort.status] ?? "muted"}>{cohortStatusLabel(cohort.status)}</Pill> },
    { key: "start", header: "Start Date", className: "text-gray-500 text-xs", render: (cohort) => formatCalendarDate(cohort.start_date) ?? DASH },
    { key: "end", header: "End Date", className: "text-gray-500 text-xs", render: (cohort) => formatCalendarDate(cohort.end_date) ?? DASH },
  ];

  let listBody;
  if (list.error) {
    listBody = <ErrorState title="The cohorts could not be loaded" message={list.error} onRetry={list.reload} />;
  } else if (list.data && cohorts.length === 0 && !filtered) {
    listBody = (
      <Card padding="none">
        <EmptyState
          icon={CalendarDays}
          title="No cohorts yet"
          description="Create the first cohort, then assign its facilitators and learners."
          action={<button type="button" onClick={() => setDialog({ kind: "create" })} className={ADMIN_SMALL_BUTTON}><Plus className="w-3.5 h-3.5" /> New Cohort</button>}
        />
      </Card>
    );
  } else {
    listBody = (
      <DataTable
        accent="purple"
        columns={cohortColumns}
        rows={cohorts}
        rowKey={(cohort) => cohort.id}
        onRowClick={(cohort) => selectCohort(cohort.id)}
        loading={!list.data}
        loadingLabel="Loading cohorts…"
        emptyMessage="No cohorts match these filters."
      />
    );
  }

  let detailBody = null;
  if (cohortId !== null) {
    if (detail.error) {
      const failure = cohortDetailFailureText(detail.errorStatus, detail.error);
      detailBody = <ErrorState title={failure.title} message={failure.message} onRetry={failure.canRetry ? detail.reload : undefined} />;
    } else if (!data) {
      detailBody = <LoadingState label="Loading the cohort…" />;
    } else {
      const rule = assignmentRule(data.status);
      const start = formatCalendarDate(data.start_date);
      const end = formatCalendarDate(data.end_date);
      detailBody = (
        <Card className="space-y-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-gray-800 font-bold">{data.name}</h3>
                <Pill tone={STATUS_TONE[data.status] ?? "muted"}>{cohortStatusLabel(data.status)}</Pill>
              </div>
              <div className="text-gray-500 text-xs mt-1">
                <span className="font-mono">{orDash(data.code)}</span> · SY {data.school_year} · {start ?? DASH} to {end ?? DASH}
              </div>
            </div>
            <div className="flex-shrink-0">
              <label htmlFor="cohort-status" className="sr-only">Change status</label>
              <select
                id="cohort-status"
                value=""
                onChange={(event) => {
                  if (event.target.value) setDialog({ kind: "status", status: event.target.value as CohortStatus });
                }}
                disabled={busy}
                className={`${ADMIN_FIELD} w-auto`}
              >
                <option value="">Change status…</option>
                {statusOptions(data.status).map((status) => (
                  <option key={status} value={status}>{cohortStatusLabel(status)}</option>
                ))}
              </select>
            </div>
          </div>

          <Notice>{YEAR_END_HINT}</Notice>
          {rule.note && <Notice>{rule.note}</Notice>}

          <MembersSection
            role="facilitator"
            heading="Facilitators"
            members={data.facilitators}
            emptyMessage="No facilitators have been assigned to this cohort."
            canAssign={rule.canAssign}
            busy={busy}
            onAssign={() => setDialog({ kind: "pick", role: "facilitator" })}
            onEnd={(member) => setDialog({ kind: "end", role: "facilitator", member })}
            onReactivate={(member) => void setMemberStatus("facilitator", member, memberActionStatus("reactivate"))}
          />

          <MembersSection
            role="learner"
            heading="Learners"
            members={data.learners}
            emptyMessage="No learners have been assigned to this cohort."
            canAssign={rule.canAssign}
            busy={busy}
            onAssign={() => setDialog({ kind: "pick", role: "learner" })}
            onEnd={(member) => setDialog({ kind: "end", role: "learner", member })}
            onReactivate={(member) => void setMemberStatus("learner", member, memberActionStatus("reactivate"))}
          />
        </Card>
      );
    }
  }

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="admin-cohorts">
      {dialog?.kind === "create" && (
        <NewCohortDialog
          onClose={() => setDialog(null)}
          onCreated={(created) => {
            setDialog(null);
            // The filters are cleared so the new cohort is in the list it is selected from.
            setYearFilter(null);
            setStatusFilter(null);
            everyCohort.reload();
            selectCohort(created.id);
          }}
        />
      )}
      {dialog?.kind === "status" && data && (
        <ConfirmDialog
          title={`Mark this cohort ${cohortStatusLabel(dialog.status)}?`}
          subtitle={data.name}
          confirmLabel={`Mark ${cohortStatusLabel(dialog.status)}`}
          busy={busy}
          onConfirm={() => void changeStatus(dialog.status)}
          onClose={() => setDialog(null)}
        >
          <p>{statusMeaning(dialog.status)}</p>
        </ConfirmDialog>
      )}
      {dialog?.kind === "end" && data && (
        <ConfirmDialog
          title={dialog.role === "facilitator" ? "End this assignment?" : "End this membership?"}
          subtitle={`${personName(dialog.member.profile, "Unnamed account")} · ${data.name}`}
          confirmLabel="End"
          busyLabel="Ending…"
          busy={busy}
          onConfirm={() => void setMemberStatus(dialog.role, dialog.member, memberActionStatus("end"))}
          onClose={() => setDialog(null)}
        >
          <p>{endConfirmText(dialog.role)}</p>
        </ConfirmDialog>
      )}
      {dialog?.kind === "pick" && data && (
        <CohortMemberPicker
          role={dialog.role}
          cohort={data}
          members={
            new Map(
              dialog.role === "facilitator"
                ? data.facilitators.map((member) => [member.facilitator_id, member.status] as const)
                : data.learners.map((member) => [member.learner_id, member.status] as const),
            )
          }
          onClose={(changed) => {
            setDialog(null);
            if (changed) detail.reload();
          }}
        />
      )}

      <div className="p-5 space-y-5">
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1a3a5c] rounded-2xl p-5 text-white flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2"><span className="text-xs bg-white/15 px-2 py-0.5 rounded font-mono">ADMIN</span><span className="text-blue-300 text-xs">Cohort Management</span></div>
            <h2 className="mb-1" style={{ fontSize: "1.25rem", fontWeight: 700 }}>Cohorts</h2>
            <p className="text-blue-200/70 text-sm">
              {list.data ? cohortsCountText(cohorts.length, everyCohort.data ? everyCohort.data.cohorts.length : null, filtered) : "Loading…"}
            </p>
          </div>
          <button type="button" onClick={() => setDialog({ kind: "create" })} className={ADMIN_HEADER_BUTTON}>
            <Plus className="w-4 h-4" /> New Cohort
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-x-5 gap-y-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="School year">
            <span className="text-gray-500 text-xs">School year:</span>
            <button type="button" onClick={() => setYearFilter(null)} aria-pressed={yearFilter === null} className={adminChipClass(yearFilter === null)}>All</button>
            {schoolYears.map((year) => (
              <button key={year} type="button" onClick={() => setYearFilter(year)} aria-pressed={yearFilter === year} className={adminChipClass(yearFilter === year)}>{year}</button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Status">
            <span className="text-gray-500 text-xs">Status:</span>
            <button type="button" onClick={() => setStatusFilter(null)} aria-pressed={statusFilter === null} className={adminChipClass(statusFilter === null)}>All</button>
            {COHORT_STATUSES.map((status) => (
              <button key={status} type="button" onClick={() => setStatusFilter(status)} aria-pressed={statusFilter === status} className={adminChipClass(statusFilter === status)}>
                {cohortStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        {listBody}
        {detailBody}
      </div>
    </AppLayout>
  );
}
