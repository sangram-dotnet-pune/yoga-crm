import { Router } from 'express';
import {
  createPatientHandler,
  deletePatientHandler,
  getPatientHandler,
  listPatientsHandler,
  updatePatientHandler,
} from '../controllers/patient.controller';
import { getPatientReportHandler } from '../controllers/report.controller';
import { requireAuth } from '../middleware/auth';
import { createPatientSchema, updatePatientSchema } from '../validation/patient.schema';
import { validateBody } from '../validation/validate';

export const patientRouter = Router();

patientRouter.get('/', requireAuth, listPatientsHandler);
patientRouter.post('/', requireAuth, validateBody(createPatientSchema), createPatientHandler);
patientRouter.get('/:id/report', requireAuth, getPatientReportHandler);
patientRouter.get('/:id', requireAuth, getPatientHandler);
patientRouter.patch('/:id', requireAuth, validateBody(updatePatientSchema), updatePatientHandler);
patientRouter.delete('/:id', requireAuth, deletePatientHandler);
