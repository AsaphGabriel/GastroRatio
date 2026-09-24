import { useState, useEffect, useCallback } from 'react';

export interface UseWakeLockReturn {
  isSupported: boolean;
  isActive: boolean;
  requestLock: () => Promise<void>;
  releaseLock: () => Promise<void>;
}

/**
 * Hook ergonômico para Screen Wake Lock API (RNF-06 / ADR-07).
 * Impede que a tela do celular apague durante o preparo ativo de receitas.
 */
export function useWakeLock(): UseWakeLockReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [sentinel, setSentinel] = useState<any>(null);

  useEffect(() => {
    setIsSupported('wakeLock' in navigator);
  }, []);

  const requestLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return;

    try {
      const lock = await (navigator as any).wakeLock.request('screen');
      setSentinel(lock);
      setIsActive(true);

      lock.addEventListener('release', () => {
        setIsActive(false);
        setSentinel(null);
      });
    } catch (err) {
      console.warn('[WakeLock] Erro ao solicitar trava de tela:', err);
      setIsActive(false);
    }
  }, []);

  const releaseLock = useCallback(async () => {
    if (sentinel) {
      try {
        await sentinel.release();
        setSentinel(null);
        setIsActive(false);
      } catch (err) {
        console.warn('[WakeLock] Erro ao liberar trava:', err);
      }
    }
  }, [sentinel]);

  // Re-adquire a trava quando o usuário volta para o app (visibilidade mudou)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isActive && !sentinel) {
        await requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, sentinel, requestLock]);

  return { isSupported, isActive, requestLock, releaseLock };
}
