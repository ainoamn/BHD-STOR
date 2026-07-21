import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook: useLocalStorage
 * Syncs state with localStorage. Persists the value across page reloads.
 *
 * @param key - The localStorage key to store the value under.
 * @param initialValue - The initial value if nothing is stored yet.
 * @returns A tuple of [storedValue, setValue] similar to useState.
 *
 * @example
 * const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
 * const [token, setToken] = useLocalStorage<string>('auth_token', '');
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  // Lazy initializer to avoid parsing on every render
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        return JSON.parse(item) as T;
      }
      // If no stored value, save the initial value
      window.localStorage.setItem(key, JSON.stringify(initialValue));
      return initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Keep a ref to key for the effect
  const keyRef = useRef(key);
  keyRef.current = key;

  // Listen for storage events from other tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === keyRef.current && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue) as T);
        } catch {
          // If parsing fails, ignore the update
        }
      }
      if (event.key === keyRef.current && event.newValue === null) {
        setStoredValue(initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [initialValue]);

  // Setter that persists to localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }
          return valueToStore;
        });
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key],
  );

  return [storedValue, setValue];
}

export default useLocalStorage;
