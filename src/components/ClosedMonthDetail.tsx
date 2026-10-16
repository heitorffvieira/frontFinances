import { useState } from 'react';
import { CalendarCheck, Lock, RotateCcw } from 'lucide-react';
import { useMonthData } from '../hooks/useMonthData';
import { reopenMonth } from '../services/months';
import type { ClosedMonth } from '../types';
import { getErrorMessage } from '../utils/errors';
import { formatDate, formatPeriod } from '../utils/format';
import { ConfirmDialog } from './ConfirmDialog';
import { ExpenseList } from './ExpenseList';
import { ReportsPanel } from './ReportsPanel';
import { ErrorState, InlineAlert, LoadingState } from './States';
import { StatusBadge } from './StatusBadge';
import { SummaryHero } from './SummaryHero';

interface ClosedMonthDetailProps {
  month: ClosedMonth;
  /** Regra do backend: somente o último mês fechado pode ser reaberto. */
  canReopen: boolean;
  onReopened: (month: ClosedMonth) => void;
  /** Chamado quando o servidor rejeita a reabertura, para sincronizar o histórico. */
  onReopenRejected: () => void;
}

export function ClosedMonthDetail({
  month,
  canReopen,
  onReopened,
  onReopenRejected,
}: ClosedMonthDetailProps) {
  const period = { month: month.month, year: month.year };
  const data = useMonthData(period);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReopen() {
    setBusy(true);
    setError(null);
    try {
      await reopenMonth(month.id);
      setConfirming(false);
      onReopened(month);
    } catch (err) {
      setError(getErrorMessage(err));
      onReopenRejected();
    } finally {
      setBusy(false);
    }
  }

  const ready = data.status === 'ready';

  return (
    <div className="detail">
      <header className="detail__head">
        <div>
          <h2 className="detail__title">{formatPeriod(period)}</h2>
          <p className="detail__meta">
            <StatusBadge closed />
            <span>
              <CalendarCheck size={14} aria-hidden="true" /> Fechado em {formatDate(month.closedAt)}
            </span>
          </p>
        </div>
        {canReopen && (
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              setError(null);
              setConfirming(true);
            }}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Reabrir mês
          </button>
        )}
      </header>

      {!canReopen && (
        <p className="lock-hint">
          <Lock size={14} aria-hidden="true" />
          Somente o último mês fechado pode ser reaberto. Este mês permanece bloqueado para
          alterações.
        </p>
      )}

      {data.status === 'error' ? (
        <ErrorState message={data.error ?? 'Erro ao carregar o mês.'} onRetry={data.retry} />
      ) : (
        <>
          {data.refreshError && <InlineAlert tone="error">{data.refreshError}</InlineAlert>}
          <SummaryHero
            summary={data.summary}
            count={ready ? data.expenses.length : null}
            loading={!ready}
          />
          {ready && data.summary ? (
            <ReportsPanel summary={data.summary} />
          ) : (
            <section className="panel">
              <LoadingState label="Carregando relatórios…" />
            </section>
          )}
          <section className="panel" aria-labelledby={`ledger-${month.id}`}>
            <h2 id={`ledger-${month.id}`} className="panel__title">
              Lançamentos
            </h2>
            {ready ? (
              <ExpenseList expenses={data.expenses} locked />
            ) : (
              <LoadingState label="Carregando lançamentos…" />
            )}
          </section>
        </>
      )}

      {confirming && (
        <ConfirmDialog
          title={`Reabrir ${formatPeriod(period)}?`}
          confirmLabel="Reabrir mês"
          busy={busy}
          error={error}
          onConfirm={handleReopen}
          onCancel={() => setConfirming(false)}
        >
          <p>
            O mês voltará a ficar <strong>aberto</strong> e poderá receber alterações: cadastrar,
            editar e excluir despesas.
          </p>
          <p>O registro de fechamento será removido e o mês sairá do histórico.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
