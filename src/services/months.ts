import type { ClosedMonth, ClosedMonthPayload } from '../types';
import { request } from './http';

/** Histórico em ordem decrescente de ano e mês (ordenação feita pelo backend). */
export function getClosedMonths(): Promise<ClosedMonth[]> {
  return request<ClosedMonth[]>('/months', {
    messages: { 500: 'Não foi possível carregar o histórico de meses.' },
  });
}

export function getClosedMonthById(id: number): Promise<ClosedMonth> {
  return request<ClosedMonth>(`/months/${id}`);
}

export function closeMonth(payload: ClosedMonthPayload): Promise<ClosedMonth> {
  return request<ClosedMonth>('/months', {
    method: 'POST',
    body: payload,
    messages: {
      400: 'Não foi possível fechar o mês: ele já está fechado ou não possui despesas.',
    },
  });
}

/** Reabre o mês removendo o registro de fechamento. O backend só aceita o último mês fechado. */
export function reopenMonth(id: number): Promise<void> {
  return request<void>(`/months/${id}/reopen`, {
    method: 'DELETE',
    messages: {
      400: 'Apenas o último mês fechado pode ser reaberto.',
      404: 'Este mês não está mais fechado.',
    },
  });
}
