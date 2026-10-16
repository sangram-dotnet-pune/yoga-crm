import { addDaysISO, formatDate, toDate, todayISO } from './dates';

export const OUTCOME_RANGES = ['day', 'week', 'month', 'quarter', 'year'] as const;
export type OutcomeRange = (typeof OUTCOME_RANGES)[number];

export type OutcomeBucket = { label: string; from: string; to: string };

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function shortLabel(iso: string): string {
  const date = toDate(iso);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

export function buildBuckets(range: OutcomeRange, today: string = todayISO()): OutcomeBucket[] {
  switch (range) {
    case 'day':
      return [{ label: 'Today', from: today, to: today }];
    case 'week': {
      const start = addDaysISO(today, -6);
      return Array.from({ length: 7 }, (_unused, index) => {
        const day = addDaysISO(start, index);
        return { label: WEEKDAYS[toDate(day).getUTCDay()] ?? day, from: day, to: day };
      });
    }
    case 'month': {
      const start = addDaysISO(today, -27);
      return Array.from({ length: 4 }, (_unused, index) => {
        const from = addDaysISO(start, index * 7);
        const to = addDaysISO(from, 6);
        return { label: `${shortLabel(from)}–${shortLabel(to)}`, from, to };
      });
    }
    case 'quarter': {
      const start = addDaysISO(today, -83);
      return Array.from({ length: 4 }, (_unused, index) => {
        const from = addDaysISO(start, index * 21);
        const to = addDaysISO(from, 20);
        return { label: `${shortLabel(from)}–${shortLabel(to)}`, from, to };
      });
    }
    case 'year': {
      const base = toDate(today);
      return Array.from({ length: 12 }, (_unused, index) => {
        const offset = 11 - index;
        const first = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - offset, 1));
        const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0));
        return {
          label: `${MONTHS[first.getUTCMonth()]} ${String(first.getUTCFullYear()).slice(2)}`,
          from: formatDate(first),
          to: formatDate(last),
        };
      });
    }
    default:
      return [{ label: 'Today', from: today, to: today }];
  }
}

export function assignBucket(dateISO: string, buckets: OutcomeBucket[]): number {
  for (let index = 0; index < buckets.length; index += 1) {
    const bucket = buckets[index];
    if (dateISO >= bucket.from && dateISO <= bucket.to) return index;
  }
  return -1;
}

export function averagePainReduction(
  patients: { painBefore: number; painAfter: number | null }[],
): number {
  const scored = patients.filter((patient) => patient.painAfter !== null);
  if (scored.length === 0) return 0;
  const total = scored.reduce(
    (sum, patient) => sum + (patient.painBefore - (patient.painAfter as number)),
    0,
  );
  return Math.round((total / scored.length) * 10) / 10;
}

export function parseMobilityScore(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /-?\d+/.exec(value);
  return match ? Number(match[0]) : null;
}
