import { useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Check, Loader2, Plus } from 'lucide-react';
import { CATEGORIES, CATEGORY_ORDER, PAYMENT_METHODS, PAYMENT_ORDER } from '../constants/domain';
import type { Category, Expense, ExpensePayload, PaymentMethod, Period } from '../types';
import { getErrorMessage } from '../utils/errors';
import { formatPeriod } from '../utils/format';
import { MAX_AMOUNT, parseMoney, toInputMoney } from '../utils/money';
import { isValidISODate, periodFromISO } from '../utils/period';
import { InlineAlert } from './States';

interface ExpenseFormProps {
  mode: 'create' | 'edit';
  initial?: Expense;
  /** Data sugerida no cadastro. */
  defaultDate: string;
  /** Retorna o mês fechado correspondente à data, se houver (apenas orientação visual). */
  findClosedPeriod: (isoDate: string) => Period | undefined;
  /** Bloqueia o formulário (ex.: mês fechado) e explica o motivo. */
  disabledReason?: string | null;
  onSubmit: (payload: ExpensePayload) => Promise<void>;
  onCancel?: () => void;
}

interface Values {
  name: string;
  category: Category | '';
  paymentMethod: PaymentMethod | '';
  value: string;
  date: string;
}

type Field = keyof Values;
type Errors = Partial<Record<Field, string>>;

function validate(values: Values, findClosedPeriod: ExpenseFormProps['findClosedPeriod']): Errors {
  const errors: Errors = {};

  if (!values.name.trim()) errors.name = 'Informe o nome da despesa.';
  else if (values.name.trim().length > 255) errors.name = 'O nome pode ter no máximo 255 caracteres.';

  if (!values.category) errors.category = 'Selecione uma categoria.';
  if (!values.paymentMethod) errors.paymentMethod = 'Selecione a forma de pagamento.';

  const amount = parseMoney(values.value);
  if (!values.value.trim()) errors.value = 'Informe o valor.';
  else if (amount === null) errors.value = 'Valor inválido. Use o formato 35,50.';
  else if (amount <= 0) errors.value = 'O valor deve ser maior que zero.';
  else if (amount > MAX_AMOUNT) errors.value = 'O valor máximo permitido é R$ 99.999.999,99.';

  if (!values.date) errors.date = 'Informe a data.';
  else if (!isValidISODate(values.date)) errors.date = 'Data inválida.';
  else {
    const closed = findClosedPeriod(values.date);
    if (closed) {
      errors.date = `${formatPeriod(closed)} está fechado. Escolha uma data em um mês aberto.`;
    }
  }

  return errors;
}

