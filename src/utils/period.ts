import type { Period } from '../types';

export function getCurrentPeriod(now: Date = new Date()): Period {
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Data local de hoje no formato `yyyy-MM-dd`. */
export function todayISO(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function firstDayISO(period: Period): string {
  return `${period.year}-${pad(period.month)}-01`;
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/** O mês de referência de uma despesa é definido pela sua data. */
export function periodFromISO(value: string): Period {
  return { year: Number(value.slice(0, 4)), month: Number(value.slice(5, 7)) };
}

export function samePeriod(a: Period, b: Period): boolean {
  return a.month === b.month && a.year === b.year;
}

/** `{10, 2026}` → `2026-10` (usado em query strings). */
export function periodToParam(period: Period): string {
  return `${period.year}-${pad(period.month)}`;
}

export function parsePeriodParam(value: string | null): Period | null {
  if (!value) return null;
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}
