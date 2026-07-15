import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
export function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (window.location.hostname === 'localhost') {
      return;
    }

    window.gtag?.('config', 'G-P2QV3LZH5Y', {
      page_path: location.hash || location.pathname + location.search,
    });
  }, [location]);

  return null;
}