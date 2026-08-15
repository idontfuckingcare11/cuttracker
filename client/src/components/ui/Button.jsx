import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export function Button({ variant = 'primary', loading = false, className, children, disabled, ...rest }) {
  const base = variant === 'primary' ? 'btn-primary' : variant === 'ghost' ? 'btn-ghost' : 'btn-secondary';
  return (
    <button className={clsx(base, className)} disabled={disabled || loading} {...rest}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : null}
      {children}
    </button>
  );
}
