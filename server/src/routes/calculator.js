import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { profileInputSchema } from '../schemas.js';
import { calculateAll } from '../lib/calc.js';

const router = Router();

router.post('/estimate', validate(profileInputSchema), (req, res) => {
  const result = calculateAll({ ...req.body, weightKg: req.body.currentWeightKg });
  res.json(result);
});

export default router;
