import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { CircleAlert, Loader2, WifiOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Aviso de "servidor acordando" após alguns segundos de espera (Render gratuito hiberna). */
export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="state" role="status" aria-live="polite">
      <Loader2 size={26} className="spin state__icon" aria-hidden="true" />
      <p className="state__title">{label}</p>
      {slow && (
        <p className="state__text">
          O servidor pode estar acordando após um período de inatividade. Isso costuma levar até um
          minuto no primeiro acesso.
        </p>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state state--error" role="alert">
      <WifiOff size={26} className="state__icon" aria-hidden="true" />
      <p className="state__title">Não foi possível carregar os dados</p>
      <p className="state__text">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn--secondary" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="state">
      <Icon size={26} className="state__icon" aria-hidden="true" />
      <p className="state__title">{title}</p>
      <p className="state__text">{description}</p>
      {children}
    </div>
  );
}

interface InlineAlertProps {
  tone?: 'error' | 'warning' | 'info';
  children: ReactNode;
  action?: { label: string; onClick: () => void };
}

export function InlineAlert({ tone = 'error', children, action }: InlineAlertProps) {
  return (
    <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'note'}>
      <CircleAlert size={18} aria-hidden="true" />
      <p>{children}</p>
      {action && (
        <button type="button" className="alert__action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
