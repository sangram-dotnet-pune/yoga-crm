import { z } from 'zod';
import { dateString, payMethodSchema } from './common';

export const createPaymentSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than zero').max(10_000_000),
  date: dateString,
  paymentMethod: payMethodSchema,
  reference: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
});

export const updatePaymentSchema = createPaymentSchema.partial();

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
