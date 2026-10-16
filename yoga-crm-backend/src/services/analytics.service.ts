import { formatDate } from '../utils/dates';
import { toAmount } from '../utils/money';
import {
  assignBucket,
  averagePainReduction,
  buildBuckets,
  parseMobilityScore,
  type OutcomeRange,
} from '../utils/outcomes';
import { prisma } from '../config/prisma';

export type OutcomesResult = {
  range: OutcomeRange;
  from: string;
  to: string;
  kpis: {
    collected: number;
    newPatients: number;
    followUps: number;
    avgPainReduction: number;
  };
  revenue: { label: string; value: number }[];
  demand: { label: string; newPatients: number; followUps: number }[];
  progress: {
    painImproved: number;
    mobilityImproved: number;
    activePlans: number;
    totalPatients: number;
  };
};

export async function getOutcomes(
  clinicId: string,
  range: OutcomeRange,
): Promise<OutcomesResult> {
  const buckets = buildBuckets(range);
  const from = buckets[0]?.from ?? '';
  const to = buckets[buckets.length - 1]?.to ?? '';

  const [patients, payments] = await Promise.all([
    prisma.patient.findMany({
      where: { clinicId },
      select: {
        painBefore: true,
        painAfter: true,
        mobilityBefore: true,
        mobilityAfter: true,
        status: true,
        visitDate: true,
        followUpDate: true,
      },
    }),
    prisma.payment.findMany({
      where: { patient: { clinicId } },
      select: { amount: true, date: true },
    }),
  ]);

  const revenue = buckets.map((bucket) => ({ label: bucket.label, value: 0 }));
  const demand = buckets.map((bucket) => ({
    label: bucket.label,
    newPatients: 0,
    followUps: 0,
  }));

  let collected = 0;
  let newPatients = 0;
  let followUps = 0;

  for (const payment of payments) {
    const date = formatDate(payment.date);
    if (date < from || date > to) continue;
    collected += toAmount(payment.amount);
    const index = assignBucket(date, buckets);
    if (index >= 0) revenue[index].value = toAmount(revenue[index].value + toAmount(payment.amount));
  }

  for (const patient of patients) {
    const visitDate = formatDate(patient.visitDate);
    if (visitDate >= from && visitDate <= to) {
      newPatients += 1;
      const index = assignBucket(visitDate, buckets);
      if (index >= 0) demand[index].newPatients += 1;
    }

    if (patient.status !== 'COMPLETED') {
      const followUpDate = formatDate(patient.followUpDate);
      if (followUpDate >= from && followUpDate <= to) {
        followUps += 1;
        const index = assignBucket(followUpDate, buckets);
        if (index >= 0) demand[index].followUps += 1;
      }
    }
  }

  const progress = {
    painImproved: patients.filter(
      (patient) => patient.painAfter !== null && patient.painAfter < patient.painBefore,
    ).length,
    mobilityImproved: patients.filter((patient) => {
      const before = parseMobilityScore(patient.mobilityBefore);
      const after = parseMobilityScore(patient.mobilityAfter);
      return before !== null && after !== null && after > before;
    }).length,
    activePlans: patients.filter((patient) => patient.status === 'ACTIVE').length,
    totalPatients: patients.length,
  };

  return {
    range,
    from,
    to,
    kpis: {
      collected,
      newPatients,
      followUps,
      avgPainReduction: averagePainReduction(patients),
    },
    revenue,
    demand,
    progress,
  };
}
