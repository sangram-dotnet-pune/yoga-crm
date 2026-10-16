import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { signAccessToken } from '../src/utils/jwt';

const app = createApp();

describe('requireAuth middleware', () => {
  it('rejects requests without a bearer token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects malformed tokens', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('accepts a valid token and returns the user', async () => {
    const token = signAccessToken({
      sub: 'user_1',
      clinicId: 'clinic_1',
      role: 'CLINICIAN',
      email: 'doctor@example.com',
      name: 'Dr. Test',
    });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe('user_1');
    expect(res.body.user.clinicId).toBe('clinic_1');
  });
});

describe('login validation', () => {
  it('rejects an invalid body before hitting the database', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
