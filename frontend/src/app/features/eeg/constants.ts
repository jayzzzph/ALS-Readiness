// Recording lengths for Readiness Profiling, in seconds. The one place to change them.
// Build or run with VITE_EEG_FAST=1 to shorten everything for testing (20 s baseline, exposure recorded from 0:10 to 0:20).

const FAST = import.meta.env.VITE_EEG_FAST === "1";

/**
 * A recording made with the demo signal is never saved to the server, with one exception for testing: a dev build run
 * with VITE_EEG_FAST=1. A production build can never save one (import.meta.env.DEV is false there).
 */
export const DEMO_UPLOAD_ALLOWED = import.meta.env.DEV && FAST;

/** Part IV: length of the resting baseline recording. */
export const BASELINE_SECONDS = FAST ? 20 : 600;

/** Part V: the video's own clock decides when recording starts and stops. */
export const EXPOSURE_RECORD_START = FAST ? 10 : 300;
export const EXPOSURE_RECORD_END = FAST ? 20 : 600;
export const EXPOSURE_RECORD_SECONDS = EXPOSURE_RECORD_END - EXPOSURE_RECORD_START;

/** "10 minutes", "1 minute", "20 seconds". */
export function describeDuration(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.round(seconds / 60);
    return `${m} ${m === 1 ? "minute" : "minutes"}`;
  }
  return `${seconds} seconds`;
}
