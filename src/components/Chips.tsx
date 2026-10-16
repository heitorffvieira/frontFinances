import { CATEGORIES, PAYMENT_METHODS } from '../constants/domain';
import type { Category, PaymentMethod } from '../types';

export function CategoryChip({ category }: { category: Category }) {
  const meta = CATEGORIES[category];
  const Icon = meta.icon;
  return (
    <span className="chip" style={{ ['--chip-color' as string]: meta.color }}>
      <Icon size={14} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function PaymentLabel({ method }: { method: PaymentMethod }) {
  const meta = PAYMENT_METHODS[method];
  const Icon = meta.icon;
  return (
    <span className="payment">
      <Icon size={15} aria-hidden="true" />
      {meta.label}
    </span>
  );
}
