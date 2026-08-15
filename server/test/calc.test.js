import { describe, it, expect } from 'vitest';
import {
  bmr,
  tdee,
  calorieTarget,
  macroTargets,
  calculateAll,
  validateDeficit,
  activityMultiplier,
  proteinFactor
} from '../src/lib/calc.js';

describe('BMR (Mifflin-St Jeor)', () => {
  it('computes male BMR', () => {
    expect(bmr({ age: 27, sex: 'male', heightCm: 170, weightKg: 71.9 })).toBe(1651.5);
  });
  it('computes female BMR with -161 offset', () => {
    expect(bmr({ age: 27, sex: 'female', heightCm: 170, weightKg: 71.9 })).toBe(1485.5);
  });
});

describe('TDEE', () => {
  it('applies activity multiplier', () => {
    const base = bmr({ age: 27, sex: 'male', heightCm: 170, weightKg: 71.9 });
    expect(tdee(base, 'moderate')).toBeCloseTo(base * 1.55, 5);
  });
  it('maps unknown activity to sedentary', () => {
    expect(activityMultiplier('nope')).toBe(1.2);
  });
});

describe('calorieTarget', () => {
  it('subtracts the deficit implied by weekly loss rate', () => {
    const t = calorieTarget({ age: 27, sex: 'male', heightCm: 170, weightKg: 71.9, activityLevel: 'moderate', weeklyLossRateKg: 0.5 });
    expect(t.dailyCalorieTarget).toBe(Math.round(1651.5 * 1.55 - (0.5 * 7700) / 7));
  });
  it('never goes below the 1200 floor', () => {
    const t = calorieTarget({ age: 90, sex: 'female', heightCm: 150, weightKg: 40, activityLevel: 'sedentary', weeklyLossRateKg: 1 });
    expect(t.dailyCalorieTarget).toBeGreaterThanOrEqual(1200);
  });
});

describe('macroTargets', () => {
  it('prioritizes protein based on training frequency', () => {
    expect(proteinFactor(5)).toBe(2.2);
    expect(proteinFactor(3)).toBe(2.0);
    expect(proteinFactor(0)).toBe(1.6);
  });

  it('makes protein + carbs + fat calories exactly equal the calorie target', () => {
    for (const weightKg of [55, 65, 71.9, 90, 105]) {
      for (const target of [1400, 1650, 1850, 2010, 2400]) {
        for (const freq of [0, 2, 4, 6]) {
          const m = macroTargets({ weightKg, dailyCalorieTarget: target, trainingFrequency: freq });
          const sum = m.proteinG * 4 + m.carbG * 4 + m.fatG * 9;
          expect(sum).toBe(target);
          expect(m.proteinG).toBeGreaterThan(0);
          expect(m.carbG).toBeGreaterThanOrEqual(0);
          expect(m.fatG).toBeGreaterThan(0);
        }
      }
    }
  });

  it('keeps fat above the minimum floor', () => {
    const m = macroTargets({ weightKg: 80, dailyCalorieTarget: 1800, trainingFrequency: 4 });
    expect(m.fatG).toBeGreaterThanOrEqual(Math.round(0.6 * 80) - 4);
  });
});

describe('validateDeficit', () => {
  it('warns when loss rate exceeds ~1% bodyweight per week', () => {
    expect(validateDeficit({ weightKg: 70, weeklyLossRateKg: 1 }).ok).toBe(false);
  });
  it('allows a reasonable deficit', () => {
    expect(validateDeficit({ weightKg: 70, weeklyLossRateKg: 0.5 }).ok).toBe(true);
  });
});

describe('calculateAll', () => {
  it('returns a complete target bundle for the demo profile', () => {
    const r = calculateAll({ age: 27, sex: 'male', heightCm: 170, weightKg: 71.9, activityLevel: 'moderate', trainingFrequency: 5, weeklyLossRateKg: 0.5 });
    expect(r.dailyCalorieTarget).toBeGreaterThan(0);
    expect(r.proteinG * 4 + r.carbG * 4 + r.fatG * 9).toBe(r.dailyCalorieTarget);
    expect(r.deficitWarning).toBeNull();
  });
});
