// Simple autosave hook that debounces saves and exposes status
import { useEffect, useRef, useState } from 'react';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutosave<T>({
  data,
  canSave,
  delay = 1200,
  saveFn,
}: {
  data: T;
  canSave: boolean;
  delay?: number;
  saveFn: (payload: T) => Promise<void>;
}) {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const timer = useRef<number | null>(null);
  const lastSerialized = useRef<string>('');
  const isMounted = useRef<boolean>(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (!canSave) return;
    // Serialize and compare to avoid redundant saves
    const serialized = JSON.stringify(data);
    if (serialized === lastSerialized.current) return;
    lastSerialized.current = serialized;

    // Debounce save
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      if (!isMounted.current) return;
      setStatus('saving');
      setError(null);
      try {
        await saveFn(data);
        if (!isMounted.current) return;
        setStatus('saved');
        // Return to idle after a short delay
        window.setTimeout(() => {
          if (isMounted.current) setStatus('idle');
        }, 1500);
      } catch (e: any) {
        if (!isMounted.current) return;
        setStatus('error');
        setError(e?.message ?? 'Failed to save');
      }
    }, delay);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [data, canSave, delay, saveFn]);

  return { status, error };
}
