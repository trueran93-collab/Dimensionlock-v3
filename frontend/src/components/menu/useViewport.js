import { useEffect, useState } from 'react';

// Tracks viewport width with derived `isMobile` / `isCompact` flags used across
// the main-menu module to make layout decisions.
export function useViewport() {
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return { vw, isMobile: vw < 768, isCompact: vw < 1024 };
}
