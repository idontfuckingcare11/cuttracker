import { describe, it, expect } from 'vitest';
import {
  rollingAverageSeries,
  current7dAvg,
  weeklyLossRate,
  classifyCut,
  estimateWeeksToGoal,
  daysBetween
} from '../src/lib/trends.js';

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function buildWeightSeries(weightPerDay) {
  return Object.entries(weightPerDay).map(([loggedDate, weightKg]) => ({ loggedDate, weightKg }));
}

describe('daysBetween', () => {
  it('counts day distance', () => {
    expect(daysBetween(daysAgo(7), daysAgo(0))).toBe(7);
  });
});

describe('rollingAverageSeries', () => {
  it('computes a 7-day rolling average for each point', () => {
    const series = buildWeightSeries({
      [daysAgo(2)]: 71,
      [daysAgo(1)]: 70.5,
      [daysAgo(0)]: 70.5
    });
    const rolled = rollingAverageSeries(series);
    const last = rolled[rolled.length - 1];
    expect(last.avg7).toBeCloseTo(70.6667, 2);
  });
});

describe('current7dAvg / weeklyLossRate', () => {
  it('compares two 7-day windows to estimate loss per week', () => {
    const entries = [];
    for (let i = 13; i >= 0; i--) entries.push({ loggedDate: daysAgo(i), weightKg: 71 + i * 0.1 });
    const rate = weeklyLossRate(entries);
    expect(rate).toBeCloseTo(-0.7, 1);
  });

  it('returns null with fewer than 2 entries', () => {
    expect(weeklyLossRate(buildWeightSeries({ [daysAgo(0)]: 70 }))).toBeNull();
  });
});

describe('classifyCut', () => {
  const opts = { expectedRateKg: 0.5, currentWeightKg: 70 };
  it('on track when close to expected rate', () => {
    expect(classifyCut({ ...opts, weeklyLossRateKg: -0.5 }).status).toBe('on_track');
  });
  it('too slow when loss is well below target', () => {
    expect(classifyCut({ ...opts, weeklyLossRateKg: -0.1 }).status).toBe('too_slow');
  });
  it('too slow when gaining', () => {
    expect(classifyCut({ ...opts, weeklyLossRateKg: 0.3 }).status).toBe('too_slow');
  });
  it('too fast when loss exceeds ~1% bodyweight', () => {
    expect(classifyCut({ ...opts, weeklyLossRateKg: -1.1 }).status).toBe('too_fast');
  });
  it('flags missing data', () => {
    expect(classifyCut({ ...opts, weeklyLossRateKg: null }).needsMoreData).toBe(true);
  });
});

describe('estimateWeeksToGoal', () => {
  it('estimates time to goal', () => {
    expect(estimateWeeksToGoal(70, 65, 0.5)).toBe(10);
  });
  it('returns 0 when goal reached', () => {
    expect(estimateWeeksToGoal(64, 65, 0.5)).toBe(0);
  });
  it('returns null when trend is flat', () => {
    expect(estimateWeeksToGoal(70, 65, 0)).toBeNull();
  });
});
