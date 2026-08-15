import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import { Scale, Flame, Beef, Dumbbell, Clock3, TrendingDown, Target } from 'lucide-react';
import { apiGet } from '../api/client.js';
import { Card, CardHeader, CardBody } from '../components/ui/Card.jsx';
import { StatCard } from '../components/ui/StatCard.jsx';
import { Loading } from '../components/ui/Loading.jsx';
import { Alert } from '../components/ui/Alert.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { fmtNum } from '../lib/format.js';

function axisProps() {
  return {
    tick: { fontSize: 11 },
    stroke: 'currentColor',
    className: 'text-neutral-400 dark:text-neutral-500'
  };
}

function TooltipCard({ active, payload, label, unit }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-pop dark:border-neutral-700 dark:bg-neutral-900">
      <p className="mb-1 font-semibold text-ink dark:text-neutral-100">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-neutral-600 dark:text-neutral-300">
          {p.name}: <span className="font-bold">{p.value}{unit}</span>
        </p>
      ))}
    </div>
  );
}

export default function Progress() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['progress'], queryFn: () => apiGet('/progress') });

  if (isLoading) return <Loading label="Crunching your numbers…" />;
  if (isError || !data) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-neutral-500">Couldn't load your progress.</p>
      </div>
    );
  }

  const s = data.stats;
  const hasTooFast = s.weeklyAvgLoss !== null && s.weeklyAvgLoss < 0 && Math.abs(s.weeklyAvgLoss) > (0.01 * s.current);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Progress</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink dark:text-neutral-100">How is the cut going?</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard icon={<Scale size={18} />} label="Total lost" value={`${s.totalLost ?? '—'} kg`} sub={`${s.start ?? '—'} → ${s.current ?? '—'} kg`} />
        <StatCard icon={<Target size={18} />} label="Progress to goal" value={`${s.progressPct}%`} sub={`${s.remaining ?? '—'} kg remaining`} />
        <StatCard icon={<TrendingDown size={18} />} label="Avg weekly loss" value={s.weeklyAvgLoss !== null ? `${s.weeklyAvgLoss} kg/wk` : '—'} sub="7-day average trend" />
        <StatCard icon={<Clock3 size={18} />} label="Est. time to goal" value={s.estWeeksToGoal !== null && s.estWeeksToGoal !== undefined ? `${s.estWeeksToGoal} wk` : '—'} sub="At current pace" />
        <StatCard icon={<Dumbbell size={18} />} label="Total workouts" value={s.totalWorkouts} sub={`${s.avgWorkoutsPerWeek} per week avg`} />
        <StatCard icon={<Flame size={18} />} label="Workouts this month" value={s.workoutsThisMonth} />
      </div>

      {hasTooFast ? (
        <Alert tone="warning">Your recent rate of loss is faster than the recommended ~1% of bodyweight per week. Consider eating slightly more so you keep muscle.</Alert>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Weight trend" subtitle="Raw weigh-ins vs 7-day rolling average" />
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.charts.weight} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" vertical={false} />
                  <XAxis dataKey="date" {...axisProps()} tickFormatter={(v) => v.slice(5)} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} {...axisProps()} width={46} />
                  <Tooltip content={<TooltipCard unit=" kg" />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="weight" name="Weigh-in" stroke="#a3a3a3" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="avg7" name="7-day avg" stroke="#171717" strokeWidth={2.5} dot={false} className="dark:stroke-white" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Calories" subtitle="Last 28 days vs your target" />
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.charts.calories} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" vertical={false} />
                  <XAxis dataKey="date" {...axisProps()} tickFormatter={(v) => v.slice(5)} />
                  <YAxis {...axisProps()} width={46} />
                  <Tooltip content={<TooltipCard unit=" kcal" />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="calories" name="Eaten" fill="#d4d4d4" radius={[3, 3, 0, 0]} className="dark:fill-neutral-700" />
                  <ReferenceLine y={data.charts.calories[0]?.target} stroke="#171717" className="dark:stroke-white" strokeDasharray="4 4" label={{ value: 'Target', fontSize: 11, fill: '#a3a3a3', position: 'insideTopRight' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Protein" subtitle="Last 28 days vs your target" />
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.charts.protein} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" vertical={false} />
                  <XAxis dataKey="date" {...axisProps()} tickFormatter={(v) => v.slice(5)} />
                  <YAxis {...axisProps()} width={46} />
                  <Tooltip content={<TooltipCard unit=" g" />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="grams" name="Protein" fill="#737373" radius={[3, 3, 0, 0]} className="dark:fill-neutral-500" />
                  <ReferenceLine y={data.charts.protein[0]?.target} stroke="#171717" className="dark:stroke-white" strokeDasharray="4 4" label={{ value: 'Target', fontSize: 11, fill: '#a3a3a3', position: 'insideTopRight' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Workout frequency" subtitle="Sessions + volume (sets × reps × kg) per week" />
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.workoutFreq} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" vertical={false} />
                  <XAxis dataKey="week" {...axisProps()} tickFormatter={(v) => v.slice(5)} />
                  <YAxis {...axisProps()} width={46} />
                  <Tooltip content={<TooltipCard unit="" />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" name="Workouts" fill="#171717" radius={[3, 3, 0, 0]} className="dark:fill-white" />
                  <Bar dataKey="volume" name="Volume (×10³)" fill="#d4d4d4" radius={[3, 3, 0, 0]} className="dark:fill-neutral-700" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Badge tone="gray"><Beef size={11} /> Protein-first macros protect muscle while you cut</Badge>
      </div>
      <p className="text-center text-[11px] text-neutral-400 dark:text-neutral-600">Estimates for fitness guidance only — not medical advice.</p>
    </div>
  );
}
