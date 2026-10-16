import { z } from 'zod';
import { dateString } from './common';
import { APPT_STATUSES } from '../utils/enums';

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected a 24-hour HH:mm time');

export const apptStatusSchema = z.enum(APPT_STATUSES);

export const createAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  date: dateString,
  startTime: timeString,
  endTime: timeString,
  type: z.string().trim().min(1, 'Type is required'),
  status: apptStatusSchema.optional(),
  notes: z.string().trim().nullable().optional(),
});

export const updateAppointmentSchema = createAppointmentSchema.partial();

export const listAppointmentsQuerySchema = z.object({
  from: dateString.optional(),
  to: dateString.optional(),
  patientId: z.string().min(1).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;
