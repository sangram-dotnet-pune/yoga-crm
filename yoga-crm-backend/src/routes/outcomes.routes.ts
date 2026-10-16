import { Router } from 'express';
import { getOutcomesHandler } from '../controllers/outcomes.controller';
import { requireAuth } from '../middleware/auth';

export const outcomesRouter = Router();

outcomesRouter.get('/outcomes', requireAuth, getOutcomesHandler);
