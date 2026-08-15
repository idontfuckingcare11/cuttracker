import { forwardRef } from 'react';
import clsx from 'clsx';

export const Select = forwardRef(function Select({ label, error, options, className, ...rest }, ref) {
  return (
    <label className="block">
      {label ? <span className="label-text">{label}</span> : null}
      <select ref={ref} className={clsx('input-field', error && 'border-red-400 dark:border-red-500', className)} {...rest}>
        {options.map((opt) => {
          if (opt && typeof opt === 'object') {
            return (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            );
          }
          return (
            <option key={opt} value={opt}>
              {opt}
            </option>
          );
        })}
      </select>
      {error ? <span className="mt-1 block text-xs text-red-500 dark:text-red-400">{error}</span> : null}
    </label>
  );
});
