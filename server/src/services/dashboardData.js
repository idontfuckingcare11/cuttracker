import { todayKey, daysAgoKey, clampDateKey } from '../lib/date.js';
import { current7dAvg, weeklyLossRate, buildWeightSeriesForChart, sumByDay, estimateWeeksToGoal } from '../lib/trends.js';
import { getCutInsight } from './cutAnalysis.js';

function round1(v) {
  return v === null || v === undefined ? null : Math.round(v * 10) / 10;
}

export async function nutritionSummary(store, userId, fromKey, toKey) {
  const entries = await store.entryListBetween(userId, fromKey, toKey);
  const perDay = {};
  for (const e of entries) {
    if (!perDay[e.loggedDate]) perDay[e.loggedDate] = { calories: 0, protein: 0, carbs: 0, fat: 0, meals: {} };
    const day = perDay[e.loggedDate];
    day.calories += e.calories;
    day.protein += e.proteinG;
    day.carbs += e.carbsG;
    day.fat += e.fatG;
  }
  return perDay;
}

export function weightStatsFromEntries(weights, goalWeightKg) {
  if (!weights.length) {
    return { start: null, current: null, goal: goalWeightKg, totalLost: null, remaining: null, progressPct: 0, weeklyAvgLoss: null };
  }
  const start = Number(weights[0].weightKg);
  const current = current7dAvg(weights) ?? Number(weights[weights.length - 1].weightKg);
  const totalLost = start - current;
  const remaining = current - goalWeightKg;
  const startToGoal = start - goalWeightKg;
  const progressPct = startToGoal > 0 ? Math.min(100, Math.max(0, (totalLost / startToGoal) * 100)) : totalLost > 0 ? 100 : 0;
  const weeklyAvgLoss = weeklyLossRate(weights);
  return { start: round1(start), current: round1(current), goal: goalWeightKg, totalLost: round1(totalLost), remaining: round1(remaining), progressPct: Math.round(progressPct * 10) / 10, weeklyAvgLoss: weeklyAvgLoss !== null ? round1(weeklyAvgLoss) : null };
}

function buildNotifications({ consumed, targets, insight, weights }) {
  const notes = [];
  const remaining = targets.calorie - consumed.calories;
  if (consumed.calories > 0 && remaining > 0 && remaining <= targets.calorie * 0.15) {
    notes.push({ type: 'info', message: "You're close to your calorie target for today." });
  }
  if (consumed.protein >= targets.protein) {
    notes.push({ type: 'success', message: 'Protein target reached. Nice work.' });
  }
  if (insight && insight.status === 'too_fast') {
    notes.push({ type: 'warning', message: 'Your recent weight trend is dropping faster than intended.' });
  }
  const lastWeight = weights.length ? weights[weights.length - 1].loggedDate : null;
  if (!lastWeight || lastWeight < daysAgoKey(7)) {
    notes.push({ type: 'info', message: "You haven't logged your weight recently. A quick weigh-in keeps your trend accurate." });
  }
  return notes;
}

