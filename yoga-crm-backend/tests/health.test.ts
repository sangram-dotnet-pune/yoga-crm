import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

const app = createApp();

describe('GET /api/health', () => {
  it('returns an ok status payload', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('yogacare-api');
    expect(typeof res.body.timestamp).toBe('string');
  });
});

describe('GET /api', () => {
  it('exposes the API identity', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('yogacare-api');
  });
});

describe('unknown routes', () => {
  it('returns a structured 404 error', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
