import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

export const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIME)[number];

export const storageBucket = env.SUPABASE_BUCKET;
export const maxUploadBytes = env.MAX_UPLOAD_MB * 1024 * 1024;

let client: SupabaseClient | null = null;

export function isStorageConfigured(): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SECRET_KEY);
}

export function getStorageClient(): SupabaseClient {
  if (!isStorageConfigured()) {
    throw new Error('Supabase storage is not configured (SUPABASE_URL / SUPABASE_SECRET_KEY).');
  }
  if (!client) {
    client = createClient(env.SUPABASE_URL as string, env.SUPABASE_SECRET_KEY as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export async function ensureStorageBucket(): Promise<void> {
  const supabase = getStorageClient();
  const { data } = await supabase.storage.getBucket(storageBucket);
  if (data) return;
  const { error } = await supabase.storage.createBucket(storageBucket, { public: false });
  if (error && !/already exists|duplicate/i.test(error.message)) {
    throw new Error(`Unable to create storage bucket "${storageBucket}": ${error.message}`);
  }
}
