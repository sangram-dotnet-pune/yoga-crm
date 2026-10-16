import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import {
  ensureStorageBucket,
  getStorageClient,
  isStorageConfigured,
  storageBucket,
} from '../../src/config/storage';
import { signAccessToken } from '../../src/utils/jwt';

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

const app = createApp();

let clinicA = '';
let clinicB = '';
let tokenA = '';
let tokenB = '';
let patientId = '';

beforeAll(async () => {
  const [a, b] = await Promise.all([
    prisma.clinic.create({ data: { name: 'IT Xray A', doctorName: 'Dr A' } }),
    prisma.clinic.create({ data: { name: 'IT Xray B', doctorName: 'Dr B' } }),
  ]);
  clinicA = a.id;
  clinicB = b.id;
  tokenA = signAccessToken({
    sub: 'it_xray_a',
    clinicId: clinicA,
    role: 'CLINICIAN',
    email: 'xa@example.com',
    name: 'Dr A',
  });
  tokenB = signAccessToken({
    sub: 'it_xray_b',
    clinicId: clinicB,
    role: 'CLINICIAN',
    email: 'xb@example.com',
    name: 'Dr B',
  });

  const patient = await prisma.patient.create({
    data: {
      clinicId: clinicA,
      patientCode: 'YC-9001',
      name: 'Xray Patient',
      age: 30,
      gender: 'F',
      phone: '',
      visitDate: new Date('2026-01-01T00:00:00.000Z'),
      condition: 'Knee pain',
      painBefore: 5,
      followUpDate: new Date('2026-04-01T00:00:00.000Z'),
    },
  });
  patientId = patient.id;
});

afterAll(async () => {
  if (isStorageConfigured()) {
    const media = await prisma.mediaAsset.findMany({ where: { clinicId: clinicA } });
    if (media.length > 0) {
      await getStorageClient()
        .storage.from(storageBucket)
        .remove(media.map((item) => item.storageKey));
    }
  }
  await prisma.clinic.deleteMany({ where: { id: { in: [clinicA, clinicB] } } });
  await prisma.$disconnect();
});

const storageSuite = isStorageConfigured() ? describe : describe.skip;

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

storageSuite('x-ray media uploads', () => {
  let xrayId = '';

  beforeAll(async () => {
    await ensureStorageBucket();
  });

  it('rejects a non-image file', async () => {
    const res = await request(app)
      .post(`/api/patients/${patientId}/xrays`)
      .set(auth(tokenA))
      .field('date', '2026-03-01')
      .attach('image', Buffer.from('not an image'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });
    expect(res.status).toBe(400);
  });

  it('uploads an image and returns a signed URL', async () => {
    const res = await request(app)
      .post(`/api/patients/${patientId}/xrays`)
      .set(auth(tokenA))
      .field('date', '2026-03-01')
      .field('kind', 'Record')
      .field('bodyArea', 'Left knee')
      .attach('image', PNG_1X1, { filename: 'knee.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(res.body.kind).toBe('Record');
    expect(res.body.mimeType).toBe('image/png');
    expect(res.body.bodyArea).toBe('Left knee');
    expect(typeof res.body.url).toBe('string');
    expect(res.body.url).toContain('token=');
    xrayId = res.body.id as string;
  });

  it('keeps a single legacy "Before" image per patient', async () => {
    for (let i = 0; i < 2; i += 1) {
      await request(app)
        .post(`/api/patients/${patientId}/xrays`)
        .set(auth(tokenA))
        .field('date', '2026-02-01')
        .field('kind', 'Before')
        .attach('image', PNG_1X1, { filename: `before-${i}.png`, contentType: 'image/png' });
    }
    const res = await request(app).get(`/api/patients/${patientId}/xrays`).set(auth(tokenA));
    const before = (res.body as { kind: string }[]).filter((x) => x.kind === 'Before');
    expect(before).toHaveLength(1);
  });

  it('lists x-rays for the patient', async () => {
    const res = await request(app).get(`/api/patients/${patientId}/xrays`).set(auth(tokenA));
    expect(res.status).toBe(200);
    expect((res.body as unknown[]).length).toBeGreaterThanOrEqual(2);
  });

  it('updates x-ray metadata', async () => {
    const res = await request(app)
      .patch(`/api/xrays/${xrayId}`)
      .set(auth(tokenA))
      .send({ title: 'Baseline scan', notes: 'Reviewed' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Baseline scan');
    expect(res.body.notes).toBe('Reviewed');
  });

  it("does not expose another clinic's x-rays", async () => {
    const list = await request(app).get(`/api/patients/${patientId}/xrays`).set(auth(tokenB));
    expect(list.status).toBe(404);

    const patch = await request(app)
      .patch(`/api/xrays/${xrayId}`)
      .set(auth(tokenB))
      .send({ title: 'Hacked' });
    expect(patch.status).toBe(404);
  });

  it('deletes an x-ray and its media asset', async () => {
    const del = await request(app).delete(`/api/xrays/${xrayId}`).set(auth(tokenA));
    expect(del.status).toBe(204);

    const list = await request(app).get(`/api/patients/${patientId}/xrays`).set(auth(tokenA));
    expect((list.body as { id: string }[]).some((x) => x.id === xrayId)).toBe(false);
  });
});
