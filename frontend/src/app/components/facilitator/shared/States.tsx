import type { ComponentType, ReactNode } from "react";
import { AlertCircle, Inbox, RefreshCw, Users } from "lucide-react";
import { DISPLAY_FONT, FOCUS_RING } from "./tokens";

interface LoadingStateProps {
  label?: string;
}

/** The centred spinner shown while a page or block loads. It stops spinning under reduced motion. */
export function LoadingState({ label = "Loading…" }: LoadingStateProps) {
  return (
    <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#4A4F5C] text-[0.9375rem]" role="status">
      <div className="w-8 h-8 border-2 border-[#00538A]/20 border-t-[#00538A] rounded-full motion-safe:animate-spin" aria-hidden="true" />
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

/** "Nothing here": a quiet icon, a plain-word title, and what to do about it. */
export function EmptyState({ title, description, icon: Icon = Inbox, action }: EmptyStateProps) {
  return (
    <div className="py-16 px-4 text-center">
      <Icon className="w-10 h-10 mx-auto mb-3 text-[#4A4F5C] opacity-60" aria-hidden="true" />
      <p className="text-[1.5rem] leading-[1.25] text-[#1B1D26]" style={DISPLAY_FONT}>{title}</p>
      {description && <p className="text-[0.9375rem] text-[#4A4F5C] mt-2 max-w-md mx-auto">{description}</p>}
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

/** A failed load: the error-tint region with an icon, role="alert", and an optional retry. */
export function ErrorState({ message, title = "Something went wrong", onRetry }: ErrorStateProps) {
  return (
    <div className="flex items-start gap-3 p-4 bg-[#FDECEA] border border-[#B42318] rounded-2xl text-[#7A1A12]" role="alert">
      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#B42318]" aria-hidden="true" />
      <div className="flex-1 min-w-0 text-[0.9375rem]">
        <div className="font-bold">{title}</div>
        <div>{message}</div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={`flex items-center gap-2 min-h-9 px-4 py-1.5 bg-white border border-[#B42318] hover:bg-[#FDECEA] rounded-lg text-[0.9375rem] font-bold text-[#7A1A12] transition-colors duration-150 flex-shrink-0 ${FOCUS_RING}`}
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" /> Try again
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
