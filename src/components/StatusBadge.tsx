import { Lock, LockOpen } from 'lucide-react';

export function StatusBadge({ closed }: { closed: boolean }) {
  return closed ? (
    <span className="badge badge--closed">
      <Lock size={13} aria-hidden="true" />
      Fechado
    </span>
  ) : (
    <span className="badge badge--open">
      <LockOpen size={13} aria-hidden="true" />
      Aberto
    </span>
  );
}
