import { describe, expect, it } from 'vitest';
import { createPatientSchema } from '../src/validation/patient.schema';
import { createPaymentSchema } from '../src/validation/payment.schema';
import { createVisitSchema } from '../src/validation/visit.schema';

describe('patient validation', () => {
  it('requires name and condition', () => {
    expect(createPatientSchema.safeParse({}).success).toBe(false);
    expect(createPatientSchema.safeParse({ name: 'A' }).success).toBe(false);
    expect(createPatientSchema.safeParse({ name: 'A', condition: 'C' }).success).toBe(true);
  });

  it('accepts pain score 0 as a valid value (not missing)', () => {
    const result = createPatientSchema.safeParse({ name: 'A', condition: 'C', painAfter: 0 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.painAfter).toBe(0);
  });

  it('treats a blank optional score as null', () => {
    const result = createPatientSchema.safeParse({ name: 'A', condition: 'C', painAfter: '' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.painAfter).toBeNull();
  });

  it('rejects out-of-range pain', () => {
    expect(createPatientSchema.safeParse({ name: 'A', condition: 'C', painBefore: 11 }).success).toBe(
      false,
    );
  });

  it('enforces planMonths between 1 and 36', () => {
    expect(createPatientSchema.safeParse({ name: 'A', condition: 'C', planMonths: 0 }).success).toBe(
      false,
    );
    expect(createPatientSchema.safeParse({ name: 'A', condition: 'C', planMonths: 37 }).success).toBe(
      false,
    );
  });
});

describe('visit validation', () => {
  it('rejects mobility above 100', () => {
    expect(
      createVisitSchema.safeParse({ date: '2026-01-01', visitType: 'Follow-up', mobility: 101 })
        .success,
    ).toBe(false);
  });
});

describe('payment validation', () => {
  it('requires a positive amount and a known method', () => {
    expect(
      createPaymentSchema.safeParse({ amount: 0, date: '2026-01-01', paymentMethod: 'Cash' }).success,
    ).toBe(false);
    expect(
      createPaymentSchema.safeParse({ amount: 100, date: '2026-01-01', paymentMethod: 'Bitcoin' })
        .success,
    ).toBe(false);
    expect(
      createPaymentSchema.safeParse({ amount: 100, date: '2026-01-01', paymentMethod: 'UPI' }).success,
    ).toBe(true);
  });
});
