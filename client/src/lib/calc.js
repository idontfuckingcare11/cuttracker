export const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (desk job, little movement)', baseMultiplier: 1.2 },
  { value: 'light', label: 'Lightly active (light walks, casual movement)', baseMultiplier: 1.3 },
  { value: 'moderate', label: 'Moderately active (3–5 days/week)', baseMultiplier: 1.4 },
  { value: 'active', label: 'Very active (physical job or daily sport)', baseMultiplier: 1.55 },
  { value: 'very_active', label: 'Extremely active (physical job + heavy training)', baseMultiplier: 1.7 }
];

export const WEEKLY_LOSS_OPTIONS = [0.25, 0.5, 0.75, 1.0];

export const TARGET_MONTH_OPTIONS = [
  { value: 1, label: '1 month (~4 weeks) — ⛔ Extreme deficit' },
  { value: 2, label: '2 months (~9 weeks) — ⚠️ Aggressive' },
  { value: 3, label: '3 months (~13 weeks) — Moderate' },
  { value: 4, label: '4 months (~17 weeks) — Recommended' },
  { value: 5, label: '5 months (~22 weeks) — Recommended' },
  { value: 6, label: '6 months (~26 weeks) — Safe & steady' },
  { value: 8, label: '8 months (~35 weeks) — Safe & steady' },
  { value: 12, label: '12 months (~52 weeks) — Gradual' }
];

// MET-based training contribution: ~0.04 TDEE multiplier per training day/week
export function trainingMultiplier(trainingFrequency) {
  const days = Math.min(Math.max(Number(trainingFrequency) || 0, 0), 7);
  return days * 0.04;
}

export function activityBaseMultiplier(value) {
  const level = ACTIVITY_LEVELS.find((a) => a.value === value);
  return level ? level.baseMultiplier : 1.2;
}

// Combined TDEE multiplier = lifestyle base + training contribution
export function activityMultiplier(value, trainingFrequency = 0) {
  return activityBaseMultiplier(value) + trainingMultiplier(trainingFrequency);
}

export function bmr({ age, sex, weightKg, heightCm }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'female' ? base - 161 : base + 5;
}

export function calorieTarget(input) {
  const b = bmr(input);
  const tdee = b * activityMultiplier(input.activityLevel, input.trainingFrequency || 0);
  const target = tdee - (input.weeklyLossRateKg * 7700) / 7;
  return { bmr: Math.round(b), tdee: Math.round(tdee), dailyCalorieTarget: Math.max(1200, Math.round(target)) };
}

export function proteinFactor(trainingFrequency) {
  if (trainingFrequency >= 5) return 2.2;
  if (trainingFrequency >= 3) return 2.0;
  if (trainingFrequency >= 1) return 1.8;
  return 1.6;
}

export function macroTargets({ weightKg, dailyCalorieTarget, trainingFrequency }) {
  const p = Math.round(weightKg * proteinFactor(trainingFrequency));
  let f = Math.round(Math.max(0.25 * dailyCalorieTarget / 9, 0.6 * weightKg));
  const minF = Math.round(Math.max(0.6 * weightKg, (0.2 * dailyCalorieTarget) / 9));
  const target = dailyCalorieTarget;

  const residueFix = ((target - f) % 4 + 4) % 4;
  const candidate = f + residueFix;
  f = Math.abs(candidate - f) <= 2 || candidate - 4 < minF ? candidate : candidate - 4;
  if (f < minF) f = minF;

  let c = (target - p * 4 - f * 9) / 4;
  while (c < 0) {
    f -= 4;
    c = (target - p * 4 - f * 9) / 4;
  }

  const carbRounded = Math.round(c);
  const diff = target - (p * 4 + f * 9 + carbRounded * 4);
  return {
    proteinG: p,
    fatG: f,
    carbG: carbRounded + Math.round(diff / 4),
    proteinCalories: p * 4,
    fatCalories: f * 9,
    carbCalories: (carbRounded + Math.round(diff / 4)) * 4
  };
}

export function validateDeficit({ weightKg, weeklyLossRateKg, dailyCalorieTarget, targetMonths }) {
  const maxSafe = 0.01 * weightKg;
  const ratio = weeklyLossRateKg / maxSafe;

  if (dailyCalorieTarget < 1200 || ratio > 1.5) {
    return {
      ok: false,
      riskLevel: 'extreme',
      warning: `⛔ Extreme deficit — losing ${weeklyLossRateKg.toFixed(2)} kg/week (${(ratio * 100).toFixed(0)}% of safe limit) with only ${dailyCalorieTarget} kcal/day. This puts you at high risk of muscle loss, fatigue, and metabolic slowdown. We strongly recommend choosing 3+ months.`
    };
  }
  if (ratio > 1) {
    return {
      ok: false,
      riskLevel: 'aggressive',
      warning: `⚠️ Aggressive deficit — losing ${weeklyLossRateKg.toFixed(2)} kg/week is more than ~1% of your body weight (${maxSafe.toFixed(2)} kg/week safe limit). You may lose some muscle. Consider extending to ${targetMonths <= 2 ? '3–4' : (targetMonths + 1)} months for better results.`
    };
  }
  return { ok: true, riskLevel: 'safe' };
}

export function calculateAll(input) {
  let weeklyRate = Number(input.weeklyLossRateKg) || 0.5;
  const currentKg = Number(input.currentWeightKg || input.weightKg);
  const goalKg = Number(input.goalWeightKg);
  const months = Number(input.targetMonths);

  if (months > 0 && currentKg > 0 && goalKg > 0 && currentKg > goalKg) {
    const diffKg = currentKg - goalKg;
    const weeks = months * 4.33;
    weeklyRate = Math.max(0.1, Math.round((diffKg / weeks) * 100) / 100);
  }

  const effectiveInput = { ...input, weightKg: currentKg, weeklyLossRateKg: weeklyRate };
  const targets = calorieTarget(effectiveInput);
  const macros = macroTargets({ weightKg: currentKg, dailyCalorieTarget: targets.dailyCalorieTarget, trainingFrequency: input.trainingFrequency });
  const deficitCheck = validateDeficit({ weightKg: currentKg, weeklyLossRateKg: weeklyRate, dailyCalorieTarget: targets.dailyCalorieTarget, targetMonths: months });
  return {
    bmr: targets.bmr,
    tdee: targets.tdee,
    dailyCalorieTarget: targets.dailyCalorieTarget,
    dailyDeficitKcal: Math.round((weeklyRate * 7700) / 7),
    weeklyLossRateKg: weeklyRate,
    targetMonths: months > 0 ? months : Math.round(((currentKg - goalKg) / (weeklyRate * 4.33)) * 10) / 10,
    proteinG: macros.proteinG,
    carbG: macros.carbG,
    fatG: macros.fatG,
    riskLevel: deficitCheck.riskLevel,
    deficitWarning: deficitCheck.ok ? null : deficitCheck.warning
  };
}
