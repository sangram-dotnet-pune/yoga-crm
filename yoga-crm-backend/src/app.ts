import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error';
import { authRouter } from './routes/auth.routes';
import { appointmentRouter } from './routes/appointment.routes';
import { exerciseRouter } from './routes/exercise.routes';
import { expenseRouter } from './routes/expense.routes';
import { healthRouter } from './routes/health.routes';
import { outcomesRouter } from './routes/outcomes.routes';
import { patientRouter } from './routes/patient.routes';
import { paymentRouter } from './routes/payment.routes';
import { visitRouter } from './routes/visit.routes';
import { xrayRouter } from './routes/xray.routes';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  app.use(
    '/api',
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    }),
  );

  app.get('/api', (_req, res) => {
    res.json({ name: 'yogacare-api', version: '0.1.0' });
  });

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/patients', patientRouter);
  app.use('/api', visitRouter);
  app.use('/api', exerciseRouter);
  app.use('/api', paymentRouter);
  app.use('/api', xrayRouter);
  app.use('/api', appointmentRouter);
  app.use('/api', expenseRouter);
  app.use('/api', outcomesRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
