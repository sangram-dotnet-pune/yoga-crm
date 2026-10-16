import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { todayISO } from '../../src/utils/dates';
import { signAccessToken } from '../../src/utils/jwt';

const app = createApp();

function binaryParser(
  res: NodeJS.ReadableStream,
  callback: (error: Error | null, body?: Buffer) => void,
): void {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(chunk));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
}
const parseBinary = binaryParser as unknown as (res: unknown, callback: (err: Error | null, body: unknown) => void) => void;

let clinicA = '';
let clinicB = '';
let tokenA = '';
let tokenB = '';
let patientId = '';

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

beforeAll(async () => {
  const [a, b] = await Promise.all([
    prisma.clinic.create({ data: { name: 'Report Clinic A', doctorName: 'Dr A' } }),
    prisma.clinic.create({ data: { name: 'Report Clinic B', doctorName: 'Dr B' } }),
  ]);
  clinicA = a.id;
  clinicB = b.id;
  tokenA = signAccessToken({
    sub: 'report_a',
    clinicId: clinicA,
    role: 'CLINICIAN',
    email: 'ra@example.com',
    name: 'Dr A',
  });
  tokenB = signAccessToken({
    sub: 'report_b',
    clinicId: clinicB,
    role: 'CLINICIAN',
    email: 'rb@example.com',
    name: 'Dr B',
  });

  const patient = await prisma.patient.create({
    data: {
      clinicId: clinicA,
      patientCode: 'YC-9201',
      name: 'Report Patient',
      age: 50,
      gender: 'F',
      phone: '',
      visitDate: new Date(`${todayISO()}T00:00:00.000Z`),
      condition: 'Knee pain',
      painBefore: 7,
      painAfter: 2,
      mobilityBefore: '60 degrees',
      mobilityAfter: '110 degrees',
      followUpDate: new Date(`${todayISO()}T00:00:00.000Z`),
      fee: 8000,
      paid: 3000,
    },
  });
  patientId = patient.id;
});

afterAll(async () => {
  await prisma.clinic.deleteMany({ where: { id: { in: [clinicA, clinicB] } } });
  await prisma.$disconnect();
});

describe('patient report PDF', () => {
  it('returns a PDF attachment', async () => {
    const res = await request(app)
      .get(`/api/patients/${patientId}/report`)
      .set(auth(tokenA))
      .buffer(true)
      .parse(parseBinary);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['content-disposition']).toContain('YC-9201');
    const body = res.body as Buffer;
    expect(body.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(body.length).toBeGreaterThan(2000);
  });

  it('hides reports from other clinics', async () => {
    const res = await request(app).get(`/api/patients/${patientId}/report`).set(auth(tokenB));
    expect(res.status).toBe(404);
  });

  it('requires authentication', async () => {
    const res = await request(app).get(`/api/patients/${patientId}/report`);
    expect(res.status).toBe(401);
  });
});
