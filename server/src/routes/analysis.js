import { Router } from 'express';
import { getStore } from '../lib/db/index.js';
import { requireAuth, requireProfile } from '../middleware/auth.js';
import { cutAnalysis } from '../services/cutAnalysis.js';

const router = Router();

router.post('/cut-status', requireAuth, requireProfile, async (req, res, next) => {
  try {
    const result = await cutAnalysis(getStore(), req.userId, req.profile);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
