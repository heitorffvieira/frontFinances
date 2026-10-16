/** Espelha o enum `Category` do backend. */
export type Category = 'COMIDA' | 'TRANSPORTE' | 'LAZER' | 'EDUCACAO' | 'OUTRO';

/** Espelha o enum `PaymentMethod` do backend. */
export type PaymentMethod = 'PIX' | 'DEBITO' | 'CREDITO' | 'DINHEIRO';

/** `ExpenseResponseDTO` */
export interface Expense {
  id: number;
  name: string;
  category: Category;
  paymentMethod: PaymentMethod;
  value: number;
  /** LocalDate serializado como `yyyy-MM-dd`. */
  date: string;
}

/** `ExpenseRequestDTO` */
export interface ExpensePayload {
  name: string;
  category: Category;
  value: number;
  paymentMethod: PaymentMethod;
  date: string;
}

/** `ExpenseSummaryDTO` — `categories` só contém categorias com movimentação. */
export interface ExpenseSummary {
  total: number;
  totalCredit: number;
  totalImmediate: number;
  categories: Partial<Record<Category, number>>;
}

/** Entidade `ClosedMonth` retornada por /months. */
export interface ClosedMonth {
  id: number;
  month: number;
  year: number;
  /** LocalDate serializado como `yyyy-MM-dd`. */
  closedAt: string;
}

/** `ClosedMonthRequest` */
export interface ClosedMonthPayload {
  month: number;
  year: number;
}

/** Mês (1–12) e ano de referência. */
export interface Period {
  month: number;
  year: number;
}
