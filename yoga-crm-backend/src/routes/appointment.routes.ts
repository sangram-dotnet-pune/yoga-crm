import { Router } from 'express';
import {
  createAppointmentHandler,
  deleteAppointmentHandler,
  listAppointmentsHandler,
  updateAppointmentHandler,
} from '../controllers/appointment.controller';
import { requireAuth } from '../middleware/auth';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
} from '../validation/appointment.schema';
import { validateBody } from '../validation/validate';

export const appointmentRouter = Router();

appointmentRouter.get('/appointments', requireAuth, listAppointmentsHandler);
appointmentRouter.post(
  '/appointments',
  requireAuth,
  validateBody(createAppointmentSchema),
  createAppointmentHandler,
);
appointmentRouter.patch(
  '/appointments/:id',
  requireAuth,
  validateBody(updateAppointmentSchema),
  updateAppointmentHandler,
);
appointmentRouter.delete('/appointments/:id', requireAuth, deleteAppointmentHandler);
