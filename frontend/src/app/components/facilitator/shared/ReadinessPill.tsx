/** Shown wherever a readiness value would go while there is none (FD8). */
export const NOT_YET_PROFILED = "Not yet profiled";

interface ReadinessPillProps {
  /**
   * A learner's readiness as the API sends it. The API types this as null
   * today: nothing is profiled until EEG profiling exists. When it starts
   * returning a level, widen this type and render the level below - every
   * caller already passes the API value through. The pairs to use:
   * High #CFE4FF on #00538A, Moderate #FFDEB5 on #835500, Low #FFDAD7 on #BA1A1A.
   */
  readiness: null;
}

/**
 * A learner's readiness. Today that is always "Not yet profiled", shown as a
 * quiet line rather than a badge: an empty state is never the loudest thing
 * in its row. (The name is kept so callers do not change.)
 */
export function ReadinessPill({ readiness }: ReadinessPillProps) {
  if (readiness === null) return <span className="text-[0.9375rem] text-[#4A4F5C] whitespace-nowrap">{NOT_YET_PROFILED}</span>;
  return null;
}
