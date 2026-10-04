import { useCallback, useEffect, useState } from 'react';
import type { ShiftAssignmentDto } from '@healthcare/shared';
import { api } from '../api/client';

export function useShiftAssignment(userId: number | undefined) {
  const [assignment, setAssignment] = useState<ShiftAssignmentDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      setAssignment(await api.getMyShiftAssignment());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not refresh your shift assignment.');
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
          setError(err instanceof Error ? err.message : 'Could not refresh your shift assignment.');
        }
      } finally {
        loading = false;
      }
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void sync();
    };

    void sync();
    const interval = window.setInterval(() => void sync(), 10_000);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      mounted = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [userId]);

  return { assignment, error, refresh };
}
