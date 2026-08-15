import { Router } from 'express';
import { getStore } from '../lib/db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { workoutSchema, workoutUpdateSchema } from '../schemas.js';

const router = Router();

function e1rm(weightKg, reps) {
  return Number(weightKg) * (1 + reps / 30);
}

async function computePRs(store, userId, exercises, excludeWorkoutId) {
  const workouts = await store.workoutList(userId);
  const best = {};
  for (const w of workouts) {
    if (excludeWorkoutId && w.id === excludeWorkoutId) continue;
    for (const e of w.exercises) {
      const key = e.exerciseName.trim().toLowerCase();
      const value = e1rm(e.weightKg, e.reps);
      if (!best[key] || value > best[key]) best[key] = value;
    }
  }
  return (exercises || []).map((ex) => {
    const key = ex.exerciseName.trim().toLowerCase();
    const value = e1rm(ex.weightKg ?? ex.weight ?? 0, ex.reps);
    return { ...ex, isPr: value > 0 && (!best[key] || value > best[key]) };
  });
}

import { generateWorkoutProgram } from '../services/workoutGenerator.js';

router.post('/suggest', requireAuth, async (req, res, next) => {
  try {
    const { targetMuscles, audience, fitnessLevel } = req.body;
    const program = await generateWorkoutProgram({
      targetMuscles: targetMuscles || 'Chest & Back',
      audience: audience || 'mens',
      fitnessLevel: fitnessLevel || 'intermediate'
    });
    res.json({ program });
  } catch (error) {
    next(error);
  }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const workouts = await getStore().workoutList(req.userId);
    res.json({ workouts });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, validate(workoutSchema), async (req, res, next) => {
  try {
    const exercises = await computePRs(getStore(), req.userId, req.body.exercises);
    const workout = await getStore().workoutCreate({ userId: req.userId, ...req.body, exercises });
    res.status(201).json({ workout });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const workout = await getStore().workoutGet(req.userId, req.params.id);
    if (!workout) return res.status(404).json({ error: 'Workout not found.' });
    res.json({ workout });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, validate(workoutUpdateSchema), async (req, res, next) => {
  try {
    const existing = await getStore().workoutGet(req.userId, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Workout not found.' });
    const exercises = req.body.exercises !== undefined ? await computePRs(getStore(), req.userId, req.body.exercises, Number(req.params.id)) : undefined;
    const workout = await getStore().workoutUpdate(req.userId, req.params.id, { ...req.body, ...(exercises !== undefined ? { exercises } : {}) });
    res.json({ workout });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const deleted = await getStore().workoutDelete(req.userId, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Workout not found.' });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