export function ExpenseForm({
  mode,
  initial,
  defaultDate,
  findClosedPeriod,
  disabledReason,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Values>(() => ({
    name: initial?.name ?? '',
    category: initial?.category ?? '',
    paymentMethod: initial?.paymentMethod ?? '',
    value: initial ? toInputMoney(initial.value) : '',
    date: initial?.date.slice(0, 10) ?? defaultDate,
  }));
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const errors = validate(values, findClosedPeriod);
  const visibleError = (field: Field) => (submitted || touched[field] ? errors[field] : undefined);
  const locked = Boolean(disabledReason);

  function update<K extends Field>(field: K, value: Values[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setFormError(null);
  }

  const blur = (field: Field) => () => setTouched((current) => ({ ...current, [field]: true }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting || locked) return;

    setSubmitted(true);
    if (Object.keys(errors).length > 0) {
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }

    const amount = parseMoney(values.value);
    if (amount === null || values.category === '' || values.paymentMethod === '') return;

    const payload: ExpensePayload = {
      name: values.name.trim(),
      category: values.category,
      paymentMethod: values.paymentMethod,
      value: Number(amount.toFixed(2)),
      date: values.date,
    };

    setSubmitting(true);
    setFormError(null);
    try {
      await onSubmit(payload);
      if (mode === 'create') {
        // Mantém categoria, pagamento e data para lançamentos em sequência.
        setValues((current) => ({ ...current, name: '', value: '' }));
        setTouched({});
        setSubmitted(false);
        formRef.current?.querySelector<HTMLElement>('input')?.focus();
      }
    } catch (err) {
      // Dados preservados para correção e nova tentativa.
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const id = (field: Field) => `${uid}-${field}`;
  const describedBy = (field: Field) => (visibleError(field) ? `${id(field)}-error` : undefined);
  const closedDateHint = (() => {
    if (!values.date || !isValidISODate(values.date)) return null;
    const period = periodFromISO(values.date);
    return `${formatPeriod(period)}`;
  })();

  return (
    <form ref={formRef} className="form" onSubmit={handleSubmit} noValidate>
      {disabledReason && <InlineAlert tone="warning">{disabledReason}</InlineAlert>}

      <fieldset className="form__grid" disabled={locked || submitting}>
        <legend className="sr-only">
          {mode === 'create' ? 'Dados da nova despesa' : 'Dados da despesa'}
        </legend>

        <div className="field field--wide">
          <label htmlFor={id('name')}>Nome da despesa</label>
          <input
            id={id('name')}
            type="text"
            value={values.name}
            maxLength={255}
            placeholder="Ex.: Almoço com a equipe"
            autoComplete="off"
            onChange={(e) => update('name', e.target.value)}
            onBlur={blur('name')}
            aria-invalid={Boolean(visibleError('name'))}
            aria-describedby={describedBy('name')}
          />
          {visibleError('name') && (
            <p id={`${id('name')}-error`} className="field__error">
              {visibleError('name')}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor={id('category')}>Categoria</label>
          <select
            id={id('category')}
            value={values.category}
            onChange={(e) => update('category', e.target.value as Category | '')}
            onBlur={blur('category')}
            aria-invalid={Boolean(visibleError('category'))}
            aria-describedby={describedBy('category')}
          >
            <option value="">Selecione…</option>
            {CATEGORY_ORDER.map((category) => (
              <option key={category} value={category}>
                {CATEGORIES[category].label}
              </option>
            ))}
          </select>
          {visibleError('category') && (
            <p id={`${id('category')}-error`} className="field__error">
              {visibleError('category')}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor={id('paymentMethod')}>Forma de pagamento</label>
          <select
            id={id('paymentMethod')}
            value={values.paymentMethod}
            onChange={(e) => update('paymentMethod', e.target.value as PaymentMethod | '')}
            onBlur={blur('paymentMethod')}
            aria-invalid={Boolean(visibleError('paymentMethod'))}
            aria-describedby={describedBy('paymentMethod')}
          >
            <option value="">Selecione…</option>
            {PAYMENT_ORDER.map((method) => (
              <option key={method} value={method}>
                {PAYMENT_METHODS[method].label}
              </option>
            ))}
          </select>
          {visibleError('paymentMethod') && (
            <p id={`${id('paymentMethod')}-error`} className="field__error">
              {visibleError('paymentMethod')}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor={id('value')}>Valor</label>
          <div className="input-affix">
            <span aria-hidden="true">R$</span>
            <input
              id={id('value')}
              type="text"
              inputMode="decimal"
              value={values.value}
              placeholder="0,00"
              autoComplete="off"
              onChange={(e) => update('value', e.target.value)}
              onBlur={blur('value')}
              aria-invalid={Boolean(visibleError('value'))}
              aria-describedby={describedBy('value')}
            />
          </div>
          {visibleError('value') && (
            <p id={`${id('value')}-error`} className="field__error">
              {visibleError('value')}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor={id('date')}>Data</label>
          <input
            id={id('date')}
            type="date"
            value={values.date}
            onChange={(e) => update('date', e.target.value)}
            onBlur={blur('date')}
            aria-invalid={Boolean(visibleError('date'))}
            aria-describedby={describedBy('date')}
          />
          {visibleError('date') ? (
            <p id={`${id('date')}-error`} className="field__error">
              {visibleError('date')}
            </p>
          ) : (
            closedDateHint && <p className="field__hint">Mês de referência: {closedDateHint}</p>
          )}
        </div>
      </fieldset>

      {formError && <InlineAlert tone="error">{formError}</InlineAlert>}

      <div className="form__actions">
        {onCancel && (
          <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={submitting}>
            Cancelar
          </button>
        )}
        <button type="submit" className="btn btn--primary" disabled={locked || submitting}>
          {submitting ? (
            <Loader2 size={16} className="spin" aria-hidden="true" />
          ) : mode === 'create' ? (
            <Plus size={16} aria-hidden="true" />
          ) : (
            <Check size={16} aria-hidden="true" />
          )}
          {mode === 'create' ? 'Adicionar despesa' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}
