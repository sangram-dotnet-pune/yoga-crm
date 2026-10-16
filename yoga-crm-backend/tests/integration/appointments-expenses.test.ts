import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { signAccessToken } from '../../src/utils/jwt';
import { todayISO } from '../../src/utils/dates';

const app = createApp();

let clinicA = '';
let clinicB = '';
let tokenA = '';
let tokenB = '';
let patientA = '';

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

beforeAll(async () => {
  const [a, b] = await Promise.all([
    prisma.clinic.create({ data: { name: 'IT Ops A', doctorName: 'Dr A' } }),
    prisma.clinic.create({ data: { name: 'IT Ops B', doctorName: 'Dr B' } }),
  ]);
  clinicA = a.id;
  clinicB = b.id;
  tokenA = signAccessToken({
    sub: 'it_ops_a',
    clinicId: clinicA,
    role: 'CLINICIAN',
    email: 'oa@example.com',
    name: 'Dr A',
  });
  tokenB = signAccessToken({
    sub: 'it_ops_b',
    clinicId: clinicB,
    role: 'CLINICIAN',
    email: 'ob@example.com',
    name: 'Dr B',
  });

  const patient = await prisma.patient.create({
    data: {
      clinicId: clinicA,
      patientCode: 'YC-9101',
      name: 'Ops Patient',
      age: 40,
      gender: 'M',
      phone: '',
      visitDate: new Date(`${todayISO()}T00:00:00.000Z`),
      condition: 'Shoulder',
      painBefore: 8,
      painAfter: 3,
      mobilityBefore: '40 degrees',
      mobilityAfter: '90 degrees',
      followUpDate: new Date(`${todayISO()}T00:00:00.000Z`),
    },
  });
  patientA = patient.id;
});

afterAll(async () => {
  await prisma.clinic.deleteMany({ where: { id: { in: [clinicA, clinicB] } } });
  await prisma.$disconnect();
});

describe('appointments', () => {
  let appointmentId = '';

  it('creates an appointment for a clinic patient', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set(auth(tokenA))
      .send({
        patientId: patientA,
        date: todayISO(),
        startTime: '09:30',
        endTime: '10:00',
        type: 'Follow-up',
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('Scheduled');
    expect(res.body.startTime).toBe('09:30');
    expect(res.body.patientName).toBe('Ops Patient');
    appointmentId = res.body.id as string;
  });

  it('rejects an invalid time', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set(auth(tokenA))
      .send({
        patientId: patientA,
        date: todayISO(),
        startTime: '9:30',
        endTime: '10:00',
        type: 'Follow-up',
      });
    expect(res.status).toBe(400);
  });

  it('updates status inline', async () => {
    const res = await request(app)
      .patch(`/api/appointments/${appointmentId}`)
      .set(auth(tokenA))
      .send({ status: 'Completed' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Completed');
  });

  it('lists appointments between dates', async () => {
    const res = await request(app)
      .get(`/api/appointments?from=${todayISO()}&to=${todayISO()}`)
      .set(auth(tokenA));
    expect(res.status).toBe(200);
    expect((res.body as unknown[]).length).toBeGreaterThanOrEqual(1);
  });

  it('does not expose appointments across clinics', async () => {
    const list = await request(app).get('/api/appointments').set(auth(tokenB));
    expect(list.body).toEqual([]);
  });

  it('deletes an appointment', async () => {
    const del = await request(app).delete(`/api/appointments/${appointmentId}`).set(auth(tokenA));
    expect(del.status).toBe(204);
  });
});

describe('expenses', () => {
  let expenseId = '';

  it('creates an expense', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .set(auth(tokenA))
      .send({
        date: todayISO(),
        category: 'Supplies',
        description: 'Resistance bands',
        amount: 1200,
        paymentMethod: 'UPI',
      });
    expect(res.status).toBe(201);
    expect(res.body.category).toBe('Supplies');
    expect(res.body.amount).toBe(1200);
    expect(res.body.patientName).toBeNull();
    expenseId = res.body.id as string;
  });

  it('links an expense to a patient', async () => {
    const res = await request(app)
      .patch(`/api/expenses/${expenseId}`)
      .set(auth(tokenA))
      .send({ patientId: patientA });
    expect(res.status).toBe(200);
    expect(res.body.patientName).toBe('Ops Patient');
  });

  it('filters expenses by category', async () => {
    const res = await request(app).get('/api/expenses?category=Supplies').set(auth(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.some((e: { id: string }) => e.id === expenseId)).toBe(true);
  });

  it('isolates expenses by clinic', async () => {
    const res = await request(app).get('/api/expenses').set(auth(tokenB));
    expect(res.body).toEqual([]);
  });
});

describe('outcomes analytics', () => {
  it('returns buckets and KPIs for the range', async () => {
    const res = await request(app).get('/api/outcomes?range=month').set(auth(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.range).toBe('month');
    expect(res.body.revenue).toHaveLength(4);
    expect(res.body.demand).toHaveLength(4);
    expect(res.body.kpis.newPatients).toBeGreaterThanOrEqual(1);
    expect(res.body.progress.painImproved).toBeGreaterThanOrEqual(1);
    expect(res.body.progress.mobilityImproved).toBeGreaterThanOrEqual(1);
    expect(res.body.progress.activePlans).toBeGreaterThanOrEqual(1);
  });

  it('reflects collected payments in the period', async () => {
    await request(app)
      .post(`/api/patients/${patientA}/payments`)
      .set(auth(tokenA))
      .send({ amount: 500, date: todayISO(), paymentMethod: 'Cash' });
    const res = await request(app).get('/api/outcomes?range=month').set(auth(tokenA));
    expect(res.body.kpis.collected).toBeGreaterThanOrEqual(500);
  });

  it('rejects an unknown range', async () => {
    const res = await request(app).get('/api/outcomes?range=decade').set(auth(tokenA));
    expect(res.status).toBe(400);
  });
});
