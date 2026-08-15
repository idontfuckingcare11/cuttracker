import { Inbox } from 'lucide-react';

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 px-6 py-10 text-center dark:border-neutral-700">
      <div className="rounded-full bg-neutral-100 p-3 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
        <Icon size={22} />
      </div>
      <p className="text-sm font-semibold text-ink dark:text-neutral-100">{title}</p>
      {message ? <p className="max-w-xs text-xs text-neutral-500 dark:text-neutral-400">{message}</p> : null}
      {action}
    </div>
  );
}
