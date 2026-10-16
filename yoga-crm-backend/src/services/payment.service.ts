import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { HttpError } from '../middleware/error';
import { toDate } from '../utils/dates';
import { payMethodToDb } from '../utils/enums';
import { toAmount } from '../utils/money';
import {
  serializePatient,
  serializePayment,
  type PatientDTO,
  type PaymentDTO,
} from '../utils/serializers';
import type {
  CreatePaymentInput,
  UpdatePaymentInput,
} from '../validation/payment.schema';
import { findPatientOrThrow } from './patient.service';

async function syncPaidFromLedger(tx: Prisma.TransactionClient, patientId: string) {
  const aggregate = await tx.payment.aggregate({
    where: { patientId },
    _sum: { amount: true },
  });
  const total = toAmount(aggregate._sum.amount ?? 0);
  return tx.patient.update({ where: { id: patientId }, data: { paid: total } });
}

export async function listPayments(
  clinicId: string,
  patientId: string,
): Promise<PaymentDTO[]> {
  await findPatientOrThrow(clinicId, patientId);
  const payments = await prisma.payment.findMany({
    where: { patientId },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
  return payments.map(serializePayment);
}

export async function createPayment(
  clinicId: string,
  patientId: string,
  input: CreatePaymentInput,
): Promise<{ payment: PaymentDTO; patient: PatientDTO }> {
  await findPatientOrThrow(clinicId, patientId);

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        patientId,
        amount: input.amount,
        date: toDate(input.date),
        paymentMethod: payMethodToDb(input.paymentMethod),
        reference: input.reference ?? null,
        notes: input.notes ?? null,
      },
    });
    const patient = await syncPaidFromLedger(tx, patientId);
    return { payment, patient };
  });

  return { payment: serializePayment(result.payment), patient: serializePatient(result.patient) };
}

async function findPaymentForClinic(clinicId: string, paymentId: string) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, patient: { clinicId } },
  });
  if (!payment) {
    throw new HttpError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
  }
  return payment;
}

export async function updatePayment(
  clinicId: string,
  paymentId: string,
  input: UpdatePaymentInput,
): Promise<{ payment: PaymentDTO; patient: PatientDTO }> {
  const existing = await findPaymentForClinic(clinicId, paymentId);

  const data: Prisma.PaymentUpdateInput = {};
  if (input.amount !== undefined) data.amount = input.amount;
  if (input.date !== undefined) data.date = toDate(input.date);
  if (input.paymentMethod !== undefined) data.paymentMethod = payMethodToDb(input.paymentMethod);
  if (input.reference !== undefined) data.reference = input.reference;
  if (input.notes !== undefined) data.notes = input.notes;

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({ where: { id: paymentId }, data });
    const patient = await syncPaidFromLedger(tx, existing.patientId);
    return { payment, patient };
  });

  return { payment: serializePayment(result.payment), patient: serializePatient(result.patient) };
}

export async function deletePayment(
  clinicId: string,
  paymentId: string,
): Promise<{ patient: PatientDTO }> {
  const existing = await findPaymentForClinic(clinicId, paymentId);

  const patient = await prisma.$transaction(async (tx) => {
    await tx.payment.delete({ where: { id: paymentId } });
    return syncPaidFromLedger(tx, existing.patientId);
  });

  return { patient: serializePatient(patient) };
}

export async function reconcilePaid(clinicId: string, patientId: string): Promise<PatientDTO> {
  await findPatientOrThrow(clinicId, patientId);
  const patient = await prisma.$transaction((tx) => syncPaidFromLedger(tx, patientId));
  return serializePatient(patient);
}
