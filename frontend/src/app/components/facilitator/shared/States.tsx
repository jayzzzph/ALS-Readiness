import type { ComponentType, ReactNode } from "react";
import { AlertCircle, Inbox, RefreshCw, Users } from "lucide-react";

interface LoadingStateProps {
  label?: string;
}

/** The centred spinner shown while a page or block loads. */
export function LoadingState({ label = "Loading…" }: LoadingStateProps) {
  return (
    <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-400 text-sm" role="status">
      <div className="w-8 h-8 border-2 border-[#0B1F3A]/20 border-t-[#0B1F3A] rounded-full animate-spin" />
      <span>{label}</span>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  /** A lucide icon. Default: an inbox. */
  icon?: ComponentType<{ className?: string }>;
  /** e.g. a button that starts the thing that is missing. */
  action?: ReactNode;
}

/** "Nothing here" - the faded icon and grey line the existing pages show for an empty list. */
export function EmptyState({ title, description, icon: Icon = Inbox, action }: EmptyStateProps) {
  return (
    <div className="py-16 px-4 text-center text-gray-400">
      <Icon className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="text-gray-500">{title}</p>
      {description && <p className="text-sm mt-1 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  /** The message from getErrorMessage. */
  message: string;
  title?: string;
  /** Shows a "Try again" button when given. Leave out for errors a retry can't fix, such as a 403. */
  onRetry?: () => void;
}

/** A failed load, in the red used by the app's error banners, with an optional retry. */
export function ErrorState({ message, title = "Something went wrong", onRetry }: ErrorStateProps) {
  return (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700" role="alert">
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-sm">{message}</div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
        >
          <RefreshCw className="w-3 h-3" /> Try again
        </button>
      )}
    </div>
  );
}

/** For a facilitator who has not been assigned to any cohort. Not an error: nothing has gone wrong. */
export function NoCohortsState() {
  return (
    <EmptyState
      icon={Users}
      title="You have no cohorts yet"
      description="An administrator assigns facilitators to cohorts. Once you are assigned to one, it will appear here."
    />
  );
}
