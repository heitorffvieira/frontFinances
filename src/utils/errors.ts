import { ApiError } from '../services/http';

export function getErrorMessage(
  err: unknown,
  fallback = 'Ocorreu um erro inesperado. Tente novamente.',
): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function isNotFound(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404;
}
