import clsx from 'clsx';

const TONES = {
  gray: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
};

export function Badge({ tone = 'gray', children, className }) {
  return <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', TONES[tone], className)}>{children}</span>;
}
