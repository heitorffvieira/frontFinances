import type { Expense, ExpensePayload, ExpenseSummary, Period } from '../types';
import { request } from './http';

const query = ({ month, year }: Period) => `month=${month}&year=${year}`;

export function getExpensesByMonth(period: Period): Promise<Expense[]> {
  return request<Expense[]>(`/expenses/month?${query(period)}`, {
    messages: { 400: 'Período inválido.', 500: 'Não foi possível carregar as despesas do mês.' },
  });
}

export function getMonthSummary(period: Period): Promise<ExpenseSummary> {
  return request<ExpenseSummary>(`/expenses/month/summary?${query(period)}`, {
    messages: { 400: 'Período inválido.', 500: 'Não foi possível carregar o resumo do mês.' },
  });
}

export function getExpenseById(id: number): Promise<Expense> {
  return request<Expense>(`/expenses/${id}`);
}

export function getAllExpenses(): Promise<Expense[]> {
  return request<Expense[]>('/expenses');
}

export function createExpense(payload: ExpensePayload): Promise<Expense> {
  return request<Expense>('/expenses', {
    method: 'POST',
    body: payload,
    messages: {
      400: 'Não foi possível cadastrar. Confira os dados e verifique se o mês da despesa não está fechado.',
    },
  });
}

export function updateExpense(id: number, payload: ExpensePayload): Promise<Expense> {
  return request<Expense>(`/expenses/${id}`, {
    method: 'PUT',
    body: payload,
    messages: {
      400: 'Não foi possível salvar. Confira os dados e verifique se o mês da despesa (antigo ou novo) não está fechado.',
      404: 'Esta despesa não existe mais.',
    },
  });
}

export function deleteExpense(id: number): Promise<void> {
  return request<void>(`/expenses/${id}`, {
    method: 'DELETE',
    messages: {
      400: 'Não foi possível excluir: o mês desta despesa está fechado.',
      404: 'Esta despesa não existe mais.',
    },
  });
}
