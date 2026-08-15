import { Router } from 'express';
import { getStore } from '../lib/db/index.js';
import { requireAuth, requireProfile } from '../middleware/auth.js';
import { buildDashboardData } from '../services/dashboardData.js';

const router = Router();

router.get('/', requireAuth, requireProfile, async (req, res, next) => {
  try {
    const data = await buildDashboardData({ store: getStore(), userId: req.userId, profile: req.profile });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
