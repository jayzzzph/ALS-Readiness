import { Pill } from "./Pill";

/** Shown wherever a readiness value would go while there is none (FD8). */
export const NOT_YET_PROFILED = "Not yet profiled";

interface ReadinessPillProps {
  /**
   * A learner's readiness as the API sends it. The API types this as null
   * today: nothing is profiled until EEG profiling exists. When it starts
   * returning a level, widen this type and add the level's pill below - every
   * caller already passes the API value through.
   */
  readiness: null;
}

/** A learner's readiness level. Today that is always the neutral "Not yet profiled" pill. */
export function ReadinessPill({ readiness }: ReadinessPillProps) {
  if (readiness === null) return <Pill tone="muted">{NOT_YET_PROFILED}</Pill>;
  return null;
}
