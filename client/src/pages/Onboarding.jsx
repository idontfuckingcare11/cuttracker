import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AppContexts.jsx';
import { AuthLayout } from '../components/layout/AppLayout.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Alert } from '../components/ui/Alert.jsx';
import { ProgressBar } from '../components/ui/ProgressBar.jsx';
import { apiPost } from '../api/client.js';
import { calculateAll } from '../lib/calc.js';

const baseSchema = z.object({
  age: z.number().int().min(13, 'Age must be 13+').max(100),
  sex: z.enum(['male', 'female']),
  heightCm: z.number().positive('Required').max(250),
  currentWeightKg: z.number().positive('Required').max(400)
});

const goalSchema = z.object({
  goalWeightKg: z.number().positive('Required').max(400),
  trainingFrequency: z.number().int().min(0).max(7),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  weeklyLossRateKg: z.number().positive().max(2)
});

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const schema = step === 0 ? baseSchema : goalSchema;

  const { register, handleSubmit, watch, trigger, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { sex: 'male', trainingFrequency: 3, activityLevel: 'moderate', weeklyLossRateKg: 0.5 }
  });
  const values = watch();

  const preview = useMemo(() => {
    if (step === 0) return null;
    const required = values.currentWeightKg && values.goalWeightKg && values.heightCm && values.age;
    if (!required) return null;
    try {
      return calculateAll({
        age: values.age,
        sex: values.sex,
        heightCm: values.heightCm,
        weightKg: values.currentWeightKg,
        goalWeightKg: values.goalWeightKg,
        activityLevel: values.activityLevel,
        trainingFrequency: values.trainingFrequency,
        weeklyLossRateKg: values.weeklyLossRateKg
      });
    } catch {
      return null;
    }
  }, [values, step]);

  const next = async () => {
    const ok = await trigger();
    if (ok) setStep(1);
  };

  const onSubmit = async (data) => {
    const all = { ...values, ...data };
    try {
      await apiPost('/profile/onboarding', all);
      await refresh();
      navigate('/app');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthLayout>
      <div className="card-base p-6 sm:p-8">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Step {step + 1} of 2</p>
          <span className="text-xs font-semibold text-neutral-400">Your targets auto-generate</span>
        </div>
        <ProgressBar percent={(step + 1) * 50} size="sm" />
        <h1 className="mt-5 text-xl font-extrabold text-ink dark:text-neutral-100">{step === 0 ? 'About you' : 'Your cut, calibrated'}</h1>
        <p className="mb-6 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {step === 0 ? 'We use these to calculate your maintenance calories.' : "Set your goal and we'll compute your daily calories and macros."}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {step === 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <Input type="number" label="Age" placeholder="27" error={formState.errors.age?.message} {...register('age', { valueAsNumber: true })} />
              <Select label="Sex" options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} error={formState.errors.sex?.message} {...register('sex')} />
              <Input type="number" step="0.1" label="Height (cm)" placeholder="170" error={formState.errors.heightCm?.message} {...register('heightCm', { valueAsNumber: true })} />
              <Input type="number" step="0.1" label="Current weight (kg)" placeholder="71.9" error={formState.errors.currentWeightKg?.message} {...register('currentWeightKg', { valueAsNumber: true })} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Input type="number" step="0.1" label="Goal weight (kg)" placeholder="65" error={formState.errors.goalWeightKg?.message} {...register('goalWeightKg', { valueAsNumber: true })} />
              <Select label="Training (days/week)" options={[0, 1, 2, 3, 4, 5, 6, 7]} error={formState.errors.trainingFrequency?.message} {...register('trainingFrequency', { valueAsNumber: true })} />
              <Select label="Activity level" options={[
                { value: 'sedentary', label: 'Sedentary' },
                { value: 'light', label: 'Light (1–3 days)' },
                { value: 'moderate', label: 'Moderate (3–5 days)' },
                { value: 'active', label: 'Active (6–7 days)' },
                { value: 'very_active', label: 'Extremely active' }
              ]} error={formState.errors.activityLevel?.message} {...register('activityLevel')} className="col-span-2" />
              <Select label="Weekly weight-loss goal" options={[0.25, 0.5, 0.75, 1].map((v) => ({ value: v, label: `${v} kg/week` }))} error={formState.errors.weeklyLossRateKg?.message} {...register('weeklyLossRateKg', { valueAsNumber: true })} className="col-span-2" />
            </div>
          )}

          {step === 1 && preview ? (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Your daily plan</p>
              <div className="mt-2 flex flex-wrap gap-6">
                <div>
                  <p className="text-2xl font-extrabold text-ink dark:text-neutral-100">{preview.dailyCalorieTarget}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">kcal / day</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-ink dark:text-neutral-100">{preview.proteinG}g</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">protein</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-ink dark:text-neutral-100">{preview.carbG}g</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">carbs</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-ink dark:text-neutral-100">{preview.fatG}g</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">fat</p>
                </div>
              </div>
              {preview.deficitWarning ? <Alert tone="warning" className="mt-3">{preview.deficitWarning}</Alert> : null}
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="ghost" onClick={() => setStep(0)} className={step === 0 ? 'invisible' : ''}>
              <ArrowLeft size={15} /> Back
            </Button>
            {step === 0 ? (
              <Button type="button" onClick={next}>
                Continue <ArrowRight size={15} />
              </Button>
            ) : (
              <Button type="submit">Create my plan</Button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-600">
          Estimates only — not medical advice. Consult a professional before starting a diet.
        </p>
      </div>
    </AuthLayout>
  );
}
