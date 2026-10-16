import { describe, expect, it } from 'vitest';
import { HttpError } from '../src/middleware/error';
import { maxUploadBytes } from '../src/config/storage';
import { assertAllowedImage, buildStorageKey } from '../src/services/media.service';

function file(mimetype: string, size: number): { mimetype: string; size: number; buffer: Buffer } {
  return { mimetype, size, buffer: Buffer.alloc(0) };
}

describe('image upload validation', () => {
  it('requires a file', () => {
    expect(() => assertAllowedImage(undefined)).toThrow(HttpError);
  });

  it('rejects unsupported mime types', () => {
    expect(() => assertAllowedImage(file('application/pdf', 10))).toThrow(HttpError);
    expect(() => assertAllowedImage(file('image/gif', 10))).toThrow(HttpError);
  });

  it('rejects empty files', () => {
    expect(() => assertAllowedImage(file('image/png', 0))).toThrow(HttpError);
  });

  it('rejects files over the size limit', () => {
    expect(() => assertAllowedImage(file('image/jpeg', maxUploadBytes + 1))).toThrow(HttpError);
  });

  it('accepts JPEG, PNG and WebP', () => {
    for (const mime of ['image/jpeg', 'image/png', 'image/webp']) {
      expect(() => assertAllowedImage(file(mime, 1024))).not.toThrow();
    }
  });
});

describe('storage keys', () => {
  it('scopes keys by clinic, patient and a unique id', () => {
    expect(buildStorageKey('clinic1', 'patient1', 'image/jpeg')).toMatch(
      /^clinics\/clinic1\/patients\/patient1\/[0-9a-f-]+\.jpg$/,
    );
    expect(buildStorageKey('clinic1', 'patient1', 'image/png')).toMatch(/\.png$/);
    expect(buildStorageKey('clinic1', 'patient1', 'image/webp')).toMatch(/\.webp$/);
  });
});
