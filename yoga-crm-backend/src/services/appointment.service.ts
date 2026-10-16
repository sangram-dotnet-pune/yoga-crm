import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { HttpError } from '../middleware/error';
import { toDate } from '../utils/dates';
import { apptStatusToDb } from '../utils/enums';
import { serializeAppointment, type AppointmentDTO } from '../utils/serializers';
import type {
  CreateAppointmentInput,
  ListAppointmentsQuery,
  UpdateAppointmentInput,
} from '../validation/appointment.schema';
import { findPatientOrThrow } from './patient.service';

const patientSelect = { select: { name: true, patientCode: true } } as const;

async function findAppointmentForClinic(clinicId: string, appointmentId: string) {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, patient: { clinicId } },
    include: { patient: patientSelect },
  });
  if (!appointment) {
    throw new HttpError(404, 'Appointment not found', 'APPOINTMENT_NOT_FOUND');
  }
  return appointment;
}

export async function listAppointments(
  clinicId: string,
  query: ListAppointmentsQuery = {},
): Promise<AppointmentDTO[]> {
  const where: Prisma.AppointmentWhereInput = { patient: { clinicId } };
  if (query.patientId) where.patientId = query.patientId;
  if (query.from || query.to) {
    const date: Prisma.DateTimeFilter = {};
    if (query.from) date.gte = toDate(query.from);
    if (query.to) date.lte = toDate(query.to);
    where.date = date;
  }

  const rows = await prisma.appointment.findMany({
    where,
    include: { patient: patientSelect },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });
  return rows.map(serializeAppointment);
}

export async function createAppointment(
  clinicId: string,
  input: CreateAppointmentInput,
): Promise<AppointmentDTO> {
  await findPatientOrThrow(clinicId, input.patientId);
  const created = await prisma.appointment.create({
    data: {
      patientId: input.patientId,
      date: toDate(input.date),
      startTime: input.startTime,
      endTime: input.endTime,
      type: input.type,
      status: apptStatusToDb(input.status ?? 'Scheduled'),
      notes: input.notes ?? null,
    },
    include: { patient: patientSelect },
  });
  return serializeAppointment(created);
}

export async function updateAppointment(
  clinicId: string,
  appointmentId: string,
  input: UpdateAppointmentInput,
): Promise<AppointmentDTO> {
  await findAppointmentForClinic(clinicId, appointmentId);

  if (input.patientId !== undefined) {
    await findPatientOrThrow(clinicId, input.patientId);
  }

  const data: Prisma.AppointmentUpdateInput = {};
  if (input.patientId !== undefined) data.patient = { connect: { id: input.patientId } };
  if (input.date !== undefined) data.date = toDate(input.date);
  if (input.startTime !== undefined) data.startTime = input.startTime;
  if (input.endTime !== undefined) data.endTime = input.endTime;
  if (input.type !== undefined) data.type = input.type;
  if (input.status !== undefined) data.status = apptStatusToDb(input.status);
  if (input.notes !== undefined) data.notes = input.notes;

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data,
    include: { patient: patientSelect },
  });
  return serializeAppointment(updated);
}

export async function deleteAppointment(clinicId: string, appointmentId: string): Promise<void> {
  await findAppointmentForClinic(clinicId, appointmentId);
  await prisma.appointment.delete({ where: { id: appointmentId } });
}
