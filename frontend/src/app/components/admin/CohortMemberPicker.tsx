import { useState } from "react";
import { Search } from "lucide-react";
import { listUsers } from "../../../lib/api/admin";
import { assignFacilitator, assignLearner } from "../../../lib/api/adminCohorts";
import { getErrorCode, getErrorMessage, getErrorStatus } from "../../../lib/api/errors";
import type { AdminUserListItem, CohortMemberStatus } from "../../../lib/api/types";
import {
  AdminCohortErrorCode,
  adminCohortErrorMessage,
  pickerQuery,
  pickerRowState,
  roleIdOf,
  type MemberRole,
} from "../../../lib/adminCohortsText";
import { useDebouncedValue } from "../../../lib/hooks/useDebouncedValue";
import { useFetch } from "../../../lib/hooks/useFetch";
import { orDash, personName } from "../../../lib/labels";
import { toast } from "../../../lib/toast";
import { EmptyState, ErrorState, LoadingState, Modal, Pagination, Pill } from "../facilitator/shared";
import { ADMIN_CANCEL_BUTTON, ADMIN_FIELD, ADMIN_SMALL_BUTTON } from "./adminStyles";

const ROLE_TEXT: Record<MemberRole, { title: string; noun: string; plural: string }> = {
  facilitator: { title: "Assign facilitator", noun: "facilitator", plural: "facilitators" },
  learner: { title: "Assign learner", noun: "learner", plural: "learners" },
};

interface CohortMemberPickerProps {
  /** Which kind of person is being assigned. */
  role: MemberRole;
  cohort: { id: number; name: string };
  /**
   * Who is already in the cohort for this role, from the roster: keyed by the
   * row's `facilitator_id` or `learner_id`, with the assignment's status.
   */
  members: ReadonlyMap<number, CohortMemberStatus>;
  /** `changed` is true when the cohort behind is out of date: someone was assigned, or a refusal showed it is stale. */
  onClose: (changed: boolean) => void;
}

/**
 * Finds a facilitator or a learner by name or ID number and assigns them to
 * the cohort, one at a time, without closing between them. The search and the
 * paging are the admin users list's own; the same component serves both roles.
 */
export function CohortMemberPicker({ role, cohort, members, onClose }: CohortMemberPickerProps) {
  const text = ROLE_TEXT[role];
  const [searchText, setSearchText] = useState("");
  const search = useDebouncedValue(searchText, 300);

  // The page is remembered with the search it belongs to, so a new search starts on page 1.
  const [paging, setPaging] = useState({ search, page: 1 });
  const page = paging.search === search ? paging.page : 1;

  // Keyed on the search and the page: a slow response for earlier ones is dropped by the hook.
  const list = useFetch(() => listUsers(pickerQuery(role, search, page)), [role, search, page], {
    fallbackError: `Unable to load the ${text.plural}.`,
  });
  const data = list.data;

  // The roster's view of who is in the cohort, plus what this picker has learned since it opened.
  const [here, setHere] = useState<ReadonlyMap<number, CohortMemberStatus>>(members);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [changed, setChanged] = useState(false);
  const assigning = assigningId !== null;

  const markHere = (roleId: number) => setHere((current) => new Map(current).set(roleId, "active"));

  const assign = async (user: AdminUserListItem) => {
    // The assign routes take the learners-table or facilitators-table id, never the user id.
    const roleId = roleIdOf(user, role);
    if (roleId === null) return;
    setAssigningId(roleId);
    try {
      if (role === "facilitator") await assignFacilitator(cohort.id, roleId);
      else await assignLearner(cohort.id, roleId);
      toast.success(`${personName(user, `This ${text.noun}`)} assigned to ${cohort.name}.`);
      setChanged(true);
      markHere(roleId);
    } catch (requestError) {
      const code = getErrorCode(requestError);
      const status = getErrorStatus(requestError);
      toast.error(adminCohortErrorMessage(code, status, getErrorMessage(requestError, `The ${text.noun} could not be assigned.`)));
      if (code === AdminCohortErrorCode.COHORT_NOT_FOUND || code === AdminCohortErrorCode.INVALID_COHORT_STATUS) {
        // Nothing here can succeed any more.
        onClose(true);
        return;
      }
      if (code === AdminCohortErrorCode.COHORT_LEARNER_ALREADY_EXISTS || code === AdminCohortErrorCode.COHORT_FACILITATOR_ALREADY_EXISTS) {
        // The roster this picker opened with was stale.
        setChanged(true);
        markHere(roleId);
      }
    }
    setAssigningId(null);
  };

  return (
    <Modal
      title={text.title}
      subtitle={<>Assigning to: <span className="font-medium text-gray-700">{cohort.name}</span></>}
      onClose={() => onClose(changed)}
      busy={assigning}
      size="lg"
      footer={
        <button type="button" onClick={() => onClose(changed)} disabled={assigning} className={ADMIN_CANCEL_BUTTON}>
          Done
        </button>
      }
    >
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search by name or ID number"
            aria-label="Search by name or ID number"
            className={`${ADMIN_FIELD} pl-9`}
          />
        </div>

        {list.error ? (
          <ErrorState title={`The ${text.plural} could not be loaded`} message={list.error} onRetry={list.reload} />
        ) : !data ? (
          <LoadingState label={`Loading ${text.plural}…`} />
        ) : data.items.length === 0 ? (
          <EmptyState
            title={search.trim() === "" ? `There are no ${text.noun} accounts yet` : `No ${text.plural} match this search`}
            description={search.trim() === "" ? "Accounts are created in User Accounts." : undefined}
          />
        ) : (
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <ul className="divide-y divide-gray-50">
              {data.items.map((user) => {
                const state = pickerRowState(user, role, here);
                const roleId = roleIdOf(user, role);
                return (
                  <li key={user.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-800 text-sm font-medium truncate">{personName(user, "Unnamed account")}</span>
                        <Pill tone={user.is_active ? "success" : "muted"}>{user.is_active ? "Active account" : state.note ?? "Inactive"}</Pill>
                      </div>
                      <div className="text-gray-400 text-xs font-mono">{orDash(user.id_no)}</div>
                    </div>
                    {state.assignable ? (
                      <button type="button" onClick={() => void assign(user)} disabled={assigning} className={`${ADMIN_SMALL_BUTTON} flex-shrink-0`}>
                        {assigningId !== null && assigningId === roleId ? "Assigning…" : "Assign"}
                      </button>
                    ) : (
                      <span className="text-gray-500 text-xs text-right max-w-[14rem] flex-shrink-0">{state.reason}</span>
                    )}
                  </li>
                );
              })}
            </ul>
            <Pagination
              page={data.page}
              pageSize={data.page_size}
              total={data.total}
              onPageChange={(next) => setPaging({ search, page: next })}
              noun={text.noun}
              nounPlural={text.plural}
              disabled={assigning || list.loading}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
