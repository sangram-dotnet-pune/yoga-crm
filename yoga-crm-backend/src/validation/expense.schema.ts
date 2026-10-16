import { z } from 'zod';
import { dateString, payMethodSchema } from './common';
import { EXPENSE_CATEGORIES } from '../utils/enums';

export const expenseCategorySchema = z.enum(EXPENSE_CATEGORIES);

export const createExpenseSchema = z.object({
  date: dateString,
  category: expenseCategorySchema,
  description: z.string().trim().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be greater than zero').max(10_000_000),
  paymentMethod: payMethodSchema,
  patientId: z.string().min(1).nullable().optional(),
  notes: z.string().trim().nullable().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const listExpensesQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: expenseCategorySchema.optional(),
  from: dateString.optional(),
  to: dateString.optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
