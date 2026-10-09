import { useCallback, useEffect, useState } from 'react';
import type { ShiftAssignmentDto } from '@healthcare/shared';
import { api } from '../api/client';

function isAuthOrSessionError(err: unknown): boolean {
  if (!err) return false;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  const status = (err as { status?: number })?.status;
  return (
    status === 401 ||
    status === 403 ||
    msg.includes('sign in') ||
    msg.includes('unauthorized') ||
    msg.includes('session') ||
    msg.includes('token')
  );
}

export function useShiftAssignment(userId: number | undefined) {
  const [assignment, setAssignment] = useState<ShiftAssignmentDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      setAssignment(await api.getMyShiftAssignment());
      setError(null);
    } catch (err) {
      if (!isAuthOrSessionError(err)) {
        setError(err instanceof Error ? err.message : 'Could not refresh your shift assignment.');
      } else {
        setError(null);
      }
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setAssignment(null);
      setError(null);
      return;
    }

    let mounted = true;
    let loading = false;
    const sync = async () => {
      if (!mounted || loading || document.visibilityState !== 'visible') return;
      loading = true;
      try {
        const current = await api.getMyShiftAssignment();
        if (mounted) {
          setAssignment(current);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          // If auth or session error (e.g., demo fallback or background cookie refresh),
          // suppress noisy banner so default clinical station roster renders cleanly
          if (!isAuthOrSessionError(err)) {
            setError(err instanceof Error ? err.message : 'Could not refresh your shift assignment.');
          } else {
            setError(null);
          }
        }
      } finally {
        loading = false;
      }
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void sync();
    };

    void sync();
    const interval = window.setInterval(() => void sync(), 15_000);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      mounted = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [userId]);

  return { assignment, error, refresh };
}
