import type { RequestHandler } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { HttpError } from './error';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new HttpError(401, 'Authentication required', 'UNAUTHORIZED'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      clinicId: payload.clinicId,
      role: payload.role,
      email: payload.email,
      name: payload.name,
    };
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token', 'INVALID_TOKEN'));
  }
};
