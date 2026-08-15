import { todayKey, daysAgoKey, toDateKey } from '../lib/date.js';
import {
  current7dAvg,
  weeklyLossRate,
  classifyCut,
  estimateWeeksToGoal,
  sumByDay,
  average
} from '../lib/trends.js';
import { generateCutInsight, buildFallbackMessage } from '../lib/ai.js';

function parseKeyMs(key) {
  if (!key) return 0;
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

export async function getCutInsight({ store, userId, profile }) {
  const weights = await store.weightList(userId);
  const entries = await store.entryListBetween(userId, daysAgoKey(13), todayKey());

  const currentAvg = current7dAvg(weights);
  const rate = weeklyLossRate(weights);
  const classification = classifyCut({
    weeklyLossRateKg: rate,
    expectedRateKg: profile.weeklyLossRateKg,
    currentWeightKg: profile.currentWeightKg
  });

  if (classification.needsMoreData) {
    return {
      status: 'on_track',
      needsMoreData: true,
      usedAI: false,
      cached: false,
      message: `Log your weight at least 2–3 times a week to see your true trend. We need a few weeks of data before we can judge how your cut is going.`
    };
  }

  const perDay = sumByDay(entries, 'loggedDate', 'calories');
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const key = daysAgoKey(i);
    if (perDay[key] !== undefined) days.push(perDay[key]);
  }
  const avgCalories = days.length ? Math.round(average(days)) : null;
  const target = profile.dailyCalorieTarget;
  const adherencePercent = avgCalories !== null ? Math.round((avgCalories / target) * 100) : null;
  const estWeeksToGoal = currentAvg !== null ? estimateWeeksToGoal(currentAvg, profile.goalWeightKg, Math.abs(rate ?? 0)) : null;

  const input = {
    status: classification.status,
    currentAvgKg: currentAvg,
    ratePerWeek: rate,
    expectedRateKg: profile.weeklyLossRateKg,
    dailyCalorieTarget: target,
    avgCaloriesEaten: avgCalories,
    adherencePercent,
    goalWeightKg: profile.goalWeightKg,
    estWeeksToGoal,
    entries: entries.length
  };

  const cache = await store.aiCacheGet(userId);
  const now = new Date();
  if (cache && new Date(cache.expiresAt).getTime() > now.getTime()) {
    const generatedLocalKey = toDateKey(new Date(cache.generatedAt));
    const lastDataMs = Math.max(
      parseKeyMs(weights.length ? weights[weights.length - 1].loggedDate : ''),
      parseKeyMs(entries.length ? entries[entries.length - 1].loggedDate : '')
    );
    if (generatedLocalKey === todayKey() && lastDataMs <= parseKeyMs(generatedLocalKey)) {
      return { status: cache.status, message: cache.message, usedAI: false, cached: true, needsMoreData: false };
    }
  }

  const result = await generateCutInsight(input);

  const expiresAt = new Date(now);
  expiresAt.setHours(23, 59, 59, 999);
  await store.aiCacheSet({
    userId,
    status: classification.status,
    message: result.message,
    generatedAt: now,
    expiresAt
  });

  return { status: classification.status, message: result.message, usedAI: result.usedAI, cached: false, needsMoreData: false };
}

export async function cutAnalysis(store, userId, profile) {
  const weights = await store.weightList(userId);
  const insight = await getCutInsight({ store, userId, profile });
  const currentAvg = current7dAvg(weights);
  const rate = weeklyLossRate(weights);
  return {
    status: insight.status,
    currentAvgKg: currentAvg ? Math.round(currentAvg * 100) / 100 : null,
    weeklyLossKg: rate !== null ? Math.round(rate * 100) / 100 : null,
    message: insight.message,
    usedAI: insight.usedAI,
    cached: insight.cached,
    needsMoreData: insight.needsMoreData || false,
    fallbackMessage: buildFallbackMessage(insight.status, { ratePerWeek: rate, expectedRateKg: profile.weeklyLossRateKg, goalWeightKg: profile.goalWeightKg })
  };
}
