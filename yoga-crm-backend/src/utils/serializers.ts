import type { Exercise, Patient, Payment, PlanLog, Visit } from '@prisma/client';
import { formatDate } from './dates';
import { payMethodToApi, patientStatusToApi } from './enums';
import { toAmount } from './money';
import { balanceOf, creditOf, derivePaymentStatus, type PaymentStatus } from './payment';

export type PatientDTO = {
  id: string;
  patientCode: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  visitDate: string;
  condition: string;
  painBefore: number;
  painAfter: number | null;
  mobilityBefore: string;
  mobilityAfter: string | null;
  notes: string;
  diagnosis: string;
  doctor: string;
  planMonths: number;
  followUpDate: string;
  status: string;
  fee: number;
  paid: number;
  balance: number;
  credit: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
};

export type VisitDTO = {
  id: string;
  patientId: string;
  date: string;
  visitType: string;
  painScore: number | null;
  mobility: number | null;
  treatment: string | null;
  exercises: string | null;
  notes: string | null;
  createdAt: string;
};

export type PaymentDTO = {
  id: string;
  patientId: string;
  amount: number;
  date: string;
  paymentMethod: string;
  reference: string | null;
  notes: string | null;
  createdAt: string;
};

export type ExerciseDTO = {
  id: string;
  name: string;
  frequency: string;
  duration: string;
  notes: string;
  sortOrder: number;
};

export type PlanLogDTO = {
  id: string;
  date: string;
  months: number;
};

export type XrayDTO = {
  id: string;
  patientId: string;
  kind: string;
  date: string;
  bodyArea: string | null;
  title: string | null;
  notes: string | null;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
};

export function serializePatient(patient: Patient): PatientDTO {
  const fee = toAmount(patient.fee);
  const paid = toAmount(patient.paid);

  return {
    id: patient.id,
    patientCode: patient.patientCode,
    name: patient.name,
    age: patient.age,
    gender: patient.gender,
    phone: patient.phone,
    visitDate: formatDate(patient.visitDate),
    condition: patient.condition,
    painBefore: patient.painBefore,
    painAfter: patient.painAfter,
    mobilityBefore: patient.mobilityBefore,
    mobilityAfter: patient.mobilityAfter,
    notes: patient.notes,
    diagnosis: patient.diagnosis,
    doctor: patient.doctor,
    planMonths: patient.planMonths,
    followUpDate: formatDate(patient.followUpDate),
    status: patientStatusToApi(patient.status),
    fee,
    paid,
    balance: balanceOf(fee, paid),
    credit: creditOf(fee, paid),
    paymentStatus: derivePaymentStatus(fee, paid),
    createdAt: patient.createdAt.toISOString(),
    updatedAt: patient.updatedAt.toISOString(),
  };
}

export function serializeVisit(visit: Visit): VisitDTO {
  return {
    id: visit.id,
    patientId: visit.patientId,
    date: formatDate(visit.date),
    visitType: visit.visitType,
    painScore: visit.painScore,
    mobility: visit.mobility,
    treatment: visit.treatment,
    exercises: visit.exercises,
    notes: visit.notes,
    createdAt: visit.createdAt.toISOString(),
  };
}

export function serializePayment(payment: Payment): PaymentDTO {
  return {
    id: payment.id,
    patientId: payment.patientId,
    amount: toAmount(payment.amount),
    date: formatDate(payment.date),
    paymentMethod: payMethodToApi(payment.paymentMethod),
    reference: payment.reference,
    notes: payment.notes,
    createdAt: payment.createdAt.toISOString(),
  };
}

export function serializeExercise(exercise: Exercise): ExerciseDTO {
  return {
    id: exercise.id,
    name: exercise.name,
    frequency: exercise.frequency,
    duration: exercise.duration,
    notes: exercise.notes,
    sortOrder: exercise.sortOrder,
  };
}

export function serializePlanLog(planLog: PlanLog): PlanLogDTO {
  return {
    id: planLog.id,
    date: formatDate(planLog.date),
    months: planLog.months,
  };
}
