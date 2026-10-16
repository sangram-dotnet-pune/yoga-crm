import { Router } from 'express';
import {
  createVisitHandler,
  deleteVisitHandler,
  listVisitsHandler,
  updateVisitHandler,
} from '../controllers/visit.controller';
import { requireAuth } from '../middleware/auth';
import { createVisitSchema, updateVisitSchema } from '../validation/visit.schema';
import { validateBody } from '../validation/validate';

export const visitRouter = Router();

visitRouter.get('/patients/:patientId/visits', requireAuth, listVisitsHandler);
visitRouter.post(
  '/patients/:patientId/visits',
  requireAuth,
  validateBody(createVisitSchema),
  createVisitHandler,
);
visitRouter.patch(
  '/visits/:id',
  requireAuth,
  validateBody(updateVisitSchema),
  updateVisitHandler,
);
visitRouter.delete('/visits/:id', requireAuth, deleteVisitHandler);
