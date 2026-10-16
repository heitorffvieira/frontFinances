import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Lock, LockKeyhole, Receipt } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ExpenseForm } from '../components/ExpenseForm';
import { ExpenseList } from '../components/ExpenseList';
import { Modal } from '../components/Modal';
import { ReportsPanel } from '../components/ReportsPanel';
import { ErrorState, InlineAlert, LoadingState } from '../components/States';
import { StatusBadge } from '../components/StatusBadge';
import { SummaryHero } from '../components/SummaryHero';
import { useClosedMonths } from '../hooks/useClosedMonths';
import { useMonthData } from '../hooks/useMonthData';
import { useToast } from '../hooks/useToast';
import { createExpense, deleteExpense, updateExpense } from '../services/expenses';
import { closeMonth } from '../services/months';
import type { Expense, ExpensePayload, Period } from '../types';
import { getErrorMessage, isNotFound } from '../utils/errors';
import { formatCurrency, formatDate, formatPeriod } from '../utils/format';
import {
  firstDayISO,
  getCurrentPeriod,
  parsePeriodParam,
  periodFromISO,
  periodToParam,
  samePeriod,
  todayISO,
} from '../utils/period';

export default function OverviewPage() {
  const toast = useToast();
  const [params] = useSearchParams();

  const current = getCurrentPeriod();
  const period: Period = parsePeriodParam(params.get('mes')) ?? current;
  const isCurrent = samePeriod(period, current);

  const data = useMonthData(period);
  const closed = useClosedMonths();

  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [closeBusy, setCloseBusy] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  const closedRecord = closed.months.find((m) => samePeriod(m, period));
  const isClosed = Boolean(closedRecord);
  const ready = data.status === 'ready';
  const count = ready ? data.expenses.length : null;
  const defaultDate = isCurrent ? todayISO() : firstDayISO(period);

  const findClosedPeriod = (iso: string): Period | undefined => {
    const target = periodFromISO(iso);
    const match = closed.months.find((m) => samePeriod(m, target));
    return match ? { month: match.month, year: match.year } : undefined;
  };

  const lockedReason = isClosed
    ? 'Este mês está fechado. Não é possível cadastrar, editar ou excluir despesas enquanto ele permanecer fechado.'
    : null;

  function notifyOtherMonth(payload: ExpensePayload) {
    const target = periodFromISO(payload.date);
    if (!samePeriod(target, period)) {
      toast.info(`A despesa pertence a ${formatPeriod(target)} e não aparece na lista deste mês.`);
    }
  }

  async function handleCreate(payload: ExpensePayload) {
    await createExpense(payload);
    toast.success('Despesa cadastrada.');
    notifyOtherMonth(payload);
    void data.reload();
  }

  async function handleUpdate(expense: Expense, payload: ExpensePayload) {
    await updateExpense(expense.id, payload);
    toast.success('Despesa atualizada.');
    notifyOtherMonth(payload);
    setEditing(null);
    void data.reload();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteExpense(deleting.id);
      toast.success('Despesa excluída.');
      setDeleting(null);
      void data.reload();
    } catch (err) {
      setDeleteError(getErrorMessage(err));
      if (isNotFound(err)) void data.reload();
    } finally {
      setDeleteBusy(false);
    }
  }

  async function confirmClose() {
    setCloseBusy(true);
    setCloseError(null);
    try {
      await closeMonth({ month: period.month, year: period.year });
      await closed.reload(true);
      setClosing(false);
      toast.success(`${formatPeriod(period)} foi fechado.`);
    } catch (err) {
      setCloseError(getErrorMessage(err));
      void closed.reload(true);
    } finally {
      setCloseBusy(false);
    }
  }

  return (
    <main className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">{formatPeriod(period)}</h1>
          <p className="page-sub">
            {closed.status === 'ready' && <StatusBadge closed={isClosed} />}
            <span>{isCurrent ? 'Despesas do mês atual' : 'Período selecionado'}</span>
          </p>
        </div>
        {!isCurrent && (
          <Link to="/" className="btn btn--secondary">
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar ao mês atual
          </Link>
        )}
      </header>

      {closed.status === 'error' && (
        <InlineAlert tone="warning" action={{ label: 'Verificar de novo', onClick: () => void closed.reload() }}>
          Não foi possível confirmar se o mês está fechado. O servidor continuará validando cada
          operação.
        </InlineAlert>
      )}

      {data.status === 'error' ? (
        <section className="panel">
          <ErrorState message={data.error ?? 'Erro ao carregar o mês.'} onRetry={data.retry} />
        </section>
      ) : (
        <>
          {data.refreshError && (
            <InlineAlert tone="error" action={{ label: 'Tentar novamente', onClick: () => void data.reload() }}>
              {data.refreshError} Os dados exibidos podem estar desatualizados.
            </InlineAlert>
          )}

          <SummaryHero summary={data.summary} count={count} loading={!ready} />

          <div className="columns">
            <div className="columns__main">
              <section className="panel" aria-labelledby="new-expense-title">
                <h2 id="new-expense-title" className="panel__title">
                  Nova despesa
                </h2>
                <ExpenseForm
                  mode="create"
                  defaultDate={defaultDate}
                  findClosedPeriod={findClosedPeriod}
                  disabledReason={lockedReason}
                  onSubmit={handleCreate}
                />
              </section>

              <section className="panel panel--flush" aria-labelledby="ledger-title">
                <div className="panel__bar">
                  <h2 id="ledger-title" className="panel__title">
                    Lançamentos
                  </h2>
                  {data.refreshing && <span className="muted">Atualizando…</span>}
                </div>
                {ready ? (
                  <ExpenseList
                    expenses={data.expenses}
                    locked={isClosed}
                    onEdit={(expense) => setEditing(expense)}
                    onDelete={(expense) => {
                      setDeleteError(null);
                      setDeleting(expense);
                    }}
                  />
                ) : (
                  <LoadingState label="Carregando lançamentos…" />
                )}
              </section>
            </div>

            <aside className="columns__side">
              {ready && data.summary ? (
                <ReportsPanel summary={data.summary} />
              ) : (
                <section className="panel">
                  <LoadingState label="Carregando relatórios…" />
                </section>
              )}

              <section className="panel" aria-labelledby="close-title">
                <h2 id="close-title" className="panel__title">
                  Fechamento do mês
                </h2>
                {closedRecord ? (
                  <>
                    <p className="lock-hint">
                      <Lock size={14} aria-hidden="true" />
                      Fechado em {formatDate(closedRecord.closedAt)}. As despesas deste mês estão
                      bloqueadas.
                    </p>
                    <Link to={`/historico?mes=${periodToParam(period)}`} className="btn btn--secondary btn--block">
                      Ver no histórico
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="panel__text">
                      Depois de fechar, não será possível cadastrar, editar ou excluir despesas
                      deste mês enquanto ele permanecer fechado.
                    </p>
                    <button
                      type="button"
                      className="btn btn--primary btn--block"
                      disabled={!ready || count === 0}
                      onClick={() => {
                        setCloseError(null);
                        setClosing(true);
                      }}
                    >
                      <LockKeyhole size={16} aria-hidden="true" />
                      Fechar {formatPeriod(period).split(' de ')[0].toLowerCase()}
                    </button>
                    {ready && count === 0 && (
                      <p className="field__hint">
                        <Receipt size={13} aria-hidden="true" /> Cadastre ao menos uma despesa para
                        poder fechar o mês.
                      </p>
                    )}
                  </>
                )}
              </section>
            </aside>
          </div>
        </>
      )}

      {editing && (
        <Modal title="Editar despesa" onClose={() => setEditing(null)}>
          <ExpenseForm
            mode="edit"
            initial={editing}
            defaultDate={defaultDate}
            findClosedPeriod={findClosedPeriod}
            onSubmit={(payload) => handleUpdate(editing, payload)}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Excluir despesa?"
          confirmLabel="Excluir"
          tone="danger"
          busy={deleteBusy}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        >
          <p>
            Você está prestes a excluir <strong>{deleting.name}</strong> (
            {formatCurrency(deleting.value)}, {formatDate(deleting.date)}). Esta ação não pode ser
            desfeita.
          </p>
        </ConfirmDialog>
      )}

      {closing && (
        <ConfirmDialog
          title={`Fechar ${formatPeriod(period)}?`}
          confirmLabel="Fechar mês"
          busy={closeBusy}
          error={closeError}
          onConfirm={confirmClose}
          onCancel={() => setClosing(false)}
        >
          <p>
            Depois do fechamento, <strong>não será possível cadastrar, editar ou excluir</strong>{' '}
            despesas deste mês enquanto ele permanecer fechado.
          </p>
          <p>Você poderá reabri-lo pelo histórico, desde que seja o último mês fechado.</p>
        </ConfirmDialog>
      )}
    </main>
  );
}
