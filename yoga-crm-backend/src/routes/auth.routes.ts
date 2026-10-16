import { Router } from 'express';
import {
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
} from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { loginSchema } from '../validation/auth.schema';
import { validateBody } from '../validation/validate';

export const authRouter = Router();

authRouter.post('/login', validateBody(loginSchema), loginHandler);
authRouter.post('/refresh', refreshHandler);
authRouter.post('/logout', logoutHandler);
authRouter.get('/me', requireAuth, meHandler);
