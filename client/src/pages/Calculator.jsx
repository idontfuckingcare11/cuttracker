import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calculator as CalcIcon, Check, AlertTriangle, Target } from 'lucide-react';
import { apiPut, apiGet } from '../api/client.js';
import { Card, CardHeader, CardBody } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Alert } from '../components/ui/Alert.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Select } from '../components/ui/Select.jsx';
import { ACTIVITY_LEVELS, WEEKLY_LOSS_OPTIONS, TARGET_MONTH_OPTIONS, calculateAll } from '../lib/calc.js';

const schema = z.object({
  age: z.number().int().min(13).max(100),
  sex: z.enum(['male', 'female']),
  heightCm: z.number().positive().max(250),
  currentWeightKg: z.number().positive().max(400),
  goalWeightKg: z.number().positive().max(400),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  trainingFrequency: z.number().int().min(0).max(7),
  weeklyLossRateKg: z.number().positive().max(2).optional(),
  targetMonths: z.number().positive().max(36).optional().nullable()
});

export default function Calculator() {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => apiGet('/profile') });
  const [saved, setSaved] = useState(false);

  const { register, watch, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      age: profile?.age ?? 27,
      sex: profile?.sex ?? 'male',
      heightCm: profile?.heightCm ?? 170,
      currentWeightKg: profile?.currentWeightKg ?? 71.9,
      goalWeightKg: profile?.goalWeightKg ?? 65,
      activityLevel: profile?.activityLevel ?? 'moderate',
      trainingFrequency: profile?.trainingFrequency ?? 3,
      weeklyLossRateKg: profile?.weeklyLossRateKg ?? 0.5,
      targetMonths: profile?.targetMonths ?? 3
    }
  });
  const values = watch();

  const result = useMemo(() => {
    try {
      return calculateAll({ ...values, weightKg: values.currentWeightKg });
    } catch {
      return null;
    }
  }, [values]);

  const saveMutation = useMutation({
    mutationFn: (body) => apiPut('/profile', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Calorie & macro calculator</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink dark:text-neutral-100">Build your daily numbers</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Your inputs" subtitle="Mifflin-St Jeor BMR · AI calculated target deficit" />
          <CardBody>
            <form onSubmit={handleSubmit(() => {})} className="grid grid-cols-2 gap-4">
              <Input type="number" label="Age" {...register('age', { valueAsNumber: true })} />
              <Select label="Sex" options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} {...register('sex')} />
              <Input type="number" step="0.1" label="Height (cm)" {...register('heightCm', { valueAsNumber: true })} />
              <Input type="number" step="0.1" label="Current weight (kg)" {...register('currentWeightKg', { valueAsNumber: true })} />
              <Input type="number" step="0.1" label="Goal weight (kg)" {...register('goalWeightKg', { valueAsNumber: true })} />
              <Select label="Training (days/week)" options={[0, 1, 2, 3, 4, 5, 6, 7]} {...register('trainingFrequency', { valueAsNumber: true })} />
              <Select label="Activity level" options={ACTIVITY_LEVELS} {...register('activityLevel')} className="col-span-2" />
              <Select label="Target Timeframe (Months to Goal)" options={TARGET_MONTH_OPTIONS} {...register('targetMonths', { valueAsNumber: true })} className="col-span-1" />
              <Select label="Weekly weight-loss pace" options={WEEKLY_LOSS_OPTIONS.map((v) => ({ value: v, label: `${v} kg/week` }))} {...register('weeklyLossRateKg', { valueAsNumber: true })} className="col-span-1" />
            </form>
          </CardBody>
        </Card>

        {result ? (
          <div className="space-y-4">
            <Card>
              <CardHeader
                title="Your daily targets"
                action={
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <CalcIcon size={12} /> AI Analyzed
                  </span>
                }
              />
              <CardBody className="space-y-4">
                <div className="rounded-2xl bg-neutral-900 p-5 text-center text-white dark:bg-white dark:text-neutral-900">
                  <p className="text-xs font-medium uppercase tracking-widest opacity-60">Daily Calorie Target</p>
                  <p className="mt-1 text-4xl font-extrabold">{result.dailyCalorieTarget.toLocaleString()}</p>
                  <p className="text-xs opacity-60">kcal · {result.dailyDeficitKcal} kcal deficit · BMR {result.bmr} · TDEE {result.tdee}</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-300">
                  <div className="flex items-center gap-2">
                    <Target size={15} className="text-neutral-500 dark:text-neutral-400" />
                    <span>
                      Goal: <strong className="text-ink dark:text-neutral-100">{values.currentWeightKg ?? '—'} kg → {values.goalWeightKg ?? '—'} kg</strong>
                    </span>
                  </div>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ~{result.targetMonths} mo ({result.weeklyLossRateKg} kg/wk pace)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-neutral-50 p-4 text-center dark:bg-neutral-800/60">
                    <p className="text-2xl font-extrabold text-ink dark:text-neutral-100">{result.proteinG}<span className="text-xs font-medium text-neutral-400">g</span></p>
                    <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Protein</p>
                    <p className="text-[10px] text-neutral-400">{result.proteinG * 4} kcal</p>
                  </div>
                  <div className="rounded-xl bg-neutral-50 p-4 text-center dark:bg-neutral-800/60">
                    <p className="text-2xl font-extrabold text-ink dark:text-neutral-100">{result.carbG}<span className="text-xs font-medium text-neutral-400">g</span></p>
                    <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Carbs</p>
                    <p className="text-[10px] text-neutral-400">{result.carbG * 4} kcal</p>
                  </div>
                  <div className="rounded-xl bg-neutral-50 p-4 text-center dark:bg-neutral-800/60">
                    <p className="text-2xl font-extrabold text-ink dark:text-neutral-100">{result.fatG}<span className="text-xs font-medium text-neutral-400">g</span></p>
                    <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Fat</p>
                    <p className="text-[10px] text-neutral-400">{result.fatG * 9} kcal</p>
                  </div>
                </div>
                <p className="text-center text-xs text-neutral-400">
                  {result.proteinG * 4} + {result.carbG * 4} + {result.fatG * 9} = {result.proteinG * 4 + result.carbG * 4 + result.fatG * 9} kcal ✓
                </p>
                {result.deficitWarning ? (
                  <Alert tone="warning" className="flex items-start gap-2">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    {result.deficitWarning}
                  </Alert>
                ) : null}
                <Button className="w-full" onClick={() => saveMutation.mutate(values)} loading={saveMutation.isPending}>
                  {saved ? (<><Check size={15} /> Saved as your targets</>) : 'Use these as my targets'}
                </Button>
              </CardBody>
            </Card>
            <p className="text-center text-[11px] text-neutral-400 dark:text-neutral-600">These are estimates to guide nutrition, not medical advice.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
