import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/utils/password';

describe('password hashing', () => {
  it('hashes to a value different from the plaintext and verifies it', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).not.toBe('correct horse battery staple');
    await expect(verifyPassword('correct horse battery staple', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('secret-password');
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });
});
