import { useEffect, useState } from 'react';
import { getMonthSummary } from '../services/expenses';
import type { ClosedMonth } from '../types';

/**
 * O total mensal não faz parte de `ClosedMonth`; é obtido do resumo de cada mês.
 * Valor `null` = não foi possível obter (nada é inventado).
 */
export function useMonthTotals(months: ClosedMonth[]) {
  const [totals, setTotals] = useState<Record<number, number | null>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (months.length === 0) {
      setTotals({});
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.allSettled(months.map((m) => getMonthSummary({ month: m.month, year: m.year }))).then(
      (results) => {
        if (cancelled) return;
        const next: Record<number, number | null> = {};
        results.forEach((result, index) => {
          next[months[index].id] = result.status === 'fulfilled' ? result.value.total : null;
        });
        setTotals(next);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [months]);

  return { totals, loading };
}
