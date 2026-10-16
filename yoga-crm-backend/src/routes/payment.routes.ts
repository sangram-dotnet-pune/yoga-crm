import { Router } from 'express';
import {
  createPaymentHandler,
  deletePaymentHandler,
  listPaymentsHandler,
  reconcilePaymentsHandler,
  updatePaymentHandler,
} from '../controllers/payment.controller';
import { requireAuth } from '../middleware/auth';
import { createPaymentSchema, updatePaymentSchema } from '../validation/payment.schema';
import { validateBody } from '../validation/validate';

export const paymentRouter = Router();

paymentRouter.get('/patients/:patientId/payments', requireAuth, listPaymentsHandler);
paymentRouter.post(
  '/patients/:patientId/payments',
  requireAuth,
  validateBody(createPaymentSchema),
  createPaymentHandler,
);
paymentRouter.post('/patients/:patientId/payments/reconcile', requireAuth, reconcilePaymentsHandler);
paymentRouter.patch(
  '/payments/:id',
  requireAuth,
  validateBody(updatePaymentSchema),
  updatePaymentHandler,
);
paymentRouter.delete('/payments/:id', requireAuth, deletePaymentHandler);
