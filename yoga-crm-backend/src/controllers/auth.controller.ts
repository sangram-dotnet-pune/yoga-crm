import type { Request, RequestHandler, Response } from 'express';
import { env } from '../config/env';
import { HttpError } from '../middleware/error';
import { login, revokeRefreshToken, rotateRefreshToken } from '../services/auth.service';

export const REFRESH_COOKIE = 'yc_refresh';
const REFRESH_COOKIE_PATH = '/api/auth';

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax' as const,
    path: REFRESH_COOKIE_PATH,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

function readRefreshCookie(req: Request): string | undefined {
  const value = (req.cookies as Record<string, unknown> | undefined)?.[REFRESH_COOKIE];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export const loginHandler: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const session = await login(email, password);
    res.cookie(REFRESH_COOKIE, session.refreshToken, refreshCookieOptions());
    res.json({ user: session.user, accessToken: session.accessToken });
  } catch (err) {
    next(err);
  }
};

export const refreshHandler: RequestHandler = async (req, res, next) => {
  try {
    const rawToken = readRefreshCookie(req);
    if (!rawToken) {
      throw new HttpError(401, 'No refresh token', 'NO_REFRESH_TOKEN');
    }
    const session = await rotateRefreshToken(rawToken);
    res.cookie(REFRESH_COOKIE, session.refreshToken, refreshCookieOptions());
    res.json({ user: session.user, accessToken: session.accessToken });
  } catch (err) {
    next(err);
  }
};

export const logoutHandler: RequestHandler = async (req, res, next) => {
  try {
    await revokeRefreshToken(readRefreshCookie(req));
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const meHandler: RequestHandler = (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'UNAUTHORIZED');
  }
  res.json({ user: req.user });
};
