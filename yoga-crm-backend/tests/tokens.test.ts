import { describe, expect, it } from 'vitest';
import { generateOpaqueToken, hashToken } from '../src/utils/tokens';

describe('tokens', () => {
  it('generates unique, url-safe tokens', () => {
    const a = generateOpaqueToken();
    const b = generateOpaqueToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a.length).toBeGreaterThanOrEqual(64);
  });

  it('hashes deterministically and never returns the raw token', () => {
    const token = generateOpaqueToken();
    const hash = hashToken(token);
    expect(hash).toBe(hashToken(token));
    expect(hash).not.toBe(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
