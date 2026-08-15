import { Router } from 'express';
import crypto from 'node:crypto';
import { getStore } from '../lib/db/index.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signToken, verifyToken, setAuthCookie, clearAuthCookie } from '../lib/jwt.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../schemas.js';
import { config } from '../config.js';
import { sendPasswordResetEmail } from '../lib/email.js';

const router = Router();

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const passwordHash = await hashPassword(password);
    const user = await getStore().userCreate({ email, passwordHash });
    if (!user) return res.status(409).json({ error: 'An account with this email already exists.' });
    const token = signToken(user.id, user.tokenVersion ?? 0);
    setAuthCookie(res, token);
    res.status(201).json({ user: getStore().userPublic(user), needsOnboarding: true });
  } catch (error) {
    next(error);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await getStore().userFindByEmail(email.toLowerCase().trim());
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const token = signToken(user.id, user.tokenVersion ?? 0);
    setAuthCookie(res, token);
    const profile = await getStore().profileFindByUserId(user.id);
    res.json({ user: getStore().userPublic(user), needsOnboarding: !profile });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.cuttrack_token;
    const payload = token ? verifyToken(token) : null;
    if (payload) {
      await getStore().userBumpTokenVersion(payload.sub);
    }
    clearAuthCookie(res);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const profile = await getStore().profileFindByUserId(req.userId);
    res.json({ user: req.user, needsOnboarding: !profile });
  } catch (error) {
    next(error);
  }
});

router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await getStore().userFindByEmail(email);
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await getStore().resetCreate({ token, userId: user.id, expiresAt });
      const resetLink = `${config.clientOrigin}/reset-password?token=${token}`;
      const result = await sendPasswordResetEmail(user.email, resetLink);
      return res.json({
        ok: true,
        delivered: result.delivered,
        ...(config.isProd ? {} : { devLink: result.devLink })
      });
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.post('/reset-password', validate(resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const row = await getStore().resetFindValid(token);
    if (!row) return res.status(400).json({ error: 'This reset link is invalid or has expired. Request a new one.' });
    const passwordHash = await hashPassword(password);
    const user = await getStore().userFindById(row.userId);
    if (user) {
      await getStore().userUpdatePassword(row.userId, passwordHash);
    }
    await getStore().resetDeleteForUser(row.userId);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
