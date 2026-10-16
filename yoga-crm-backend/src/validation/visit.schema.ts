import { z } from 'zod';
import { dateString, optionalScaledInt } from './common';

export const createVisitSchema = z.object({
  date: dateString,
  visitType: z.string().trim().min(1, 'Visit type is required'),
  painScore: optionalScaledInt(0, 10),
  mobility: optionalScaledInt(0, 100),
  treatment: z.string().trim().nullable().optional(),
  exercises: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
});

export const updateVisitSchema = createVisitSchema.partial();

export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;
