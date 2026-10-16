import { Lock, Pencil, Receipt, Trash2 } from 'lucide-react';
import type { Expense } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { CategoryChip, PaymentLabel } from './Chips';
import { EmptyState } from './States';

interface ExpenseListProps {
  expenses: Expense[];
  /** Mês fechado: sem ações de edição/exclusão. */
  locked: boolean;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
}

/** Apenas apresentação: data mais recente primeiro (o backend não garante ordem). */
function sortExpenses(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

export function ExpenseList({ expenses, locked, onEdit, onDelete }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Nenhuma despesa neste mês"
        description={
          locked
            ? 'Este mês foi fechado sem lançamentos visíveis.'
            : 'Os lançamentos cadastrados aparecerão aqui.'
        }
      />
    );
  }

  return (
    <div className="table-wrap">
      <table className="ledger">
        <thead>
          <tr>
            <th scope="col">Despesa</th>
            <th scope="col">Categoria</th>
            <th scope="col">Pagamento</th>
            <th scope="col">Data</th>
            <th scope="col" className="ledger__right">
              Valor
            </th>
            <th scope="col" className="ledger__actions">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortExpenses(expenses).map((expense) => (
            <tr key={expense.id}>
              <td className="cell-name">
                <span className="cell-name__text">{expense.name}</span>
              </td>
              <td className="cell-cat">
                <CategoryChip category={expense.category} />
              </td>
              <td className="cell-pay">
                <PaymentLabel method={expense.paymentMethod} />
              </td>
              <td className="cell-date num">{formatDate(expense.date)}</td>
              <td className="cell-value num">{formatCurrency(expense.value)}</td>
              <td className="cell-actions">
                {locked ? (
                  <span className="lock-note" title="Mês fechado: lançamento bloqueado">
                    <Lock size={14} aria-hidden="true" />
                    <span className="sr-only">Mês fechado: lançamento bloqueado</span>
                  </span>
                ) : (
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--icon"
                      onClick={() => onEdit?.(expense)}
                      aria-label={`Editar ${expense.name}`}
                      title="Editar"
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--icon btn--danger-ghost"
                      onClick={() => onDelete?.(expense)}
                      aria-label={`Excluir ${expense.name}`}
                      title="Excluir"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
