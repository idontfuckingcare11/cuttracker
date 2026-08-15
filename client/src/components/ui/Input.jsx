import { forwardRef } from 'react';
import clsx from 'clsx';

export const Input = forwardRef(function Input({ label, error, className, ...rest }, ref) {
  return (
    <label className="block">
      {label ? <span className="label-text">{label}</span> : null}
      <input ref={ref} className={clsx('input-field', error && 'border-red-400 dark:border-red-500', className)} {...rest} />
      {error ? <span className="mt-1 block text-xs text-red-500 dark:text-red-400">{error}</span> : null}
    </label>
  );
});
