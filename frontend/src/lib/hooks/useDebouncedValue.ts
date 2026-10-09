import { useEffect, useState } from "react";

/**
 * The value, but only after it has stopped changing for `delayMs`. For a
 * search box: type freely, fetch once the typing pauses.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
