import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, LogOut, ShieldAlert, Check, AlertTriangle } from 'lucide-react';
import { apiGet, apiPut } from '../api/client.js';
import { useAuth } from '../context/AppContexts.jsx';
import { Card, CardHeader, CardBody } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Alert } from '../components/ui/Alert.jsx';
import { ProfileFields } from '../components/forms/ProfileFields.jsx';
import { Loading } from '../components/ui/Loading.jsx';
import { calculateAll } from '../lib/calc.js';

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

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data: profile, isLoading } = useQuery({ queryKey: ['profile'], queryFn: () => apiGet('/profile') });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (profile) {
      const cur = Number(profile.currentWeightKg);
      const goal = Number(profile.goalWeightKg);
      const rate = Number(profile.weeklyLossRateKg) || 0.5;
      const defaultMonths = cur > goal ? Math.max(1, Math.round(((cur - goal) / (rate * 4.33)))) : 3;

      reset({
        age: profile.age,
        sex: profile.sex,
        heightCm: Number(profile.heightCm),
        currentWeightKg: cur,
        goalWeightKg: goal,
        activityLevel: profile.activityLevel,
        trainingFrequency: profile.trainingFrequency,
        weeklyLossRateKg: rate,
        targetMonths: profile.targetMonths ? Number(profile.targetMonths) : defaultMonths
      });
    }
  }, [profile, reset]);

  const values = watch();

  const liveResult = useMemo(() => {
    const age = Number(values.age) || Number(profile?.age) || 27;
    const sex = values.sex || profile?.sex || 'male';
    const heightCm = Number(values.heightCm) || Number(profile?.heightCm) || 170;
    const currentWeightKg = Number(values.currentWeightKg) || Number(profile?.currentWeightKg) || 71.9;
    const goalWeightKg = Number(values.goalWeightKg) || Number(profile?.goalWeightKg) || 65;
    const activityLevel = values.activityLevel || profile?.activityLevel || 'moderate';
    const trainingFrequency = values.trainingFrequency ?? profile?.trainingFrequency ?? 5;
    const targetMonths = Number(values.targetMonths) || Number(profile?.targetMonths) || 3;
    const weeklyLossRateKg = Number(values.weeklyLossRateKg) || Number(profile?.weeklyLossRateKg) || 0.5;

    try {
      return calculateAll({
        age,
        sex,
        heightCm,
        currentWeightKg,
        goalWeightKg,
        activityLevel,
        trainingFrequency,
        targetMonths,
        weeklyLossRateKg
      });
    } catch {
      return null;
    }
  }, [values, profile]);

  const saveMutation = useMutation({
    mutationFn: (body) => apiPut('/profile', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  });

  if (isLoading) return <Loading />;

  const currentKg = Number(values.currentWeightKg || profile?.currentWeightKg) || 0;
  const goalKg = Number(values.goalWeightKg || profile?.goalWeightKg) || 0;
  const diffKg = Math.max(0, currentKg - goalKg);
  const targetMonths = liveResult?.targetMonths || Number(values.targetMonths || profile?.targetMonths) || 3;
  const estWeeks = targetMonths > 0 ? Math.round(targetMonths * 4.33 * 10) / 10 : 13;
  const calcWeeklyRate = liveResult?.weeklyLossRateKg ? liveResult.weeklyLossRateKg.toFixed(2) : '0.50';

  const dailyCalorieTarget = liveResult?.dailyCalorieTarget ?? profile?.dailyCalorieTarget ?? 2000;
  const proteinTargetG = liveResult?.proteinG ?? profile?.proteinTargetG ?? 150;
  const carbTargetG = liveResult?.carbG ?? profile?.carbTargetG ?? 200;
  const fatTargetG = liveResult?.fatG ?? profile?.fatTargetG ?? 60;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Profile</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink dark:text-neutral-100">Your plan, in one place</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Edit your details" subtitle="Changing anything recalculates your calorie and macro targets" />
          <CardBody>
            <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-5">
              <ProfileFields register={register} errors={errors} />
              <div className="flex items-center justify-between gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                <p className="text-xs text-neutral-400">Signed in as <span className="font-semibold text-neutral-600 dark:text-neutral-300">{user?.email}</span></p>
                <Button type="submit" loading={isSubmitting}>
                  {saved ? (<><Check size={15} /> Saved</>) : (<><Save size={15} /> Save changes</>)}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Your Cut Plan & Targets" subtitle="Calculated from your BMR, activity level & target duration" />
            <CardBody className="space-y-4">
              {diffKg > 0 ? (
                <div className={`rounded-xl border p-3.5 ${
                  liveResult?.riskLevel === 'extreme'
                    ? 'border-red-300/60 bg-red-50/80 dark:border-red-800/40 dark:bg-red-950/30'
                    : liveResult?.riskLevel === 'aggressive'
                      ? 'border-amber-300/60 bg-amber-50/80 dark:border-amber-800/40 dark:bg-amber-950/30'
                      : 'border-emerald-200/60 bg-emerald-50/80 dark:border-emerald-800/40 dark:bg-emerald-950/30'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`text-xs font-semibold ${
                      liveResult?.riskLevel === 'extreme' ? 'text-red-800 dark:text-red-300'
                        : liveResult?.riskLevel === 'aggressive' ? 'text-amber-800 dark:text-amber-300'
                          : 'text-emerald-800 dark:text-emerald-300'
                    }`}>
                      🎯 Target: {currentKg} kg → {goalKg} kg (-{diffKg.toFixed(1)} kg cut)
                    </span>
                    <div className="flex items-center gap-1.5">
                      {liveResult?.riskLevel === 'extreme' ? (
                        <span className="rounded-full bg-red-200/70 px-2 py-0.5 text-[10px] font-bold text-red-900 dark:bg-red-800 dark:text-red-100">
                          ⛔ EXTREME
                        </span>
                      ) : liveResult?.riskLevel === 'aggressive' ? (
                        <span className="rounded-full bg-amber-200/70 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                          ⚠️ AGGRESSIVE
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-200/70 px-2 py-0.5 text-[10px] font-bold text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100">
                          ✅ SAFE
                        </span>
                      )}
                      <span className="rounded-full bg-neutral-200/70 px-2 py-0.5 text-[10px] font-bold text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
                        ~{targetMonths} {targetMonths === 1 ? 'mo' : 'mos'} ({estWeeks} wks)
                      </span>
                    </div>
                  </div>
                  <p className={`mt-1 text-[11px] ${
                    liveResult?.riskLevel === 'extreme' ? 'text-red-700/90 dark:text-red-400'
                      : liveResult?.riskLevel === 'aggressive' ? 'text-amber-700/90 dark:text-amber-400'
                        : 'text-emerald-700/90 dark:text-emerald-400'
                  }`}>
                    Target pace of <strong>~{calcWeeklyRate} kg/week</strong>. Stick to your <strong>{dailyCalorieTarget} kcal/day</strong> target to reach {goalKg} kg in ~{targetMonths} {targetMonths === 1 ? 'month' : 'months'}.
                  </p>
                </div>
              ) : null}

              {liveResult?.deficitWarning ? (
                <div className={`rounded-xl p-3.5 text-xs font-medium ${
                  liveResult.riskLevel === 'extreme'
                    ? 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                }`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    <span>{liveResult.deficitWarning}</span>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900/60">
                  <p className="text-xl font-extrabold text-ink dark:text-neutral-100">{dailyCalorieTarget}</p>
                  <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">kcal / day</p>
                </div>
                <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900/60">
                  <p className="text-xl font-extrabold text-ink dark:text-neutral-100">{proteinTargetG}g</p>
                  <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">protein</p>
                </div>
                <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900/60">
                  <p className="text-xl font-extrabold text-ink dark:text-neutral-100">{carbTargetG}g</p>
                  <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">carbs</p>
                </div>
                <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900/60">
                  <p className="text-xl font-extrabold text-ink dark:text-neutral-100">{fatTargetG}g</p>
                  <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">fat</p>
                </div>
              </div>

              {liveResult?.dailyDeficitKcal ? (
                <p className="text-center text-[11px] text-neutral-400">
                  Daily deficit: <strong className="text-neutral-600 dark:text-neutral-300">{liveResult.dailyDeficitKcal} kcal</strong> below your TDEE of {liveResult.tdee} kcal
                </p>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Account" />
            <CardBody className="space-y-3">
              <Alert tone="info" className="flex items-start gap-2">
                <ShieldAlert size={15} className="mt-0.5 shrink-0" />
                <span>
                  Calorie, macro and AI estimates are for fitness guidance only — not medical advice. If you have a health condition, talk to a professional first.
                </span>
              </Alert>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => navigate('/forgot-password')}>
                  Reset password
                </Button>
                <Button
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                >
                  <LogOut size={15} /> Log out
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
