import type { ExpenseSummary } from '../types';
import { formatCurrency } from '../utils/format';
import { CategoryDonut } from './CategoryDonut';
import { PaymentSplit } from './PaymentSplit';

export function ReportsPanel({ summary }: { summary: ExpenseSummary }) {
  return (
    <section className="panel" aria-labelledby="reports-title">
      <h2 id="reports-title" className="panel__title">
        Relatórios
      </h2>
      <div className="reports">
        <div>
          <h3 className="panel__subtitle">Por categoria</h3>
          <CategoryDonut summary={summary} />
        </div>
        <div>
          <h3 className="panel__subtitle">Forma de pagamento</h3>
          <PaymentSplit summary={summary} />
        </div>
        <p className="reports__total">
          <span>Total do mês</span>
          <strong className="num">{formatCurrency(summary.total)}</strong>
        </p>
      </div>
    </section>
  );
}
