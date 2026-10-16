import type { Request } from 'express';
import { HttpError } from '../middleware/error';

export function clinicIdOf(req: Request): string {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'UNAUTHORIZED');
  }
  return req.user.clinicId;
}

export function paramOf(req: Request, name: string): string {
  const value = (req.params as Record<string, string | string[] | undefined>)[name];
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}
