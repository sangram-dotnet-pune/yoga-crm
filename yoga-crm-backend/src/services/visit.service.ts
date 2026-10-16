import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { HttpError } from '../middleware/error';
import { toDate } from '../utils/dates';
import { serializeVisit, type VisitDTO } from '../utils/serializers';
import type { CreateVisitInput, UpdateVisitInput } from '../validation/visit.schema';
import { findPatientOrThrow } from './patient.service';

export async function listVisits(clinicId: string, patientId: string): Promise<VisitDTO[]> {
  await findPatientOrThrow(clinicId, patientId);
  const visits = await prisma.visit.findMany({
    where: { patientId },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
  return visits.map(serializeVisit);
}

export async function createVisit(
  clinicId: string,
  patientId: string,
  input: CreateVisitInput,
): Promise<VisitDTO> {
  await findPatientOrThrow(clinicId, patientId);
  const visit = await prisma.visit.create({
    data: {
      patientId,
      date: toDate(input.date),
      visitType: input.visitType,
      painScore: input.painScore ?? null,
      mobility: input.mobility ?? null,
      treatment: input.treatment ?? null,
      exercises: input.exercises ?? null,
      notes: input.notes ?? null,
    },
  });
  return serializeVisit(visit);
}

async function findVisitForClinic(clinicId: string, visitId: string) {
  const visit = await prisma.visit.findFirst({ where: { id: visitId, patient: { clinicId } } });
  if (!visit) {
    throw new HttpError(404, 'Visit not found', 'VISIT_NOT_FOUND');
  }
  return visit;
}

export async function updateVisit(
  clinicId: string,
  visitId: string,
  input: UpdateVisitInput,
): Promise<VisitDTO> {
  await findVisitForClinic(clinicId, visitId);

  const data: Prisma.VisitUpdateInput = {};
  if (input.date !== undefined) data.date = toDate(input.date);
  if (input.visitType !== undefined) data.visitType = input.visitType;
  if (input.painScore !== undefined) data.painScore = input.painScore;
  if (input.mobility !== undefined) data.mobility = input.mobility;
  if (input.treatment !== undefined) data.treatment = input.treatment;
  if (input.exercises !== undefined) data.exercises = input.exercises;
  if (input.notes !== undefined) data.notes = input.notes;

  const updated = await prisma.visit.update({ where: { id: visitId }, data });
  return serializeVisit(updated);
}

export async function deleteVisit(clinicId: string, visitId: string): Promise<void> {
  await findVisitForClinic(clinicId, visitId);
  await prisma.visit.delete({ where: { id: visitId } });
}
