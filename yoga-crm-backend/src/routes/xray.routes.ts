import { Router } from 'express';
import {
  createXrayHandler,
  deleteXrayHandler,
  listXraysHandler,
  updateXrayHandler,
} from '../controllers/xray.controller';
import { requireAuth } from '../middleware/auth';
import { uploadImage } from '../middleware/upload';
import { createXraySchema, updateXraySchema } from '../validation/xray.schema';
import { validateBody } from '../validation/validate';

export const xrayRouter = Router();

xrayRouter.get('/patients/:patientId/xrays', requireAuth, listXraysHandler);
xrayRouter.post(
  '/patients/:patientId/xrays',
  requireAuth,
  uploadImage,
  validateBody(createXraySchema),
  createXrayHandler,
);
xrayRouter.patch('/xrays/:id', requireAuth, validateBody(updateXraySchema), updateXrayHandler);
xrayRouter.delete('/xrays/:id', requireAuth, deleteXrayHandler);
