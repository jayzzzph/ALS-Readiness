// Wording for form fields. Pure functions only.

/** True for nothing chosen, or text that is empty once trimmed. */
export function isMissing(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

/**
 * "Title is required" for a required field left empty, or null. `show` says
 * whether the form may point it out yet: once the field has been touched, or
 * once saving was attempted.
 */
export function requiredError(label: string, value: unknown, show: boolean): string | null {
  return show && isMissing(value) ? `${label} is required` : null;
}
