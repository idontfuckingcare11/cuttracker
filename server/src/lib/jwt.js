import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function signToken(userId, version = 0) {
  return jwt.sign({ sub: String(userId), v: version }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    if (!payload?.sub) return null;
    return { sub: Number(payload.sub), v: payload.v ?? 0 };
  } catch {
    return null;
  }
}

export function setAuthCookie(res, token) {
  res.cookie(config.cookie.name, token, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(config.cookie.name, { httpOnly: true, secure: config.cookie.secure, sameSite: 'lax', path: '/' });
}
