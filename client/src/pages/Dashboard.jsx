import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Scale, Flame, Sparkles, BellRing, ArrowRight, ChevronRight } from 'lucide-react';
import { apiGet } from '../api/client.js';
import { Card, CardHeader, CardBody } from '../components/ui/Card.jsx';
import { CalorieRing } from '../components/dashboard/CalorieRing.jsx';
import { MacroRow } from '../components/dashboard/MacroRow.jsx';
import { TodayWorkoutCard } from '../components/dashboard/TodayWorkoutCard.jsx';
import { ProgressBar } from '../components/ui/ProgressBar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Alert } from '../components/ui/Alert.jsx';
import { Loading } from '../components/ui/Loading.jsx';
import { Button } from '../components/ui/Button.jsx';
import { fmtNum, fmtDay } from '../lib/format.js';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const STATUS_LABEL = {
  on_track: { label: 'On track', tone: 'green' },
  too_slow: { label: 'Losing too slowly', tone: 'amber' },
  too_fast: { label: 'Losing too quickly', tone: 'red' }
};

const NOTIF_TONE = { info: 'info', warning: 'warning', success: 'success' };

export default function Dashboard() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['dashboard'], queryFn: () => apiGet('/dashboard') });

  if (isLoading) return <Loading label="Loading your dashboard…" />;
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-sm text-neutral-500">Couldn't load your dashboard.</p>
        <Button variant="secondary" onClick={refetch}>
          Try again
        </Button>
      </div>
    );
  }

  const status = STATUS_LABEL[data.aiInsight.status] || STATUS_LABEL.on_track;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">{fmtDay(data.date)}</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink dark:text-neutral-100">
            {greeting()}. Let's hit your numbers.
          </h1>
        </div>
        <div className="flex gap-2">
          <Link to="/app/food">
            <Button variant="secondary">
              <Plus size={15} /> Log food
            </Button>
          </Link>
          <Link to="/app/weight">
            <Button>
              <Scale size={15} /> Log weight
            </Button>
          </Link>
        </div>
      </div>

      {data.notifications.length > 0 ? (
        <div className="space-y-2">
          {data.notifications.map((n, i) => (
            <Alert key={i} tone={NOTIF_TONE[n.type]} className="flex items-center gap-2">
              <BellRing size={14} className="shrink-0" />
              {n.message}
            </Alert>
          ))}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Weight" subtitle="7-day trend, not single weigh-ins" />
          <CardBody>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-extrabold text-ink dark:text-neutral-100">{fmtNum(data.weight.current)} kg</p>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  Start {fmtNum(data.weight.start)} → Goal {fmtNum(data.weight.goal)}
                </p>
              </div>
              <Badge tone="green">{fmtNum(data.weight.totalLost, 1)} kg lost</Badge>
            </div>
            <div className="mt-4">
              <ProgressBar percent={data.weight.progressPct} />
              <div className="mt-1.5 flex justify-between text-[11px] text-neutral-400">
                <span>{fmtNum(data.weight.totalLost, 1)} kg down</span>
                <span>{data.weight.progressPct}% to goal</span>
                <span>{fmtNum(data.weight.remaining, 1)} kg to go</span>
              </div>
            </div>
            <Link to="/app/progress" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white">
              View progress <ChevronRight size={13} />
            </Link>
          </CardBody>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader title="Calories" subtitle="Today" action={<Link to="/app/profile" className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">Adjust target →</Link>} />
          <CardBody className="flex flex-col items-center gap-3">
            <CalorieRing consumed={data.calories.consumed} target={data.calories.target} />
            <div className="text-center">
              <p className="text-sm font-bold text-ink dark:text-neutral-100">
                {data.calories.remaining >= 0 ? `${fmtNum(data.calories.remaining)} kcal remaining` : `${Math.abs(data.calories.remaining)} kcal over target`}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Protein first, hit the rest with carbs and fat.</p>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader title="Macros" subtitle={`Today · target ${data.macros.protein.target}g P / ${data.macros.carbs.target}g C / ${data.macros.fat.target}g F`} />
          <CardBody className="space-y-4">
            <MacroRow label="Protein" consumed={data.macros.protein.consumed} target={data.macros.protein.target} />
            <MacroRow label="Carbs" consumed={data.macros.carbs.consumed} target={data.macros.carbs.target} />
            <MacroRow label="Fat" consumed={data.macros.fat.consumed} target={data.macros.fat.target} />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <TodayWorkoutCard workout={data.todayWorkout} />

        <Card>
          <CardHeader
            title="AI cut analysis"
            subtitle="Status from your 7-day weight trend"
            action={
              <Badge tone={status.tone}>
                <Sparkles size={11} /> {status.label}
              </Badge>
            }
          />
          <CardBody>
            <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{data.aiInsight.message}</p>
            <Link to="/app/progress" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white">
              Full analysis <ArrowRight size={13} />
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
