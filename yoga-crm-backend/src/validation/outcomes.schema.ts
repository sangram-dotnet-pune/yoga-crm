import { z } from 'zod';
import { OUTCOME_RANGES } from '../utils/outcomes';

export const outcomesQuerySchema = z.object({
  range: z.enum(OUTCOME_RANGES).default('month'),
});

export type OutcomesQuery = z.infer<typeof outcomesQuerySchema>;
