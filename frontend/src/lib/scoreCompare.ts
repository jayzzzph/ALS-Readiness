// The learner's pre-test and post-test Mean Percentage Scores, side by side.
// An MPS is null when the test had no items, so nothing here assumes a number.
// Pure functions only.

/** An MPS as shown in the score tiles: "65%"; a dash when there is none. */
export function mpsText(mps: number | null): string {
  return mps === null ? "—" : `${mps}%`;
}

export interface MpsComparison {
  /** True when the post-test MPS is at or above the pre-test MPS. */
  improved: boolean;
  /** How many points apart the two are, to two decimals, never negative. */
  difference: number;
}

/** The post-test against the pre-test; null when either MPS is missing, since there is nothing to compare. */
export function compareMps(pre: number | null, post: number | null): MpsComparison | null {
  if (pre === null || post === null) return null;
  return { improved: post >= pre, difference: Math.abs(Math.round((post - pre) * 100) / 100) };
}
