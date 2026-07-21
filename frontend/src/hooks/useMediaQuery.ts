import { useState, useEffect, useMemo } from 'react';

/**
 * Hook: useMediaQuery
 * Returns true if the given media query matches the current viewport.
 * Automatically updates on resize and orientation change.
 *
 * @param query - A valid CSS media query string, e.g. '(max-width: 768px)'
 * @returns boolean indicating whether the media query currently matches.
 *
 * @example
 * const isSmallScreen = useMediaQuery('(max-width: 768px)');
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 * const isPortrait = useMediaQuery('(orientation: portrait)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQueryList = window.matchMedia(query);

    // Set initial match
    setMatches(mediaQueryList.matches);

    // Define listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    mediaQueryList.addEventListener('change', listener);

    // Cleanup
    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
}

// ------------------------------------------------------------------
// Predefined Breakpoint Hooks
// ------------------------------------------------------------------

// Standard breakpoints aligned with Tailwind CSS defaults
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Hook: useIsMobile
 * Returns true on screens smaller than 768px (md breakpoint).
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);
}

/**
 * Hook: useIsTablet
 * Returns true on screens between 768px and 1023px.
 */
export function useIsTablet(): boolean {
  return useMediaQuery(
    `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  );
}

/**
 * Hook: useIsDesktop
 * Returns true on screens 1024px (lg breakpoint) and above.
 */
export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
}

/**
 * Hook: useBreakpoint
 * Returns the current breakpoint name.
 */
export function useBreakpoint(): 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
  const is2xl = useMediaQuery(`(min-width: ${BREAKPOINTS['2xl']}px)`);
  const isXl = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`);
  const isLg = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
  const isMd = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`);
  const isSm = useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px)`);

  if (is2xl) return '2xl';
  if (isXl) return 'xl';
  if (isLg) return 'lg';
  if (isMd) return 'md';
  if (isSm) return 'sm';
  return 'sm';
}

export default useMediaQuery;
