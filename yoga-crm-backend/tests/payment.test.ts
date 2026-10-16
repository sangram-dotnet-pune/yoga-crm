import { describe, expect, it } from 'vitest';
import { balanceOf, creditOf, derivePaymentStatus, ledgerTotal } from '../src/utils/payment';

describe('payment derivation', () => {
  it('is Pending when fee or paid is non-positive', () => {
    expect(derivePaymentStatus(0, 0)).toBe('Pending');
    expect(derivePaymentStatus(1000, 0)).toBe('Pending');
    expect(derivePaymentStatus(0, 500)).toBe('Pending');
  });

  it('is Done when paid covers the fee', () => {
    expect(derivePaymentStatus(1000, 1000)).toBe('Done');
    expect(derivePaymentStatus(1000, 1200)).toBe('Done');
  });

  it('is Partially paid otherwise', () => {
    expect(derivePaymentStatus(1000, 400)).toBe('Partially paid');
  });

  it('computes balance and credit without negatives', () => {
    expect(balanceOf(1000, 400)).toBe(600);
    expect(balanceOf(1000, 1500)).toBe(0);
    expect(creditOf(1000, 1500)).toBe(500);
    expect(creditOf(1000, 400)).toBe(0);
  });

  it('sums a ledger with rounding', () => {
    expect(ledgerTotal([100.1, 200.2])).toBe(300.3);
    expect(ledgerTotal([])).toBe(0);
  });
});
