const DEFAULT_API_URL = 'https://apifinancas.onrender.com';

const raw = import.meta.env.VITE_API_URL?.trim();

if (!raw) {
  console.warn(
    `VITE_API_URL não definida. Usando a API de produção (${DEFAULT_API_URL}). ` +
      'Copie .env.example para .env para configurar outra URL.',
  );
}

/** URL-base da API, sem barra final. */
export const API_URL = (raw || DEFAULT_API_URL).replace(/\/+$/, '');
