import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export type AccessTokenPayload = {
  sub: string;
  clinicId: string;
  role: string;
  email: string;
  name: string;
};

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL_MIN * 60,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}
