import { useState, useEffect } from 'react';

/**
 * Hook to detect whether the viewport matches a mobile screen width (<= 768px).
 * Safely defaults to false during SSR or initial desktop render.
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = (e) => setIsMobile(e.matches);

    setIsMobile(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [breakpoint]);

  return isMobile;
}

