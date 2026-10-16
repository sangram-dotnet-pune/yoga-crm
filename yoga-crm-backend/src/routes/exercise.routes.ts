import { Router } from 'express';
import {
  listExercisesHandler,
  replaceExercisesHandler,
} from '../controllers/exercise.controller';
import { requireAuth } from '../middleware/auth';
import { replaceExercisesSchema } from '../validation/exercise.schema';
import { validateBody } from '../validation/validate';

export const exerciseRouter = Router();

exerciseRouter.get('/patients/:patientId/exercises', requireAuth, listExercisesHandler);
exerciseRouter.put(
  '/patients/:patientId/exercises',
  requireAuth,
  validateBody(replaceExercisesSchema),
  replaceExercisesHandler,
);
