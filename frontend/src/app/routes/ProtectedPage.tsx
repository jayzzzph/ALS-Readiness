import type { ComponentType } from "react";
import { useAuthStore, type StoreUser } from "../../lib/store/authStore";
import { useLegacyNavigate } from "../../lib/navigation";
import { RequireAuth, RequireRole } from "./guards";
import type { Role } from "../../lib/api/types";

/**
 * The props every routed page receives. `navigate` takes a page key, which may
 * carry a URL parameter ("facilitator-learners/12" - see lib/navigation.ts); a
 * page reads its own parameters with react-router's useParams().
 */
export interface PageProps {
  navigate: (page: string) => void;
  user: StoreUser | null;
  onLogout: () => void;
}

/**
 * Wraps a page component with the auth/role guards and supplies it the same
 * `{ navigate, user, onLogout }` prop shape every page already expects (the
 * old `lp` spread in App.tsx) - no page's internals change.
 */
export function ProtectedPage({
  allowed,
  Component,
}: {
  allowed: Role[];
  Component: ComponentType<PageProps>;
}) {
  const user = useAuthStore((s) => s.user);
  const navigate = useLegacyNavigate();

  const onLogout = () => {
    useAuthStore.getState().logout();
    navigate("login");
  };

  return (
    <RequireAuth>
      <RequireRole allowed={allowed}>
        <Component navigate={navigate} user={user} onLogout={onLogout} />
      </RequireRole>
    </RequireAuth>
  );
}
