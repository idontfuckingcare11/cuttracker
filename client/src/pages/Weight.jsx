import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, TrendingDown, Flag, Loader2 } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../api/client.js';
import { Card, CardHeader, CardBody } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { StatCard } from '../components/ui/StatCard.jsx';
import { Loading } from '../components/ui/Loading.jsx';
import { WeightChart } from '../components/weight/WeightChart.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { fmtDate, todayKey } from '../lib/format.js';

const schema = z.object({
  weightKg: z.number().positive('Enter your weight').max(400),
  note: z.string().max(255).optional().nullable()
});

export default function Weight() {
  const [formError, setFormError] = useState('');
  const queryClient = useQueryClient();
  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ['weight-stats'],
    queryFn: () => apiGet('/weight-entries/stats')
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(schema) });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['weight-stats'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['progress'] });
  };

  const addMutation = useMutation({
    mutationFn: (values) => apiPost('/weight-entries', { ...values, loggedDate: todayKey() }),
    onSuccess: () => {
      invalidate();
      reset();
      setFormError('');
    },
    onError: (err) => setFormError(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiDelete(`/weight-entries/${id}`),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['weight-stats'] });
      const previousData = queryClient.getQueryData(['weight-stats']);
      queryClient.setQueryData(['weight-stats'], (old) => {
        if (!old) return old;
        return {
          ...old,
          series: old.series ? old.series.filter((item) => String(item.id) !== String(deletedId)) : [],
          entries: old.entries ? old.entries.filter((item) => String(item.id) !== String(deletedId)) : []
        };
      });
      return { previousData };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['weight-stats'], context.previousData);
      }
      alert(err.message || 'Failed to delete weight entry.');
    },
    onSettled: () => {
      invalidate();
    }
  });

  if (isLoading) return <Loading label="Loading your weight log…" />;
  if (isError || !stats) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Couldn't load weight data.</p>
        <Button variant="secondary" onClick={refetch}>
          Try again
        </Button>
      </div>
    );
  }

  const s = stats?.stats;
  const recent = stats?.entries && stats.entries.length > 0
    ? [...stats.entries].sort((a, b) => (b.loggedDate < a.loggedDate ? 1 : b.loggedDate > a.loggedDate ? -1 : b.id - a.id)).slice(0, 10)
    : stats?.series
    ? [...stats.series].reverse().slice(0, 10)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Weight log</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink dark:text-neutral-100">Trust the trend, not the day.</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<TrendingDown size={18} />} label="Start" value={s ? `${s.start} kg` : '—'} />
        <StatCard icon={<TrendingDown size={18} />} label="Current (7d avg)" value={s ? `${s.current} kg` : '—'} sub={s?.totalLost !== null ? `${s.totalLost} kg total lost` : ''} />
        <StatCard icon={<Flag size={18} />} label="Goal" value={s ? `${s.goal} kg` : '—'} sub={s?.remaining !== null ? `${s.remaining} kg to go` : ''} />
        <StatCard icon={<TrendingDown size={18} />} label="Weekly loss" value={s?.weeklyAvgLoss !== null && s?.weeklyAvgLoss !== undefined ? `${s.weeklyAvgLoss} kg/wk` : '—'} sub={s?.weeklyAvgLoss > 0 ? 'gaining' : ''} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Weight over time" subtitle="Gray line is raw weigh-ins; the black line is your 7-day rolling average" />
          <CardBody>
            {isLoading ? <Loading /> : stats?.series?.length ? <WeightChart data={stats.series} /> : <EmptyState title="No weigh-ins yet" message="Log your first weight below and your trend will appear here." />}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Log weight" />
          <CardBody>
            <form onSubmit={handleSubmit((v) => addMutation.mutate(v))} className="space-y-4">
              <Input type="number" step="0.1" label="Weight (kg)" placeholder="70.5" error={errors.weightKg?.message} {...register('weightKg', { valueAsNumber: true })} />
              <Input label="Note (optional)" placeholder="Morning fasted" error={errors.note?.message} {...register('note')} />
              {formError ? <p className="text-xs text-red-500">{formError}</p> : null}
              <Button type="submit" loading={isSubmitting} className="w-full">
                <Plus size={15} /> Log today's weight
              </Button>
            </form>
            <p className="mt-3 text-[11px] text-neutral-400 dark:text-neutral-600">Weigh in the same conditions each time (morning, after bathroom) for the most reliable trend.</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent weigh-ins" />
        <CardBody>
          {recent.length === 0 ? (
            <p className="text-sm text-neutral-400">No entries yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {recent.map((e, idx) => {
                const id = e.id;
                const weightVal = e.weightKg ?? e.weight;
                const dateVal = e.loggedDate ?? e.date;
                const isDeleting = deleteMutation.isPending && String(deleteMutation.variables) === String(id);
                return (
                  <li key={id || idx} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-bold text-ink dark:text-neutral-100">{weightVal} kg</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {fmtDate(dateVal)}
                        {e.avg7 ? ` · 7-day avg ${e.avg7} kg` : ''}
                        {e.note ? ` · ${e.note}` : ''}
                      </p>
                    </div>
                    {id ? (
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => deleteMutation.mutate(id)}
                        className="rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600 active:bg-red-100 dark:hover:bg-red-950/40 dark:hover:text-red-400 dark:active:bg-red-900/60 disabled:opacity-50 transition-colors"
                        aria-label="Delete entry"
                      >
                        {isDeleting ? <Loader2 size={15} className="animate-spin text-red-500" /> : <Trash2 size={15} />}
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
