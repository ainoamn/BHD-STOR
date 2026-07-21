import { useState, useEffect, useRef } from 'react';

/**
 * Hook: useDebounce
 * Debounces a value by the specified delay. Useful for search inputs
 * where you want to avoid firing requests on every keystroke.
 *
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * // debouncedSearch will only update 300ms after searchTerm stops changing
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup on unmount or when value/delay changes
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
