import { Loader2 } from 'lucide-react';

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-neutral-500 dark:text-neutral-400">
      <Loader2 size={28} className="animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function Spinner({ size = 16 }) {
  return <Loader2 size={size} className="animate-spin" />;
}
