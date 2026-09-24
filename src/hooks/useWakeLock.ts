import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseWakeLockReturn {
  isSupported: boolean;
  isActive: boolean;
  requestLock: () => Promise<void>;
  releaseLock: () => Promise<void>;
}

export function useWakeLock(): UseWakeLockReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const sentinelRef = useRef<any>(null);

  useEffect(() => {
    setIsSupported('wakeLock' in navigator);
  }, []);

  const requestLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return;
    if (sentinelRef.current) return; // Já temos a trava

    try {
      const lock = await (navigator as any).wakeLock.request('screen');
      sentinelRef.current = lock;
      setIsActive(true);

      lock.addEventListener('release', () => {
        setIsActive(false);
        sentinelRef.current = null;
      });
    } catch (err) {
      console.warn('[WakeLock] Erro ao solicitar trava de tela:', err);
      setIsActive(false);
    }
  }, []);

  const releaseLock = useCallback(async () => {
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
        sentinelRef.current = null;
        setIsActive(false);
      } catch (err) {
        console.warn('[WakeLock] Erro ao liberar trava:', err);
      }
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isActive && !sentinelRef.current) {
        await requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, requestLock]);

  return { isSupported, isActive, requestLock, releaseLock };
}
