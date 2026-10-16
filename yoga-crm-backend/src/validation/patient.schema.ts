import { z } from 'zod';
import {
  dateString,
  intInRange,
  optionalMoney,
  optionalScaledInt,
  patientStatusSchema,
} from './common';

export const createPatientSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  condition: z.string().trim().min(1, 'Condition is required'),
  age: intInRange(0, 120).optional(),
  gender: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  visitDate: dateString.optional(),
  painBefore: intInRange(0, 10).optional(),
  painAfter: optionalScaledInt(0, 10),
  mobilityBefore: z.string().trim().optional(),
  mobilityAfter: z.string().trim().nullable().optional(),
  notes: z.string().trim().optional(),
  diagnosis: z.string().trim().optional(),
  doctor: z.string().trim().optional(),
  planMonths: intInRange(1, 36).optional(),
  followUpDate: dateString.optional(),
  status: patientStatusSchema.optional(),
  fee: optionalMoney(10_000_000),
  paid: optionalMoney(10_000_000),
});

export const updatePatientSchema = createPatientSchema.partial();

export const listPatientsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: patientStatusSchema.optional(),
  page: intInRange(1, 10_000).optional(),
  pageSize: intInRange(1, 100).optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type ListPatientsQuery = z.infer<typeof listPatientsQuerySchema>;
