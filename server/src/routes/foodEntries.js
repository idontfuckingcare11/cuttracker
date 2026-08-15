import { Router } from 'express';
import { getStore } from '../lib/db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { foodEntryCreateSchema, foodEntryUpdateSchema } from '../schemas.js';
import { isValidDateKey, todayKey } from '../lib/date.js';

const router = Router();

function computeTotals(entries) {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const meals = { breakfast: { ...totals }, lunch: { ...totals }, dinner: { ...totals }, snack: { ...totals } };
  for (const e of entries) {
    totals.calories += e.calories;
    totals.protein += e.proteinG;
    totals.carbs += e.carbsG;
    totals.fat += e.fatG;
    const m = meals[e.mealType];
    m.calories += e.calories;
    m.protein += e.proteinG;
    m.carbs += e.carbsG;
    m.fat += e.fatG;
  }
  for (const key of Object.keys(meals)) {
    meals[key].protein = Math.round(meals[key].protein * 10) / 10;
    meals[key].carbs = Math.round(meals[key].carbs * 10) / 10;
    meals[key].fat = Math.round(meals[key].fat * 10) / 10;
  }
  totals.protein = Math.round(totals.protein * 10) / 10;
  totals.carbs = Math.round(totals.carbs * 10) / 10;
  totals.fat = Math.round(totals.fat * 10) / 10;
  return { totals, meals };
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const date = isValidDateKey(req.query.date) ? req.query.date : todayKey();
    const entries = await getStore().entryListByDate(req.userId, date);
    const { totals, meals } = computeTotals(entries);
    res.json({ date, entries, totals, meals });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, validate(foodEntryCreateSchema), async (req, res, next) => {
  try {
    const { foodId, ...input } = req.body;
    let entryData = input;
    if (foodId) {
      const foods = await getStore().foodList(req.userId);
      const food = foods.find((f) => f.id === Number(foodId));
      if (food) {
        entryData = {
          ...input,
          foodId: food.id,
          name: input.name || food.name,
          servingSize: input.servingSize || food.servingSize,
          calories: input.calories !== undefined ? input.calories : Math.round(food.calories * input.quantity),
          proteinG: input.proteinG !== undefined ? input.proteinG : Math.round(food.proteinG * input.quantity * 10) / 10,
          carbsG: input.carbsG !== undefined ? input.carbsG : Math.round(food.carbsG * input.quantity * 10) / 10,
          fatG: input.fatG !== undefined ? input.fatG : Math.round(food.fatG * input.quantity * 10) / 10
        };
      }
    }
    if (!entryData.name) {
      return res.status(400).json({ error: 'A food name is required for custom entries.' });
    }
    const entry = await getStore().entryCreate({ userId: req.userId, ...entryData });
    res.status(201).json({ entry });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, validate(foodEntryUpdateSchema), async (req, res, next) => {
  try {
    const entry = await getStore().entryUpdate(req.userId, req.params.id, req.body);
    if (!entry) return res.status(404).json({ error: 'Entry not found.' });
    res.json({ entry });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const deleted = await getStore().entryDelete(req.userId, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Entry not found.' });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
