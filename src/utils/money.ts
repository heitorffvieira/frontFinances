/** Maior valor aceito pela coluna `amount` (precision 10, scale 2). */
export const MAX_AMOUNT = 99_999_999.99;

/**
 * Converte texto digitado em número.
 * Aceita `35,50`, `35.50`, `1.250,50` e `R$ 1250`. Retorna `null` se inválido.
 */
export function parseMoney(input: string): number | null {
  const text = input.replace(/R\$|\s/g, '');
  if (!text) return null;

  let normalized: string;
  if (text.includes(',')) {
    normalized = text.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    normalized = text.replace(/\./g, '');
  } else {
    normalized = text;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Number(normalized);
}

/** `35.5` → `35,50` (para preencher o campo de edição). */
export function toInputMoney(value: number): string {
  return value.toFixed(2).replace('.', ',');
}
