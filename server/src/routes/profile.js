import { Router } from 'express';
import { getStore } from '../lib/db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { profileInputSchema, profileUpdateSchema } from '../schemas.js';
import { calculateAll } from '../lib/calc.js';

const router = Router();

function mapProfileNumbers(profile) {
  return {
    ...profile,
    heightCm: Number(profile.heightCm),
    currentWeightKg: Number(profile.currentWeightKg),
    goalWeightKg: Number(profile.goalWeightKg),
    weeklyLossRateKg: Number(profile.weeklyLossRateKg)
  };
}

function targetsFromInput(input) {
  return calculateAll({
    age: input.age,
    sex: input.sex,
    heightCm: input.heightCm,
    weightKg: input.currentWeightKg,
    currentWeightKg: input.currentWeightKg,
    goalWeightKg: input.goalWeightKg,
    activityLevel: input.activityLevel,
    trainingFrequency: input.trainingFrequency,
    weeklyLossRateKg: input.weeklyLossRateKg,
    targetMonths: input.targetMonths
  });
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const profile = await getStore().profileFindByUserId(req.userId);
    if (!profile) return res.status(404).json({ error: 'Profile not found', code: 'PROFILE_REQUIRED' });
    res.json(mapProfileNumbers(profile));
  } catch (error) {
    next(error);
  }
});

router.post('/onboarding', requireAuth, validate(profileInputSchema), async (req, res, next) => {
  try {
    const existing = await getStore().profileFindByUserId(req.userId);
    if (existing) return res.status(409).json({ error: 'Profile already exists. Edit it on the profile page.' });
    const calc = targetsFromInput(req.body);
    const profile = await getStore().profileCreate({
      userId: req.userId,
      ...req.body,
      weeklyLossRateKg: calc.weeklyLossRateKg,
      dailyCalorieTarget: calc.dailyCalorieTarget,
      proteinTargetG: calc.proteinG,
      carbTargetG: calc.carbG,
      fatTargetG: calc.fatG
    });
    res.status(201).json({ profile: mapProfileNumbers(profile), targets: calc });
  } catch (error) {
    next(error);
  }
});

router.put('/', requireAuth, validate(profileUpdateSchema), async (req, res, next) => {
  try {
    const profile = await getStore().profileFindByUserId(req.userId);
    if (!profile) return res.status(404).json({ error: 'Profile not found', code: 'PROFILE_REQUIRED' });
    const merged = { ...profile, ...req.body };
    const calc = targetsFromInput(merged);

    const updated = await getStore().profileUpdate(req.userId, {
      ...req.body,
      weeklyLossRateKg: calc.weeklyLossRateKg,
      dailyCalorieTarget: calc.dailyCalorieTarget,
      proteinTargetG: calc.proteinG,
      carbTargetG: calc.carbG,
      fatTargetG: calc.fatG
    });

    if (getStore().aiCacheDelete) {
      await getStore().aiCacheDelete(req.userId);
    }

    res.json({ profile: mapProfileNumbers(updated), targets: calc });
  } catch (error) {
    next(error);
  }
});

export default router;
