import { Router } from 'express';
import {
  createExpenseHandler,
  deleteExpenseHandler,
  listExpensesHandler,
  updateExpenseHandler,
} from '../controllers/expense.controller';
import { requireAuth } from '../middleware/auth';
import { createExpenseSchema, updateExpenseSchema } from '../validation/expense.schema';
import { validateBody } from '../validation/validate';

export const expenseRouter = Router();

expenseRouter.get('/expenses', requireAuth, listExpensesHandler);
expenseRouter.post(
  '/expenses',
  requireAuth,
  validateBody(createExpenseSchema),
  createExpenseHandler,
);
expenseRouter.patch(
  '/expenses/:id',
  requireAuth,
  validateBody(updateExpenseSchema),
  updateExpenseHandler,
);
expenseRouter.delete('/expenses/:id', requireAuth, deleteExpenseHandler);
