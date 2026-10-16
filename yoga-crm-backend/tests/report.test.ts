import { describe, expect, it } from 'vitest';
import {
  buildPatientReport,
  REPORT_DISCLAIMER,
  type ReportData,
} from '../src/services/report.service';

const FOUR_PX_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEElEQVR4nGM4IScHRwzEcQCxYxBBO0tjggAAAABJRU5ErkJggg==',
  'base64',
);

function fixture(): ReportData {
  return {
    clinicName: 'Test Clinic',
    doctorName: 'Dr Test',
    generatedAt: '2026-06-15',
    patient: {
      patientCode: 'YC-1001',
      name: 'Asha Rao',
      age: 34,
      gender: 'F',
      phone: '9876543210',
      visitDate: '2026-05-01',
      condition: 'Lower back pain',
      diagnosis: 'Lumbar strain',
      doctor: 'Dr Test',
      painBefore: 8,
      painAfter: 3,
      mobilityBefore: '40 degrees',
      mobilityAfter: '85 degrees',
      planMonths: 3,
      followUpDate: '2026-07-30',
      status: 'Active',
      fee: 5000,
      paid: 2000,
      balance: 3000,
      credit: 0,
      paymentStatus: 'Partially paid',
      notes: 'Improving steadily',
    },
    visits: [
      {
        date: '2026-05-01',
        visitType: 'Initial assessment',
        painScore: 8,
        mobility: 40,
        treatment: 'Manual therapy',
        exercises: 'Cat-camel',
        notes: null,
      },
      {
        date: '2026-05-15',
        visitType: 'Follow-up',
        painScore: 3,
        mobility: 85,
        treatment: 'Progression',
        exercises: null,
        notes: null,
      },
    ],
    payments: [
      { date: '2026-05-01', paymentMethod: 'UPI', reference: 'TXN1', notes: null, amount: 2000 },
    ],
    exercises: [{ name: 'Cat-camel', frequency: '2x/day', duration: '5 min', notes: 'Gentle' }],
    xrays: [
      {
        kind: 'Before',
        date: '2026-05-01',
        bodyArea: 'Lumbar',
        title: 'Baseline',
        notes: null,
        mimeType: 'image/png',
        data: FOUR_PX_PNG,
      },
      {
        kind: 'After',
        date: '2026-06-01',
        bodyArea: 'Lumbar',
        title: 'Follow-up',
        notes: null,
        mimeType: 'image/webp',
        data: null,
      },
    ],
  };
}

describe('buildPatientReport', () => {
  it('produces a valid PDF buffer with the disclaimer text', async () => {
    const buffer = await buildPatientReport(fixture());
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(2000);
    expect(REPORT_DISCLAIMER).toContain('not an automated radiological diagnosis');
  });

  it('skips undecodable images without stalling', async () => {
    const data = fixture();
    data.xrays = [
      {
        kind: 'Before',
        date: '2026-05-01',
        bodyArea: 'Lumbar',
        title: 'Corrupt',
        notes: null,
        mimeType: 'image/png',
        data: Buffer.from('not-a-real-png'),
      },
    ];
    const buffer = await buildPatientReport(data);
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  it('paginates long reports without throwing', async () => {
    const data = fixture();
    data.visits = Array.from({ length: 70 }, (_unused, index) => ({
      date: `2026-05-${String((index % 28) + 1).padStart(2, '0')}`,
      visitType: 'Follow-up',
      painScore: index % 11,
      mobility: (index * 7) % 101,
      treatment: 'Therapy',
      exercises: null,
      notes: null,
    }));
    data.payments = Array.from({ length: 40 }, (_unused, index) => ({
      date: '2026-05-01',
      paymentMethod: 'Cash',
      reference: `R${index}`,
      notes: null,
      amount: 500,
    }));
    const buffer = await buildPatientReport(data);
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });
});
