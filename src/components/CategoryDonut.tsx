import { CATEGORIES, CATEGORY_ORDER } from '../constants/domain';
import type { Category, ExpenseSummary } from '../types';
import { formatCurrency, formatPercent } from '../utils/format';

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 2.5;

export function CategoryDonut({ summary }: { summary: ExpenseSummary }) {
  const entries = CATEGORY_ORDER.map((category) => ({
    category,
    value: summary.categories[category] ?? 0,
  }));
  const active = entries.filter((entry) => entry.value > 0).sort((a, b) => b.value - a.value);
  const inactive = entries.filter((entry) => entry.value <= 0).map((entry) => entry.category);
  const total = active.reduce((sum, entry) => sum + entry.value, 0);

  if (active.length === 0 || total <= 0) {
    return <p className="muted">Nenhum gasto por categoria neste período.</p>;
  }

  let offset = 0;
  const segments = active.map((entry) => {
    const length = (entry.value / total) * CIRCUMFERENCE;
    const visible = active.length > 1 ? Math.max(length - GAP, 0.5) : length;
    const segment = { ...entry, visible, offset };
    offset += length;
    return segment;
  });

  const summaryText = active
    .map((e) => `${CATEGORIES[e.category].label}: ${formatCurrency(e.value)}`)
    .join('; ');

  return (
    <div className="donut">
      <svg viewBox="0 0 140 140" className="donut__chart" role="img" aria-label={`Gastos por categoria. ${summaryText}`}>
        <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="var(--line)" strokeWidth="16" />
        {segments.map((segment) => (
          <circle
            key={segment.category}
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            stroke={CATEGORIES[segment.category].color}
            strokeWidth="16"
            strokeDasharray={`${segment.visible} ${CIRCUMFERENCE - segment.visible}`}
            strokeDashoffset={-segment.offset}
            transform="rotate(-90 70 70)"
          />
        ))}
        <text x="70" y="65" textAnchor="middle" className="donut__caption">
          Total
        </text>
        <text x="70" y="82" textAnchor="middle" className="donut__value">
          {formatCurrency(total)}
        </text>
      </svg>

      <div className="donut__legend">
        <ul>
          {active.map((entry) => (
            <li key={entry.category}>
              <span className="dot" style={{ background: CATEGORIES[entry.category].color }} />
              <span className="legend__name">{CATEGORIES[entry.category].label}</span>
              <span className="legend__value num">{formatCurrency(entry.value)}</span>
              <span className="legend__percent num">{formatPercent(entry.value / total)}</span>
            </li>
          ))}
        </ul>
        {inactive.length > 0 && (
          <p className="muted legend__empty">
            Sem movimentação: {inactive.map((c: Category) => CATEGORIES[c].label).join(', ')}.
          </p>
        )}
      </div>
    </div>
  );
}
