import { Ring } from '../ui/Ring.jsx';
import { fmtInt } from '../../lib/format.js';

export function CalorieRing({ consumed, target, size = 180 }) {
  const remaining = target - consumed;
  const percent = target > 0 ? (consumed / target) * 100 : 0;
  const over = consumed > target;
  return (
    <Ring percent={percent} size={size} stroke={10} barClass={over ? 'stroke-red-500 dark:stroke-red-400' : 'stroke-neutral-900 dark:stroke-white'}>
      <p className="text-3xl font-extrabold text-ink dark:text-neutral-100">{fmtInt(consumed)}</p>
      <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">of {fmtInt(target)} kcal</p>
    </Ring>
  );
}
