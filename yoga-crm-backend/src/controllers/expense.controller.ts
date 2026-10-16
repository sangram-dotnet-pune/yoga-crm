import type { RequestHandler } from 'express';
import {
  createExpense,
  deleteExpense,
  listExpenses,
  updateExpense,
} from '../services/expense.service';
import { clinicIdOf, paramOf } from '../utils/context';
import { listExpensesQuerySchema } from '../validation/expense.schema';

export const listExpensesHandler: RequestHandler = async (req, res) => {
  const query = listExpensesQuerySchema.parse(req.query);
  res.json(await listExpenses(clinicIdOf(req), query));
};

export const createExpenseHandler: RequestHandler = async (req, res) => {
  res.status(201).json(await createExpense(clinicIdOf(req), req.body));
};

export const updateExpenseHandler: RequestHandler = async (req, res) => {
  res.json(await updateExpense(clinicIdOf(req), paramOf(req, 'id'), req.body));
};

export const deleteExpenseHandler: RequestHandler = async (req, res) => {
  await deleteExpense(clinicIdOf(req), paramOf(req, 'id'));
  res.status(204).end();
};
