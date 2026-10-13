import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce rapid value updates (such as search keystrokes).
 * Reduces unnecessary API requests by delaying invocation until typing pauses.
 *
 * @param {*} value
 * @param {number} delay - Milliseconds to delay (default 250ms)
 * @returns {*}
 */
export function useDebounce(value, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
