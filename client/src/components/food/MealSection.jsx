import { Pencil, Trash2 } from 'lucide-react';
import clsx from 'clsx';

const MEAL_ICONS = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
  extra: '🍌'
};

export function MealSection({ mealType, entries, subtotal, onEdit, onDelete }) {
  return (
    <section className="card-base overflow-hidden">
      <header className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{MEAL_ICONS[mealType]}</span>
          <h3 className="text-sm font-bold capitalize text-ink dark:text-neutral-100">{mealType}</h3>
        </div>
        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{Math.round(subtotal.calories)} kcal</span>
      </header>
      {entries.length === 0 ? (
        <p className="px-4 py-4 text-xs text-neutral-400 dark:text-neutral-600">Nothing logged.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {entries.map((entry) => (
            <li key={entry.id} className="group flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink dark:text-neutral-100">{entry.name}</p>
                <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {entry.servingSize} · P {entry.proteinG} · C {entry.carbsG} · F {entry.fatG}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-sm font-bold text-ink dark:text-neutral-100">{entry.calories}</span>
                <span className="text-[10px] text-neutral-400">kcal</span>
                <button onClick={() => onEdit(entry)} className="rounded-md p-1 text-neutral-400 opacity-0 transition hover:bg-neutral-100 hover:text-neutral-700 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-200" aria-label="Edit">
                  <Pencil size={14} />
                </button>
                <button onClick={() => onDelete(entry)} className="rounded-md p-1 text-neutral-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-red-950/40 dark:hover:text-red-400" aria-label="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function MealTypePicker({ value, onChange }) {
  const types = ['breakfast', 'lunch', 'dinner', 'snack', 'extra'];
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {types.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={clsx(
            'rounded-lg border px-1.5 sm:px-2 py-2 text-xs font-semibold capitalize transition flex items-center justify-center gap-1 truncate',
            value === t
              ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
              : 'border-neutral-300 text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300'
          )}
        >
          <span>{MEAL_ICONS[t]}</span>
          <span className="truncate">{t}</span>
        </button>
      ))}
    </div>
  );
}
