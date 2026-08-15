import { Router } from 'express';
import { getStore } from '../lib/db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { weightEntrySchema, weightEntryUpdateSchema } from '../schemas.js';
import { weightStatsFromEntries } from '../services/dashboardData.js';
import { buildWeightSeriesForChart } from '../lib/trends.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const entries = await getStore().weightList(req.userId);
    res.json({ entries });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const entries = await getStore().weightList(req.userId);
    const profile = await getStore().profileFindByUserId(req.userId);
    const stats = weightStatsFromEntries(entries, profile ? profile.goalWeightKg : null);
    res.json({ stats, series: buildWeightSeriesForChart(entries) });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, validate(weightEntrySchema), async (req, res, next) => {
  try {
    const entry = await getStore().weightCreate({ userId: req.userId, ...req.body });
    res.status(201).json({ entry });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, validate(weightEntryUpdateSchema), async (req, res, next) => {
  try {
    const entry = await getStore().weightUpdate(req.userId, req.params.id, req.body);
    if (!entry) return res.status(404).json({ error: 'Entry not found.' });
    res.json({ entry });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const deleted = await getStore().weightDelete(req.userId, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Entry not found.' });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
