import { CreditCard, Zap } from 'lucide-react';
import type { ExpenseSummary } from '../types';
import { formatCurrency, formatPercent } from '../utils/format';

export function PaymentSplit({ summary }: { summary: ExpenseSummary }) {
  const total = summary.totalCredit + summary.totalImmediate;

  if (total <= 0) {
    return <p className="muted">Nenhum gasto registrado neste período.</p>;
  }

  const rows = [
    {
      key: 'credit',
      label: 'No crédito',
      hint: undefined,
      icon: CreditCard,
      value: summary.totalCredit,
      color: 'var(--credit)',
    },
    {
      key: 'immediate',
      label: 'Pagamentos imediatos',
      hint: 'Pix, débito e dinheiro',
      icon: Zap,
      value: summary.totalImmediate,
      color: 'var(--accent)',
    },
  ];

  return (
    <ul className="split">
      {rows.map(({ key, label, hint, icon: Icon, value, color }) => {
        const fraction = value / total;
        return (
          <li key={key}>
            <div className="split__head">
              <span className="split__label">
                <Icon size={15} aria-hidden="true" />
                {label}
              </span>
              <span className="num split__value">{formatCurrency(value)}</span>
            </div>
            <div
              className="split__track"
              role="img"
              aria-label={`${label}: ${formatPercent(fraction)} do total`}
            >
              <span style={{ width: `${fraction * 100}%`, background: color }} />
            </div>
            <p className="split__meta">
              {formatPercent(fraction)} do total{hint ? ` · ${hint}` : ''}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
