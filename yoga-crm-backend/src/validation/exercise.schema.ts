import { z } from 'zod';

export const exerciseSchema = z.object({
  name: z.string().trim().min(1, 'Exercise name is required'),
  frequency: z.string().trim().optional(),
  duration: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const replaceExercisesSchema = z.object({
  exercises: z.array(exerciseSchema).max(100),
});

export type ExerciseInput = z.infer<typeof exerciseSchema>;
export type ReplaceExercisesInput = z.infer<typeof replaceExercisesSchema>;