export async function buildDashboardData({ store, userId, profile, date }) {
  const today = date || todayKey();
  const entries = await store.entryListByDate(userId, today);
  const weights = await store.weightList(userId);
  const workouts = await store.workoutList(userId);

  const consumed = entries.reduce(
    (acc, e) => {
      acc.calories += e.calories;
      acc.protein += e.proteinG;
      acc.carbs += e.carbsG;
      acc.fat += e.fatG;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  consumed.protein = round1(consumed.protein);
  consumed.carbs = round1(consumed.carbs);
  consumed.fat = round1(consumed.fat);

  const targets = {
    calorie: profile.dailyCalorieTarget,
    protein: profile.proteinTargetG,
    carbs: profile.carbTargetG,
    fat: profile.fatTargetG
  };

  const remaining = targets.calorie - consumed.calories;

  const sortedWorkouts = [...workouts].sort((a, b) => b.workoutDate.localeCompare(a.workoutDate));
  const exactToday = sortedWorkouts.find((w) => w.workoutDate === today);
  const latestWorkout = sortedWorkouts[0] || null;
  const todayWorkout = exactToday
    ? { ...exactToday, exerciseCount: (exactToday.exercises || []).length }
    : latestWorkout
      ? { ...latestWorkout, exerciseCount: (latestWorkout.exercises || []).length, isLatest: true }
      : null;

  const insight = await getCutInsight({ store, userId, profile });
  const notifications = buildNotifications({ consumed, targets, insight, weights });

  return {
    date: today,
    profile: {
      ...profile,
      heightCm: Number(profile.heightCm),
      currentWeightKg: Number(profile.currentWeightKg),
      goalWeightKg: Number(profile.goalWeightKg),
      weeklyLossRateKg: Number(profile.weeklyLossRateKg)
    },
    calories: {
      target: targets.calorie,
      consumed: consumed.calories,
      remaining,
      percent: targets.calorie > 0 ? Math.min(100, Math.round((consumed.calories / targets.calorie) * 100)) : 0
    },
    macros: {
      protein: { target: targets.protein, consumed: consumed.protein, percent: Math.min(100, Math.round((consumed.protein / Math.max(1, targets.protein)) * 100)) },
      carbs: { target: targets.carbs, consumed: consumed.carbs, percent: Math.min(100, Math.round((consumed.carbs / Math.max(1, targets.carbs)) * 100)) },
      fat: { target: targets.fat, consumed: consumed.fat, percent: Math.min(100, Math.round((consumed.fat / Math.max(1, targets.fat)) * 100)) }
    },
    weight: weightStatsFromEntries(weights, profile.goalWeightKg),
    todayWorkout: todayWorkout
      ? {
          id: todayWorkout.id,
          name: todayWorkout.name,
          workoutDate: todayWorkout.workoutDate,
          durationMinutes: todayWorkout.durationMinutes,
          caloriesBurned: todayWorkout.caloriesBurned,
          notes: todayWorkout.notes,
          exerciseCount: todayWorkout.exercises.length,
          exercises: todayWorkout.exercises,
          completed: true
        }
      : null,
    aiInsight: {
      status: insight.status,
      message: insight.message,
      usedAI: insight.usedAI,
      cached: insight.cached,
      needsMoreData: insight.needsMoreData
    },
    notifications
  };
}

export async function buildProgressData({ store, userId, profile }) {
  const today = todayKey();
  const weights = await store.weightList(userId);
  const workouts = await store.workoutList(userId);
  const entries = await store.entryListBetween(userId, daysAgoKey(27), today);
  const perDay = sumByDay(entries, 'loggedDate', 'calories');
  const proteinPerDay = sumByDay(entries, 'loggedDate', 'proteinG');
  const target = profile.dailyCalorieTarget;

  const weightChart = buildWeightSeriesForChart(weights);

  const last30 = [];
  for (let i = 27; i >= 0; i--) {
    const key = daysAgoKey(i);
    last30.push({
      date: key,
      calories: Math.round(perDay[key] ?? 0),
      target,
      protein: Math.round((proteinPerDay[key] ?? 0) * 10) / 10,
      proteinTarget: profile.proteinTargetG
    });
  }

  const weekly = [];
  for (let weekOffset = 7; weekOffset >= 0; weekOffset--) {
    const startKey = clampDateKey(daysAgoKey((weekOffset + 1) * 7 - 1), daysAgoKey(60), today);
    const endKey = clampDateKey(daysAgoKey(weekOffset * 7), daysAgoKey(60), today);
    const weekWorkouts = workouts.filter((w) => w.workoutDate >= startKey && w.workoutDate <= endKey);
    weekly.push({
      week: endKey,
      count: weekWorkouts.length,
      volume: Math.round(weekWorkouts.reduce((sum, w) => sum + w.exercises.reduce((s, e) => s + e.sets * e.reps * Number(e.weightKg), 0), 0))
    });
  }

  const stats = weightStatsFromEntries(weights, profile.goalWeightKg);
  const rate = stats.weeklyAvgLoss !== null && stats.weeklyAvgLoss < 0 ? Math.abs(stats.weeklyAvgLoss) : stats.weeklyAvgLoss ?? 0;
  const estWeeksToGoal = stats.current !== null ? estimateWeeksToGoal(stats.current, profile.goalWeightKg, rate) : null;

  return {
    stats: {
      ...stats,
      estWeeksToGoal,
      totalWorkouts: workouts.length,
      workoutsThisMonth: workouts.filter((w) => w.workoutDate >= daysAgoKey(30)).length,
      avgWorkoutsPerWeek: Math.round((workouts.length / 7) * 10) / 10
    },
    charts: { weight: weightChart, calories: last30, protein: last30.map((d) => ({ date: d.date, grams: d.protein, target: d.proteinTarget })), workoutFreq: weekly }
  };
}
