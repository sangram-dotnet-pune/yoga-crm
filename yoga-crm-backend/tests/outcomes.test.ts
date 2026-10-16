import { describe, expect, it } from 'vitest';
import {
  assignBucket,
  averagePainReduction,
  buildBuckets,
  parseMobilityScore,
} from '../src/utils/outcomes';

describe('outcome buckets', () => {
  it('builds a single bucket for a day', () => {
    const buckets = buildBuckets('day', '2026-06-15');
    expect(buckets).toEqual([{ label: 'Today', from: '2026-06-15', to: '2026-06-15' }]);
  });

  it('builds 7 daily buckets for a week ending today', () => {
    const buckets = buildBuckets('week', '2026-06-15');
    expect(buckets).toHaveLength(7);
    expect(buckets[0].from).toBe('2026-06-09');
    expect(buckets[6].to).toBe('2026-06-15');
  });

  it('builds 4, 4 and 12 buckets for month, quarter and year', () => {
    expect(buildBuckets('month', '2026-06-15')).toHaveLength(4);
    expect(buildBuckets('quarter', '2026-06-15')).toHaveLength(4);
    expect(buildBuckets('year', '2026-06-15')).toHaveLength(12);
  });

  it('covers the last 12 months for the year range', () => {
    const buckets = buildBuckets('year', '2026-06-15');
    expect(buckets[0].from).toBe('2025-07-01');
    expect(buckets[buckets.length - 1].from).toBe('2026-06-01');
    expect(buckets[buckets.length - 1].to).toBe('2026-06-30');
  });
});

describe('assignBucket', () => {
  const buckets = buildBuckets('week', '2026-06-15');

  it('finds the containing bucket', () => {
    expect(assignBucket('2026-06-15', buckets)).toBe(6);
    expect(assignBucket('2026-06-09', buckets)).toBe(0);
  });

  it('returns -1 outside the range', () => {
    expect(assignBucket('2026-01-01', buckets)).toBe(-1);
  });
});

describe('averagePainReduction', () => {
  it('averages reduction across scored patients only', () => {
    expect(
      averagePainReduction([
        { painBefore: 8, painAfter: 3 },
        { painBefore: 6, painAfter: 6 },
        { painBefore: 5, painAfter: null },
      ]),
    ).toBe(2.5);
  });

  it('returns 0 when no follow-up score exists', () => {
    expect(averagePainReduction([{ painBefore: 5, painAfter: null }])).toBe(0);
    expect(averagePainReduction([])).toBe(0);
  });
});

describe('parseMobilityScore', () => {
  it('extracts the first number from free text', () => {
    expect(parseMobilityScore('70 degrees')).toBe(70);
    expect(parseMobilityScore('Not recorded')).toBeNull();
    expect(parseMobilityScore(null)).toBeNull();
  });
});
