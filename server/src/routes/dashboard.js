import { Router } from 'express';
import { getStore } from '../lib/db/index.js';
import { requireAuth, requireProfile } from '../middleware/auth.js';
import { buildDashboardData } from '../services/dashboardData.js';
import { isValidDateKey, todayKey } from '../lib/date.js';

const router = Router();

router.get('/', requireAuth, requireProfile, async (req, res, next) => {
  try {
    const clientHeader = req.headers['x-client-date'];
    const dateKey = req.query.date && isValidDateKey(req.query.date)
      ? req.query.date
      : clientHeader && isValidDateKey(clientHeader)
        ? clientHeader
        : todayKey();
    const data = await buildDashboardData({ store: getStore(), userId: req.userId, profile: req.profile, date: dateKey });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
