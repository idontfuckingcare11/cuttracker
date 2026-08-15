import clsx from 'clsx';

export function ProgressBar({ percent, color = 'bg-neutral-900 dark:bg-white', className, size = 'md' }) {
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  const height = size === 'sm' ? 'h-1.5' : 'h-2';
  return (
    <div className={clsx('w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800', height, className)}>
      <div
        className={clsx('h-full rounded-full transition-all duration-500', color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
