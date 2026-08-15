import { ProgressBar } from '../ui/ProgressBar.jsx';

export function MacroRow({ label, consumed, target, unit = 'g', color = 'bg-neutral-900 dark:bg-white' }) {
  const percent = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-semibold text-neutral-600 dark:text-neutral-300">{label}</span>
        <span className="font-medium text-neutral-500 dark:text-neutral-400">
          <span className="font-bold text-ink dark:text-neutral-100">{Math.round(consumed)}</span> / {target} {unit}
        </span>
      </div>
      <ProgressBar percent={percent} color={color} size="sm" />
    </div>
  );
}
