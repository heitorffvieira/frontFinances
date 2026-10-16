import { useCallback, useEffect, useRef, useState } from 'react';
import { getClosedMonths } from '../services/months';
import type { ClosedMonth } from '../types';
import { getErrorMessage } from '../utils/errors';
import type { LoadStatus } from './useMonthData';

/** Histórico de meses fechados (`GET /months`), na ordem devolvida pelo backend. */
export function useClosedMonths() {
  const [months, setMonths] = useState<ClosedMonth[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  /** `silent` mantém os dados atuais na tela durante a atualização. */
  const reload = useCallback(async (silent = false) => {
    const id = ++requestId.current;
    if (!silent) setStatus('loading');
    try {
      const data = await getClosedMonths();
      if (id !== requestId.current) return;
      setMonths(data);
      setStatus('ready');
      setError(null);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(getErrorMessage(err));
      if (!silent) setStatus('error');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { months, status, error, reload };
}
