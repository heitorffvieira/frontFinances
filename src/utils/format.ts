const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const percent = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });

const MONTH_NAMES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/** `1250.5` → `R$ 1.250,50` */
export function formatCurrency(value: number): string {
  return brl.format(value);
}

/** `0.425` (fração) → `42,5%` */
export function formatPercent(fraction: number): string {
  return `${percent.format(fraction * 100)}%`;
}

/** `2026-10-16` → `16/10/2026` (sem passar por `Date`, evitando deslocamento de fuso). */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? '';
}

/** `{10, 2026}` → `Outubro de 2026` */
export function formatPeriod(period: { month: number; year: number }): string {
  const name = monthName(period.month);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} de ${period.year}`;
}
