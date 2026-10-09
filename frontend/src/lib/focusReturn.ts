// Where focus goes when a dialog closes. Pure functions, so they can be checked without a browser.

/** The part of an element these functions need. */
export interface FocusableLike {
  isConnected: boolean;
}

/**
 * The control that opened a dialog: what had focus when it opened, or, when
 * nothing did (the page body), the control last pressed. Some browsers do not
 * focus a button when it is clicked.
 */
export function dialogOpener<T extends FocusableLike>(active: T | null, body: unknown, lastPressed: T | null): T | null {
  if (active !== null && active !== body) return active;
  return lastPressed;
}

/** Focus can only go back to a control that is still on the page. */
export function canReturnFocus(opener: FocusableLike | null): boolean {
  return opener !== null && opener.isConnected;
}
