import { describe, expect, it } from 'vitest';
import { signAccessToken, verifyAccessToken } from '../src/utils/jwt';

const basePayload = {
  sub: 'user_1',
  clinicId: 'clinic_1',
  role: 'CLINICIAN',
  email: 'doctor@example.com',
  name: 'Dr. Test',
};

describe('access tokens', () => {
  it('round-trips a signed token', () => {
    const token = signAccessToken(basePayload);
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user_1');
    expect(payload.clinicId).toBe('clinic_1');
    expect(payload.email).toBe('doctor@example.com');
  });

  it('rejects a tampered token', () => {
    const token = signAccessToken(basePayload);
    const tampered = `${token.slice(0, -2)}xx`;
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('rejects a token signed with a different secret', () => {
    const token = signAccessToken(basePayload);
    expect(() => verifyAccessToken(`${token}.extra`)).toThrow();
  });
});
