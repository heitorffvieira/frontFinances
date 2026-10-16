import { useCallback, useEffect, useRef, useState } from 'react';
import { getExpensesByMonth, getMonthSummary } from '../services/expenses';
import type { Expense, ExpenseSummary, Period } from '../types';
import { getErrorMessage } from '../utils/errors';

export type LoadStatus = 'loading' | 'ready' | 'error';

interface State {
  status: LoadStatus;
  expenses: Expense[];
  summary: ExpenseSummary | null;
  error: string | null;
}

/**
 * Carrega despesas e resumo de um mês, sempre pelos endpoints
 * `/expenses/month` e `/expenses/month/summary`.
 *
 * - `reload()` atualiza em segundo plano mantendo os dados atuais na tela;
 *   se a atualização falhar, `refreshError` é preenchido.
 */
export function useMonthData({ month, year }: Period) {
  const [state, setState] = useState<State>({
    status: 'loading',
    expenses: [],
    summary: null,
    error: null,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchData = useCallback(async () => {
    const period = { month, year };
    return Promise.all([getExpensesByMonth(period), getMonthSummary(period)]);
  }, [month, year]);

  useEffect(() => {
    const id = ++requestId.current;
    setState({ status: 'loading', expenses: [], summary: null, error: null });
    setRefreshError(null);

    fetchData().then(
      ([expenses, summary]) => {
        if (id !== requestId.current) return;
        setState({ status: 'ready', expenses, summary, error: null });
      },
      (err: unknown) => {
        if (id !== requestId.current) return;
        setState({ status: 'error', expenses: [], summary: null, error: getErrorMessage(err) });
      },
    );
  }, [fetchData]);

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    setRefreshing(true);
    try {
      const [expenses, summary] = await fetchData();
      if (id !== requestId.current) return;
      setState({ status: 'ready', expenses, summary, error: null });
      setRefreshError(null);
    } catch (err) {
      if (id !== requestId.current) return;
      setRefreshError(getErrorMessage(err));
    } finally {
      if (id === requestId.current) setRefreshing(false);
    }
  }, [fetchData]);

  /** Recarrega do zero (tela de carregamento), usado no "Tentar novamente". */
  const retry = useCallback(() => {
    const id = ++requestId.current;
    setState({ status: 'loading', expenses: [], summary: null, error: null });
    setRefreshError(null);
    fetchData().then(
      ([expenses, summary]) => {
        if (id !== requestId.current) return;
        setState({ status: 'ready', expenses, summary, error: null });
      },
      (err: unknown) => {
        if (id !== requestId.current) return;
        setState({ status: 'error', expenses: [], summary: null, error: getErrorMessage(err) });
      },
    );
  }, [fetchData]);

  return { ...state, refreshing, refreshError, reload, retry };
}
