import { useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarClock, ChevronRight, Lock } from 'lucide-react';
import { ClosedMonthDetail } from '../components/ClosedMonthDetail';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useClosedMonths } from '../hooks/useClosedMonths';
import { useMonthTotals } from '../hooks/useMonthTotals';
import { useToast } from '../hooks/useToast';
import type { ClosedMonth } from '../types';
import { formatCurrency, formatDate, formatPeriod } from '../utils/format';
import { parsePeriodParam, periodToParam, samePeriod } from '../utils/period';

export default function HistoryPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const closed = useClosedMonths();
  const { totals, loading: totalsLoading } = useMonthTotals(closed.months);

  const months = closed.months;
  const requested = parsePeriodParam(params.get('mes'));
  const selected: ClosedMonth | undefined =
    (requested && months.find((m) => samePeriod(m, requested))) || months[0];
  const lastClosedId = months[0]?.id;

  function select(month: ClosedMonth) {
    setParams({ mes: periodToParam(month) }, { replace: true });
  }

  async function handleReopened(month: ClosedMonth) {
    const target = periodToParam(month);
    setParams({}, { replace: true });
    await closed.reload(true);
    toast.success(`${formatPeriod(month)} foi reaberto e pode receber alterações.`, {
      label: 'Ver despesas',
      onClick: () => navigate(`/?mes=${target}`),
    });
  }

  return (
    <main className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Histórico</h1>
          <p className="page-sub">
            <span>Meses fechados, do mais recente ao mais antigo</span>
          </p>
        </div>
      </header>

      {closed.status === 'loading' && (
        <section className="panel">
          <LoadingState label="Carregando histórico…" />
        </section>
      )}

      {closed.status === 'error' && (
        <section className="panel">
          <ErrorState
            message={closed.error ?? 'Erro ao carregar o histórico.'}
            onRetry={() => void closed.reload()}
          />
        </section>
      )}

      {closed.status === 'ready' && months.length === 0 && (
        <section className="panel">
          <EmptyState
            icon={CalendarClock}
            title="Nenhum mês fechado ainda"
            description="O histórico ficará disponível depois do primeiro fechamento mensal. Feche um mês na visão geral para vê-lo aqui."
          />
        </section>
      )}

      {closed.status === 'ready' && months.length > 0 && selected && (
        <div className="history">
          <nav className="history__list" aria-label="Meses fechados">
            <ul>
              {months.map((month) => {
                const isSelected = month.id === selected.id;
                const total = totals[month.id];
                return (
                  <li key={month.id}>
                    <button
                      type="button"
                      className="month-item"
                      aria-current={isSelected ? 'true' : undefined}
                      onClick={() => select(month)}
                    >
                      <span className="month-item__main">
                        <span className="month-item__title">{formatPeriod(month)}</span>
                        <span className="month-item__meta">
                          <Lock size={12} aria-hidden="true" />
                          Fechado em {formatDate(month.closedAt)}
                        </span>
                        {month.id === lastClosedId && (
                          <span className="month-item__tag">Último fechado</span>
                        )}
                      </span>
                      <span className="month-item__total num">
                        {total === undefined ? (
                          totalsLoading ? (
                            <span className="skeleton" />
                          ) : (
                            '—'
                          )
                        ) : total === null ? (
                          <span title="Não foi possível obter o total deste mês">—</span>
                        ) : (
                          formatCurrency(total)
                        )}
                      </span>
                      <ChevronRight size={16} aria-hidden="true" className="month-item__chevron" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <ClosedMonthDetail
            key={selected.id}
            month={selected}
            canReopen={selected.id === lastClosedId}
            onReopened={(month) => void handleReopened(month)}
            onReopenRejected={() => void closed.reload(true)}
          />
        </div>
      )}
    </main>
  );
}
