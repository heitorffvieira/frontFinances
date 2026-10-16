import { API_URL } from '../config/env';

export type ApiErrorKind = 'network' | 'timeout' | 'http';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;

  constructor(message: string, kind: ApiErrorKind, status: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /**
   * Mensagens amigáveis por status HTTP, usadas quando o backend não envia
   * uma mensagem própria (o Spring omite `message` por padrão).
   */
  messages?: Partial<Record<number, string>>;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 60_000;
const RETRY_STATUS = new Set([502, 503, 504]);

const DEFAULT_MESSAGES: Record<number, string> = {
  400: 'Os dados enviados foram recusados pelo servidor. Revise as informações e tente novamente.',
  404: 'O registro não foi encontrado. Ele pode ter sido removido.',
  500: 'O servidor encontrou um erro inesperado. Tente novamente em instantes.',
  502: 'O servidor está indisponível no momento. Tente novamente em instantes.',
  503: 'O servidor está indisponível no momento. Tente novamente em instantes.',
  504: 'O servidor demorou demais para responder. Tente novamente em instantes.',
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Descarta mensagens técnicas (stack traces, erros de binding/parse do Spring). */
function isFriendly(message: string): boolean {
  if (!message.trim() || message.length > 200) return false;
  return !/validation failed|json parse|failed to|required request|cannot deserialize|could not|exception|java\.|org\.|no message available/i.test(
    message,
  );
}

function extractServerMessage(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return null;
  const body = data as Record<string, unknown>;

  if (Array.isArray(body.errors)) {
    const messages = body.errors
      .map((item) =>
        typeof item === 'object' && item !== null
          ? (item as Record<string, unknown>).defaultMessage
          : null,
      )
      .filter((m): m is string => typeof m === 'string' && isFriendly(m));
    if (messages.length > 0) return messages.join(' ');
  }

  if (typeof body.message === 'string' && isFriendly(body.message)) return body.message;
  return null;
}

function resolveMessage(
  status: number,
  data: unknown,
  custom?: Partial<Record<number, string>>,
): string {
  return (
    extractServerMessage(data) ??
    custom?.[status] ??
    DEFAULT_MESSAGES[status] ??
    (status >= 500
      ? DEFAULT_MESSAGES[500]
      : 'Não foi possível concluir a operação. Tente novamente.')
  );
}

async function send(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(
        'O servidor demorou demais para responder. Tente novamente em instantes.',
        'timeout',
      );
    }
    throw new ApiError(
      'Não foi possível conectar ao servidor. Verifique sua conexão e se a API está disponível.',
      'network',
    );
  } finally {
    clearTimeout(timer);
  }
}

async function parse<T>(response: Response, custom?: Partial<Record<number, string>>): Promise<T> {
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(resolveMessage(response.status, data, custom), 'http', response.status);
  }
  if (!text) return undefined as T;
  if (data === null) {
    throw new ApiError('O servidor enviou uma resposta inesperada.', 'http', response.status);
  }
  return data as T;
}

/**
 * Cliente HTTP central. Consultas (GET) são repetidas até 2 vezes em caso de falha de
 * rede ou 502/503/504, cobrindo a "partida a frio" do Render. Escritas nunca são repetidas.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const hasBody = options.body !== undefined;
  const init: RequestInit = {
    method,
    headers: {
      Accept: 'application/json',
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    },
    body: hasBody ? JSON.stringify(options.body) : undefined,
  };
  const timeout = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = method === 'GET' ? 2 : 0;
  const url = `${API_URL}${path}`;

  for (let attempt = 0; ; attempt++) {
    try {
      const response = await send(url, init, timeout);
      if (RETRY_STATUS.has(response.status) && attempt < maxRetries) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      return await parse<T>(response, options.messages);
    } catch (err) {
      if (err instanceof ApiError && err.kind === 'network' && attempt < maxRetries) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
}
