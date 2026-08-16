import { getStore } from '../lib/db/index.js';
import { verifyToken } from '../lib/jwt.js';

export async function requireAuth(req, res, next) {
  let token = req.cookies?.cuttrack_token;
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.slice(7).trim();
  }
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  const user = await getStore().userFindById(payload.sub);
  if (!user || (user.tokenVersion ?? 0) !== payload.v) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  req.user = getStore().userPublic(user);
  req.userId = user.id;
  next();
}

export async function requireProfile(req, res, next) {
  const profile = await getStore().profileFindByUserId(req.userId);
  if (!profile) {
    return res.status(400).json({ error: 'Profile required', code: 'PROFILE_REQUIRED' });
  }
  req.profile = profile;
  next();
}
