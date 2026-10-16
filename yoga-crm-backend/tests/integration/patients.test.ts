import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { signAccessToken } from '../../src/utils/jwt';

const app = createApp();

let clinicA = '';
let clinicB = '';
let tokenA = '';
let tokenB = '';

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

beforeAll(async () => {
  const a = await prisma.clinic.create({ data: { name: 'IT Clinic A', doctorName: 'Dr A' } });
  const b = await prisma.clinic.create({ data: { name: 'IT Clinic B', doctorName: 'Dr B' } });
  clinicA = a.id;
  clinicB = b.id;

  tokenA = signAccessToken({
    sub: 'it_user_a',
    clinicId: clinicA,
    role: 'CLINICIAN',
    email: 'a@example.com',
    name: 'Dr A',
  });
  tokenB = signAccessToken({
    sub: 'it_user_b',
    clinicId: clinicB,
    role: 'CLINICIAN',
    email: 'b@example.com',
    name: 'Dr B',
  });
});

afterAll(async () => {
  await prisma.clinic.deleteMany({ where: { id: { in: [clinicA, clinicB] } } });
  await prisma.$disconnect();
});

async function createPatient(overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/patients')
    .set(authHeader(tokenA))
    .send({ name: 'Test Patient', condition: 'Low back pain', fee: 1000, ...overrides });
  return res;
}

describe('patient CRUD', () => {
  it('creates a patient with a generated code and defaults', async () => {
    const res = await createPatient();
    expect(res.status).toBe(201);
    expect(res.body.patientCode).toMatch(/^YC-\d{4}$/);
    expect(res.body.status).toBe('Active');
    expect(res.body.planMonths).toBe(3);
    expect(res.body.paymentStatus).toBe('Pending');
    expect(Array.isArray(res.body.visits)).toBe(false);
  });

  it('lists and fetches the patient with detail relations', async () => {
    const created = await createPatient();
    const id = created.body.id as string;

    const list = await request(app).get('/api/patients?search=Test').set(authHeader(tokenA));
    expect(list.status).toBe(200);
    expect(list.body.total).toBeGreaterThanOrEqual(1);

    const detail = await request(app).get(`/api/patients/${id}`).set(authHeader(tokenA));
    expect(detail.status).toBe(200);
    expect(detail.body.visits).toEqual([]);
    expect(detail.body.payments).toEqual([]);
    expect(detail.body.exercises).toEqual([]);
    expect(detail.body.planLog).toEqual([]);
  });

  it('updates fields and writes a plan log when planMonths changes', async () => {
    const created = await createPatient();
    const id = created.body.id as string;

    const patched = await request(app)
      .patch(`/api/patients/${id}`)
      .set(authHeader(tokenA))
      .send({ planMonths: 6, status: 'Follow-up' });
    expect(patched.status).toBe(200);
    expect(patched.body.planMonths).toBe(6);
    expect(patched.body.status).toBe('Follow-up');

    const logs = await prisma.planLog.findMany({ where: { patientId: id } });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.months).toBe(6);
  });

  it('deletes a patient', async () => {
    const created = await createPatient();
    const id = created.body.id as string;
    const del = await request(app).delete(`/api/patients/${id}`).set(authHeader(tokenA));
    expect(del.status).toBe(204);
    const fetch = await request(app).get(`/api/patients/${id}`).set(authHeader(tokenA));
    expect(fetch.status).toBe(404);
  });
});

describe('visits', () => {
  it('creates a visit accepting pain score 0', async () => {
    const patient = await createPatient();
    const id = patient.body.id as string;
    const res = await request(app)
      .post(`/api/patients/${id}/visits`)
      .set(authHeader(tokenA))
      .send({ date: '2026-03-01', visitType: 'Follow-up', painScore: 0, mobility: 80 });
    expect(res.status).toBe(201);
    expect(res.body.painScore).toBe(0);

    const list = await request(app).get(`/api/patients/${id}/visits`).set(authHeader(tokenA));
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
  });
});

describe('exercise plans', () => {
  it('replaces the exercise list', async () => {
    const patient = await createPatient();
    const id = patient.body.id as string;
    const res = await request(app)
      .put(`/api/patients/${id}/exercises`)
      .set(authHeader(tokenA))
      .send({
        exercises: [
          { name: 'Cat-cow', frequency: 'Daily', duration: '5 min' },
          { name: 'Bridge', frequency: 'Daily', duration: '3 sets' },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].sortOrder).toBe(0);
    expect(res.body[1].sortOrder).toBe(1);
  });
});

describe('payments and reconciliation', () => {
  it('derives paid and status from the ledger', async () => {
    const patient = await createPatient({ fee: 1000 });
    const id = patient.body.id as string;

    const first = await request(app)
      .post(`/api/patients/${id}/payments`)
      .set(authHeader(tokenA))
      .send({ amount: 400, date: '2026-03-02', paymentMethod: 'UPI' });
    expect(first.status).toBe(201);
    expect(first.body.patient.paid).toBe(400);
    expect(first.body.patient.paymentStatus).toBe('Partially paid');
    expect(first.body.patient.balance).toBe(600);

    const second = await request(app)
      .post(`/api/patients/${id}/payments`)
      .set(authHeader(tokenA))
      .send({ amount: 600, date: '2026-03-03', paymentMethod: 'Cash' });
    expect(second.body.patient.paid).toBe(1000);
    expect(second.body.patient.paymentStatus).toBe('Done');
  });

  it('reconciles a manually edited paid amount back to the ledger', async () => {
    const patient = await createPatient({ fee: 1000 });
    const id = patient.body.id as string;
    await request(app)
      .post(`/api/patients/${id}/payments`)
      .set(authHeader(tokenA))
      .send({ amount: 250, date: '2026-03-04', paymentMethod: 'Card' });

    await request(app).patch(`/api/patients/${id}`).set(authHeader(tokenA)).send({ paid: 9999 });

    const reconcile = await request(app)
      .post(`/api/patients/${id}/payments/reconcile`)
      .set(authHeader(tokenA));
    expect(reconcile.status).toBe(200);
    expect(reconcile.body.paid).toBe(250);
  });
});

describe('tenant isolation', () => {
  it('never returns another clinic\'s patients', async () => {
    const patient = await createPatient();
    const id = patient.body.id as string;

    const foreignFetch = await request(app).get(`/api/patients/${id}`).set(authHeader(tokenB));
    expect(foreignFetch.status).toBe(404);

    const foreignList = await request(app).get('/api/patients').set(authHeader(tokenB));
    expect(foreignList.status).toBe(200);
    expect(foreignList.body.items.every((p: { id: string }) => p.id !== id)).toBe(true);

    const foreignPatch = await request(app)
      .patch(`/api/patients/${id}`)
      .set(authHeader(tokenB))
      .send({ name: 'Hacked' });
    expect(foreignPatch.status).toBe(404);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/patients');
    expect(res.status).toBe(401);
  });
});
