/**
 * Hook for monitoring network connectivity status
 */

import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOffline: boolean;
  isOnline: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOffline,
    isOnline: !isOffline
  };
}