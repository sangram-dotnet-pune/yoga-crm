import { describe, expect, it } from 'vitest';
import { parseEnv } from '../src/config/env';

const base = {
  NODE_ENV: 'test',
  PORT: '4000',
  CORS_ORIGIN: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/yogacare?schema=public',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
} satisfies NodeJS.ProcessEnv;

describe('parseEnv', () => {
  it('parses a valid environment and applies defaults', () => {
    const env = parseEnv(base);
    expect(env.PORT).toBe(4000);
    expect(env.COOKIE_SECURE).toBe(false);
    expect(env.ACCESS_TOKEN_TTL_MIN).toBe(15);
    expect(env.REFRESH_TOKEN_TTL_DAYS).toBe(30);
    expect(env.SUPABASE_BUCKET).toBe('yogacare-xrays');
    expect(env.MAX_UPLOAD_MB).toBe(15);
  });

  it('treats COOKIE_SECURE "true" as boolean true', () => {
    expect(parseEnv({ ...base, COOKIE_SECURE: 'true' }).COOKIE_SECURE).toBe(true);
    expect(parseEnv({ ...base, COOKIE_SECURE: 'false' }).COOKIE_SECURE).toBe(false);
  });

  it('rejects a too-short JWT secret', () => {
    expect(() => parseEnv({ ...base, JWT_ACCESS_SECRET: 'short' })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('rejects a missing DATABASE_URL', () => {
    const withoutDb: NodeJS.ProcessEnv = { ...base };
    delete withoutDb.DATABASE_URL;
    expect(() => parseEnv(withoutDb)).toThrow(/Invalid environment configuration/);
  });

  it('rejects a non-numeric PORT', () => {
    expect(() => parseEnv({ ...base, PORT: 'not-a-port' })).toThrow(
      /Invalid environment configuration/,
    );
  });
});
