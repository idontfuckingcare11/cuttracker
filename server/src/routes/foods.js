import { Router } from 'express';
import { getStore } from '../lib/db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { foodCreateSchema } from '../schemas.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const foods = await getStore().foodList(req.userId);
    res.json({ foods });
  } catch (error) {
    next(error);
  }
});

import { estimateFoodNutrition } from '../services/foodEstimator.js';

router.post('/estimate', requireAuth, async (req, res, next) => {
  try {
    const { name, grams } = req.body;
    if (!name) return res.status(400).json({ error: 'Food name is required' });
    const estimation = await estimateFoodNutrition(name, grams || 100);
    res.json(estimation);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, validate(foodCreateSchema), async (req, res, next) => {
  try {
    const food = await getStore().foodCreate({ ...req.body, createdBy: req.userId });
    res.status(201).json({ food });
  } catch (error) {
    next(error);
  }
});

export default router;
