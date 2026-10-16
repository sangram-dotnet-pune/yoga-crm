import { describe, expect, it } from 'vitest';
import { addDaysISO, formatDate, isDateString, toDate, todayISO } from '../src/utils/dates';

describe('dates', () => {
  it('validates ISO date strings only', () => {
    expect(isDateString('2026-01-31')).toBe(true);
    expect(isDateString('2026-1-1')).toBe(false);
    expect(isDateString('not-a-date')).toBe(false);
    expect(isDateString('2026-13-40')).toBe(false);
  });

  it('round-trips date-only values', () => {
    expect(formatDate(toDate('2026-07-04'))).toBe('2026-07-04');
  });

  it('adds days across month boundaries', () => {
    expect(addDaysISO('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDaysISO('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('produces a valid today string', () => {
    expect(isDateString(todayISO())).toBe(true);
  });
});
