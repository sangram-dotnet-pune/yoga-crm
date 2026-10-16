import 'dotenv/config';
import { z } from 'zod';

const boolFromEnv = z
  .string()
  .default('false')
  .transform((value) => value.toLowerCase() === 'true' || value === '1');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_MIN: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  COOKIE_SECURE: boolFromEnv,

  STORAGE_DRIVER: z.enum(['supabase']).default('supabase'),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
  SUPABASE_JWKS_URL: z.string().url().optional(),
  SUPABASE_BUCKET: z.string().min(1).default('yogacare-xrays'),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(15),

  SEED_CLINIC_NAME: z.string().optional(),
  SEED_DOCTOR_NAME: z.string().optional(),
  SEED_EMAIL: z.string().email().optional(),
  SEED_PASSWORD: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const fields = Object.keys(result.error.flatten().fieldErrors).join(', ');
    throw new Error(`Invalid environment configuration. Check: ${fields}`);
  }
  return result.data;
}

export const env: Env = parseEnv();
