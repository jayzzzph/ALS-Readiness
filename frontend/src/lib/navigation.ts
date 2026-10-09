import { useNavigate } from "react-router";
import type { Role } from "./api/types";

// A navigate() ref that code outside the React tree (axios interceptors) can
// call. Wired up once from inside the router via NavigationBridge.
type NavigateFn = (path: string) => void;

let navigateRef: NavigateFn | null = null;

export function setNavigateRef(fn: NavigateFn) {
  navigateRef = fn;
}

export function redirect(path: string) {
  if (navigateRef) {
    navigateRef(path);
  } else {
    // Fallback if called before the router mounts (shouldn't normally happen).
    window.location.assign(path);
  }
}

/**
 * Every existing page/AppLayout calls `navigate("some-page-key")` (no leading
 * slash - a holdover from the old currentPage-string router). Routes are
 * defined at the matching path (`/some-page-key`), so this is a pure
 * translation layer - it lets every page keep calling navigate() exactly as
 * before while it's actually real router navigation underneath.
 *
 * A page key may carry a URL parameter after a slash - "facilitator-learners/12"
 * becomes "/facilitator-learners/12", which matches the route
 * "/facilitator-learners/:learnerId". Build those keys with the helpers below
 * rather than by hand.
 */
export function toPath(page: string): string {
  return page === "landing" ? "/" : `/${page}`;
}

/** Hook version of `toPath`-wrapped navigate, for use inside components. */
export function useLegacyNavigate() {
  const navigate = useNavigate();
  return (page: string) => navigate(toPath(page));
}

/** The query parameter that carries the cohort on the learner detail page. */
export const LEARNER_COHORT_PARAM = "cohort";

/**
 * Page key for one learner's detail page, for navigate(). With a cohort the
 * key carries it as a query parameter ("facilitator-learners/12?cohort=5"), so
 * a reload or a shared link shows the same membership; without one the backend
 * chooses which of the learner's cohorts to show.
 */
export function learnerDetailPage(learnerId: number, cohortId?: number | null): string {
  const key = `facilitator-learners/${learnerId}`;
  return cohortId === undefined || cohortId === null ? key : `${key}?${LEARNER_COHORT_PARAM}=${cohortId}`;
}

/** Page key for one strand test's detail page, for navigate(). */
export function strandTestDetailPage(testId: number): string {
  return `facilitator-tests/${testId}`;
}

/** The forced-password-change page. Deliberately outside ProtectedPage - see App.tsx. */
export const CHANGE_PASSWORD_PATH = "/change-password";

/** Where the "Page not found" page sends someone: their role's dashboard, or the sign-in page when signed out. */
export function homeLink(role: Role | null): { page: string; label: string } {
  if (role === null) return { page: "login", label: "Go to sign in" };
  const name = role === "admin" ? "Admin" : role === "facilitator" ? "Facilitator" : "Learner";
  return { page: homeForRole(role), label: `Back to ${name} Dashboard` };
}

/** The page key for a role's home dashboard, post-login. */
export function homeForRole(role: Role): string {
  return role === "facilitator" ? "facilitator-dashboard"
       : role === "admin"       ? "admin-dashboard"
       : "learner-dashboard";
}
