import { config } from '../config.js';

const SYSTEM_PROMPT = `You are CutTrack's supportive fitness coach. You help someone who is on a calorie deficit ("a cut") while trying to preserve muscle.
Rules you must follow:
- Always be encouraging, practical, and non-alarmist.
- NEVER give medical advice or use diagnostic language ("you have...", "your body is...", "this indicates a medical condition").
- NEVER recommend extreme dieting, very large calorie cuts, fasting gimmicks, or unhealthy behaviors.
- If the user is losing weight too slowly, encourage them to verify food-tracking accuracy before reducing calories, and keep protein high.
- If losing too quickly, suggest a small, reasonable calorie increase (roughly 100-200 kcal) and keeping protein high.
- If on track, reinforce consistency and hitting protein targets.
- Keep responses to 2-4 short sentences.
- Reply with only a JSON object in this exact shape: {"message": "your text here"}.`;

function buildNumbers(input) {
  return {
    status: input.status,
    current_7d_average_kg: Number(input.currentAvgKg?.toFixed(2) ?? '?'),
    current_weekly_loss_rate_kg: Number(input.ratePerWeek?.toFixed(2) ?? '?'),
    expected_weekly_loss_rate_kg: input.expectedRateKg,
    daily_calorie_target: input.dailyCalorieTarget,
    avg_daily_calories_eaten_last_7_days: input.avgCaloriesEaten,
    calorie_adherence_percent: input.adherencePercent,
    goal_weight_kg: input.goalWeightKg,
    estimated_weeks_to_goal: input.estWeeksToGoal,
    days_of_data: input.entries
  };
}

function extractMessage(content) {
  if (!content) return null;
  const trimmed = content.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed.message === 'string' && parsed.message.trim()) {
      return parsed.message.trim().slice(0, 1000);
    }
  } catch {
    const match = trimmed.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (match) return match[1].replace(/\\n/g, ' ').slice(0, 1000);
  }
  if (trimmed.startsWith('{') || trimmed.length > 1000) return null;
  return trimmed.slice(0, 1000);
}

export function buildFallbackMessage(status, numbers) {
  const rate = numbers.ratePerWeek ?? 0;
  if (status === 'too_slow') {
    if (rate > 0) {
      return `You're losing about ${rate.toFixed(2)} kg/week, which is slower than your ${numbers.expectedRateKg} kg/week target. Before cutting calories further, double-check that every snack and drink is being logged — small tracking gaps hide real progress. Keep protein high to protect muscle.`;
    }
    return `Your weight hasn't decreased significantly over the last few weeks. Before reducing calories further, review your food-tracking accuracy first — make sure oils, drinks, and snacks are all logged. Keep protein high and stay consistent with training.`;
  }
  if (status === 'too_fast') {
    return `Your weight is dropping faster than intended (${rate.toFixed(2)} kg/week). Consider adding about 100–200 kcal back per day, mostly from carbs, so you hold onto muscle while you cut. Reassess after a week.`;
  }
  return `Your current rate of loss looks reasonable. Keep your calories unchanged, hit your protein target every day, and keep training hard — consistency is what gets you to ${numbers.goalWeightKg ?? 'your goal'} kg.`;
}

export async function generateCutInsight(input) {
  const numbers = buildNumbers(input);
  const fallback = { message: buildFallbackMessage(input.status, numbers), usedAI: false };

  if (!config.groq.apiKey) {
    return fallback;
  }

  const userPrompt = `The user's cut status has been classified by our deterministic engine as: ${input.status}.
Here are the exact numbers:
${JSON.stringify(numbers, null, 2)}

Write the 2-4 sentence coach message as JSON: {"message": "..."}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(config.groq.url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.groq.apiKey}`
      },
      body: JSON.stringify({
        model: config.groq.model,
        temperature: 0.7,
        max_tokens: 300,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ]
      })
    });
    clearTimeout(timer);

    if (!response.ok) {
      console.warn(`[ai] Groq responded ${response.status}: ${await response.text()}`);
      return fallback;
    }

    const data = await response.json();
    const message = extractMessage(data?.choices?.[0]?.message?.content);
    if (!message) return fallback;
    return { message, usedAI: true };
  } catch (error) {
    console.warn('[ai] Groq request failed, using fallback:', error.message);
    return fallback;
  }
}
