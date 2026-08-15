import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildFallbackMessage, generateCutInsight } from '../src/lib/ai.js';

const numbers = { ratePerWeek: -0.5, expectedRateKg: 0.5, goalWeightKg: 65 };

describe('buildFallbackMessage', () => {
  it('encourages consistency when on track', () => {
    expect(buildFallbackMessage('on_track', numbers)).toMatch(/reasonable/i);
  });
  it('suggests tracking review before cutting more when too slow', () => {
    expect(buildFallbackMessage('too_slow', numbers)).toMatch(/tracking/i);
  });
  it('suggests a small calorie bump when too fast', () => {
    expect(buildFallbackMessage('too_fast', { ...numbers, ratePerWeek: -1.2 })).toMatch(/100|200/);
  });
  it('never recommends extreme cuts', () => {
    expect(buildFallbackMessage('too_slow', numbers)).not.toMatch(/500|1000|fasting|extreme/i);
  });
});

describe('generateCutInsight', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('falls back to a static message when no Groq key is set', async () => {
    vi.stubEnv('GROQ_API_KEY', '');
    const { generateCutInsight: gen } = await import('../src/lib/ai.js');
    const result = await gen({ status: 'on_track', ratePerWeek: -0.5, expectedRateKg: 0.5, currentAvgKg: 70, dailyCalorieTarget: 2000, avgCaloriesEaten: 1900, adherencePercent: 95, goalWeightKg: 65, estWeeksToGoal: 10, entries: 10 });
    expect(result.usedAI).toBe(false);
    expect(result.message).toBeTruthy();
  });

  it('falls back gracefully when Groq is unreachable', async () => {
    vi.stubEnv('GROQ_API_KEY', 'test-key');
    global.fetch = vi.fn(async () => ({ ok: false, status: 429, text: async () => 'rate limited' }));
    const { generateCutInsight: gen } = await import('../src/lib/ai.js');
    const result = await gen({ status: 'too_fast', ratePerWeek: -1.2, expectedRateKg: 0.5, currentAvgKg: 70, dailyCalorieTarget: 2000, avgCaloriesEaten: 1600, adherencePercent: 80, goalWeightKg: 65, estWeeksToGoal: 5, entries: 14 });
    expect(result.usedAI).toBe(false);
    expect(result.message).toMatch(/100|200|fast/i);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('parses a JSON message from Groq', async () => {
    vi.stubEnv('GROQ_API_KEY', 'test-key');
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"message": "Nice work staying consistent. Keep your calories where they are and hit your protein target."}' } }] })
    }));
    const { generateCutInsight: gen } = await import('../src/lib/ai.js');
    const result = await gen({ status: 'on_track', ratePerWeek: -0.5, expectedRateKg: 0.5, currentAvgKg: 70, dailyCalorieTarget: 2000, avgCaloriesEaten: 1900, adherencePercent: 95, goalWeightKg: 65, estWeeksToGoal: 10, entries: 10 });
    expect(result.usedAI).toBe(true);
    expect(result.message).toMatch(/protein target/i);
  });
});
