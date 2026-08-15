export function StatCard({ label, value, sub, icon }) {
  return (
    <div className="card-base flex items-center gap-3 p-4">
      {icon ? <div className="rounded-xl bg-neutral-100 p-2.5 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">{icon}</div> : null}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</p>
        <p className="text-lg font-bold text-ink dark:text-neutral-100">{value}</p>
        {sub ? <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{sub}</p> : null}
      </div>
    </div>
  );
}
