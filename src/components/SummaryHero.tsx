import { CreditCard, Receipt, Zap } from 'lucide-react';
import type { ExpenseSummary } from '../types';
import { formatCurrency } from '../utils/format';

interface SummaryHeroProps {
  summary: ExpenseSummary | null;
  count: number | null;
  loading?: boolean;
}

export function SummaryHero({ summary, count, loading = false }: SummaryHeroProps) {
  const show = (value: number | undefined) =>
    loading || value === undefined ? <span className="skeleton skeleton--on-dark" /> : formatCurrency(value);

  return (
    <section className="hero" aria-label="Resumo financeiro do mês">
      <div className="hero__main">
        <p className="hero__label">Total de despesas</p>
        <p className="hero__total num">{show(summary?.total)}</p>
      </div>
      <dl className="hero__facts">
        <div>
          <dt>
            <CreditCard size={15} aria-hidden="true" />
            No crédito
          </dt>
          <dd className="num">{show(summary?.totalCredit)}</dd>
        </div>
        <div>
          <dt>
            <Zap size={15} aria-hidden="true" />
            Pagamentos imediatos
          </dt>
          <dd className="num">{show(summary?.totalImmediate)}</dd>
          <small>Pix, débito e dinheiro</small>
        </div>
        <div>
          <dt>
            <Receipt size={15} aria-hidden="true" />
            Lançamentos
          </dt>
          <dd className="num">
            {loading || count === null ? <span className="skeleton skeleton--on-dark" /> : count}
          </dd>
        </div>
      </dl>
    </section>
  );
}
