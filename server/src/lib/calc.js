export const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (little or no exercise)', multiplier: 1.2 },
  { value: 'light', label: 'Lightly active (1–3 days/week)', multiplier: 1.375 },
  { value: 'moderate', label: 'Moderately active (3–5 days/week)', multiplier: 1.55 },
  { value: 'active', label: 'Very active (6–7 days/week)', multiplier: 1.725 },
  { value: 'very_active', label: 'Extremely active (physical job + training)', multiplier: 1.9 }
];

export const WEEKLY_LOSS_OPTIONS = [0.25, 0.5, 0.75, 1.0];

export const KG_PER_KG_FAT = 7700;

export function activityMultiplier(value) {
  const level = ACTIVITY_LEVELS.find((a) => a.value === value);
  return level ? level.multiplier : 1.2;
}

export function bmr({ age, sex, weightKg, heightCm }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'female' ? base - 161 : base + 5;
}

export function tdee(bmrValue, activityValue) {
  return bmrValue * activityMultiplier(activityValue);
}

export function dailyDeficitKcal(weeklyLossKg) {
  return (weeklyLossKg * KG_PER_KG_FAT) / 7;
}

export function calorieTarget({ age, sex, heightCm, weightKg, activityLevel, weeklyLossRateKg }) {
  const bmrValue = bmr({ age, sex, heightCm, weightKg });
  const tdeeValue = tdee(bmrValue, activityLevel);
  const target = tdeeValue - dailyDeficitKcal(weeklyLossRateKg);
  return { bmr: Math.round(bmrValue), tdee: Math.round(tdeeValue), dailyCalorieTarget: Math.max(1200, Math.round(target)) };
}

export function proteinFactor(trainingFrequency) {
  if (trainingFrequency >= 5) return 2.2;
  if (trainingFrequency >= 3) return 2.0;
  if (trainingFrequency >= 1) return 1.8;
  return 1.6;
}

export function minFatGrams(weightKg, target) {
  return Math.max(0.6 * weightKg, 0.2 * target / 9);
}

export function plannedFatGrams(weightKg, target) {
  return Math.max(0.25 * target / 9, minFatGrams(weightKg, target));
}

export function macroTargets({ weightKg, dailyCalorieTarget, trainingFrequency }) {
  const p = Math.round(weightKg * proteinFactor(trainingFrequency));
  let f = Math.round(plannedFatGrams(weightKg, dailyCalorieTarget));
  const minF = Math.round(minFatGrams(weightKg, dailyCalorieTarget));
  const target = dailyCalorieTarget;

  const residueFix = ((target - f) % 4 + 4) % 4;
  const candidate = f + residueFix;
  if (Math.abs(candidate - f) <= 2 || candidate - 4 < minF) {
    f = candidate;
  } else {
    f = candidate - 4;
  }
  if (f < minF) f = minF;

  let c = (target - p * 4 - f * 9) / 4;
  while (c < 0) {
    f -= 4;
    c = (target - p * 4 - f * 9) / 4;
  }
  c = Math.round(c);

  const carbs = (target - p * 4 - f * 9) / 4;
  const carbRounded = Math.round(carbs);
  const used = p * 4 + f * 9 + carbRounded * 4;
  const diff = target - used;
  const finalCarbs = carbRounded + Math.round(diff / 4);

  return {
    proteinG: p,
    fatG: f,
    carbG: finalCarbs,
    proteinCalories: p * 4,
    fatCalories: f * 9,
    carbCalories: finalCarbs * 4
  };
}

export function validateDeficit({ weightKg, weeklyLossRateKg }) {
  const maxSafe = 0.01 * weightKg;
  const ratio = weeklyLossRateKg / maxSafe;
  if (ratio > 1) {
    return {
      ok: false,
      warning: `A loss rate of ${weeklyLossRateKg.toFixed(2)} kg/week is more than ~1% of your body weight (${maxSafe.toFixed(2)} kg/week). This aggressive a deficit risks losing muscle. We recommend extending your target timeframe.`
    };
  }
  return { ok: true };
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
  const macros = macroTargets({
    weightKg: currentKg,
    dailyCalorieTarget: targets.dailyCalorieTarget,
    trainingFrequency: input.trainingFrequency
  });
  const deficitCheck = validateDeficit({ weightKg: currentKg, weeklyLossRateKg: weeklyRate });
  return {
    bmr: targets.bmr,
    tdee: targets.tdee,
    dailyCalorieTarget: targets.dailyCalorieTarget,
    dailyDeficitKcal: Math.round(dailyDeficitKcal(weeklyRate)),
    weeklyLossRateKg: weeklyRate,
    targetMonths: months > 0 ? months : Math.round(((currentKg - goalKg) / (weeklyRate * 4.33)) * 10) / 10,
    proteinG: macros.proteinG,
    carbG: macros.carbG,
    fatG: macros.fatG,
    deficitWarning: deficitCheck.ok ? null : deficitCheck.warning
  };
}
