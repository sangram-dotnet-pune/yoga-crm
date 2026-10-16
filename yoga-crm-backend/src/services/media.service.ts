import { randomUUID } from 'node:crypto';
import type { MediaAsset } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import {
  ALLOWED_IMAGE_MIME,
  getStorageClient,
  maxUploadBytes,
  storageBucket,
  type AllowedImageMime,
} from '../config/storage';
import { HttpError } from '../middleware/error';

const EXTENSION: Record<AllowedImageMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export type UploadedImage = {
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export function assertAllowedImage(file: UploadedImage | undefined): asserts file is UploadedImage {
  if (!file) {
    throw new HttpError(400, 'An image file is required', 'FILE_REQUIRED');
  }
  if (!ALLOWED_IMAGE_MIME.includes(file.mimetype as AllowedImageMime)) {
    throw new HttpError(400, 'Only JPEG, PNG or WebP images are allowed', 'UNSUPPORTED_MEDIA_TYPE');
  }
  if (file.size <= 0) {
    throw new HttpError(400, 'The uploaded file is empty', 'EMPTY_FILE');
  }
  if (file.size > maxUploadBytes) {
    throw new HttpError(
      413,
      `Image exceeds the ${env.MAX_UPLOAD_MB} MB limit`,
      'FILE_TOO_LARGE',
    );
  }
}

export function buildStorageKey(clinicId: string, patientId: string, mimeType: string): string {
  const extension = EXTENSION[mimeType as AllowedImageMime] ?? 'bin';
  return `clinics/${clinicId}/patients/${patientId}/${randomUUID()}.${extension}`;
}

export async function uploadPatientImage(
  clinicId: string,
  patientId: string,
  file: UploadedImage | undefined,
): Promise<MediaAsset> {
  assertAllowedImage(file);
  const storageKey = buildStorageKey(clinicId, patientId, file.mimetype);

  const supabase = getStorageClient();
  const { error } = await supabase.storage
    .from(storageBucket)
    .upload(storageKey, file.buffer, { contentType: file.mimetype, upsert: false });
  if (error) {
    throw new HttpError(502, `Image upload failed: ${error.message}`, 'STORAGE_UPLOAD_FAILED');
  }

  try {
    return await prisma.mediaAsset.create({
      data: {
        clinicId,
        storageKey,
        bucket: storageBucket,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    });
  } catch (error) {
    await supabase.storage.from(storageBucket).remove([storageKey]);
    throw error;
  }
}

export async function signStorageKey(storageKey: string): Promise<string> {
  const supabase = getStorageClient();
  const { data, error } = await supabase.storage
    .from(storageBucket)
    .createSignedUrl(storageKey, SIGNED_URL_TTL_SECONDS);
  if (error || !data) {
    throw new HttpError(502, 'Unable to create a signed image URL', 'STORAGE_SIGN_FAILED');
  }
  return data.signedUrl;
}

export async function deleteMediaAsset(media: MediaAsset): Promise<void> {
  const supabase = getStorageClient();
  const { error } = await supabase.storage.from(storageBucket).remove([media.storageKey]);
  if (error) {
    throw new HttpError(502, `Image deletion failed: ${error.message}`, 'STORAGE_DELETE_FAILED');
  }
  await prisma.mediaAsset.delete({ where: { id: media.id } });
}
