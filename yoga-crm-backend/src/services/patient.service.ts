import type { Patient, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { HttpError } from '../middleware/error';
import { addDaysISO, formatDate, toDate, todayISO } from '../utils/dates';
import { patientStatusToDb, type PatientStatusLabel } from '../utils/enums';
import { generatePatientCode } from '../utils/patientCode';
import {
  serializeExercise,
  serializePatient,
  serializePayment,
  serializePlanLog,
  serializeVisit,
  type PatientDTO,
} from '../utils/serializers';
import type {
  CreatePatientInput,
  ListPatientsQuery,
  UpdatePatientInput,
} from '../validation/patient.schema';

export type PatientListResult = {
  items: PatientDTO[];
  total: number;
  page: number;
  pageSize: number;
};

const DEFAULT_PAGE_SIZE = 25;

export async function listPatients(
  clinicId: string,
  query: ListPatientsQuery,
): Promise<PatientListResult> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

  const where: Prisma.PatientWhereInput = { clinicId };
  if (query.status) {
    where.status = patientStatusToDb(query.status as PatientStatusLabel);
  }
  if (query.search) {
    const term = query.search;
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { patientCode: { contains: term, mode: 'insensitive' } },
      { condition: { contains: term, mode: 'insensitive' } },
      { phone: { contains: term, mode: 'insensitive' } },
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.patient.count({ where }),
    prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { items: rows.map(serializePatient), total, page, pageSize };
}

export async function getPatientDetail(clinicId: string, patientId: string) {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId },
    include: {
      visits: { orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] },
      payments: { orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] },
      exercises: { orderBy: { sortOrder: 'asc' } },
      planLogs: { orderBy: { date: 'asc' } },
    },
  });

  if (!patient) {
    throw new HttpError(404, 'Patient not found', 'PATIENT_NOT_FOUND');
  }

  return {
    ...serializePatient(patient),
    visits: patient.visits.map(serializeVisit),
    payments: patient.payments.map(serializePayment),
    exercises: patient.exercises.map(serializeExercise),
    planLog: patient.planLogs.map(serializePlanLog),
  };
}

export async function findPatientOrThrow(clinicId: string, patientId: string): Promise<Patient> {
  const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId } });
  if (!patient) {
    throw new HttpError(404, 'Patient not found', 'PATIENT_NOT_FOUND');
  }
  return patient;
}

export async function createPatient(
  clinicId: string,
  input: CreatePatientInput,
): Promise<PatientDTO> {
  const visitDate = input.visitDate ?? todayISO();
  const patientCode = await generatePatientCode(clinicId);

  const created = await prisma.patient.create({
    data: {
      clinicId,
      patientCode,
      name: input.name,
      age: input.age ?? 0,
      gender: input.gender ?? '',
      phone: input.phone ?? '',
      visitDate: toDate(visitDate),
      condition: input.condition,
      painBefore: input.painBefore ?? 0,
      painAfter: input.painAfter ?? null,
      mobilityBefore: input.mobilityBefore ?? 'Not recorded',
      mobilityAfter: input.mobilityAfter ?? null,
      notes: input.notes ?? '',
      diagnosis: input.diagnosis ?? '',
      doctor: input.doctor ?? '',
      planMonths: input.planMonths ?? 3,
      followUpDate: toDate(input.followUpDate ?? addDaysISO(visitDate, 90)),
      status: patientStatusToDb(input.status ?? 'Active'),
      fee: input.fee ?? 0,
      paid: input.paid ?? 0,
    },
  });

  return serializePatient(created);
}

export async function updatePatient(
  clinicId: string,
  patientId: string,
  input: UpdatePatientInput,
): Promise<PatientDTO> {
  const existing = await prisma.patient.findFirst({
    where: { id: patientId, clinicId },
    include: { planLogs: { select: { id: true } } },
  });
  if (!existing) {
    throw new HttpError(404, 'Patient not found', 'PATIENT_NOT_FOUND');
  }

  const data: Prisma.PatientUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.condition !== undefined) data.condition = input.condition;
  if (input.age !== undefined) data.age = input.age;
  if (input.gender !== undefined) data.gender = input.gender;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.visitDate !== undefined) data.visitDate = toDate(input.visitDate);
  if (input.painBefore !== undefined) data.painBefore = input.painBefore;
  if (input.painAfter !== undefined) data.painAfter = input.painAfter;
  if (input.mobilityBefore !== undefined) data.mobilityBefore = input.mobilityBefore;
  if (input.mobilityAfter !== undefined) data.mobilityAfter = input.mobilityAfter;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.diagnosis !== undefined) data.diagnosis = input.diagnosis;
  if (input.doctor !== undefined) data.doctor = input.doctor;
  if (input.planMonths !== undefined) data.planMonths = input.planMonths;
  if (input.followUpDate !== undefined) data.followUpDate = toDate(input.followUpDate);
  if (input.status !== undefined) data.status = patientStatusToDb(input.status);
  if (input.fee !== undefined) data.fee = input.fee;
  if (input.paid !== undefined) data.paid = input.paid;

  const planMonthsChanged =
    input.planMonths !== undefined && input.planMonths !== existing.planMonths;

  const updated = await prisma.$transaction(async (tx) => {
    const patient = await tx.patient.update({ where: { id: patientId }, data });

    if (planMonthsChanged && input.planMonths !== undefined) {
      const hasLogs = existing.planLogs.length > 0;
      await tx.planLog.create({
        data: {
          patientId,
          months: input.planMonths,
          date: toDate(hasLogs ? todayISO() : formatDate(existing.visitDate)),
        },
      });
    }

    return patient;
  });

  return serializePatient(updated);
}

export async function deletePatient(clinicId: string, patientId: string): Promise<void> {
  await findPatientOrThrow(clinicId, patientId);
  await prisma.patient.delete({ where: { id: patientId } });
}
