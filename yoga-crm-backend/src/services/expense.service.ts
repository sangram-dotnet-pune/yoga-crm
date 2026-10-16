import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { HttpError } from '../middleware/error';
import { toDate } from '../utils/dates';
import { expenseCategoryToDb, payMethodToDb } from '../utils/enums';
import { serializeExpense, type ExpenseDTO } from '../utils/serializers';
import type {
  CreateExpenseInput,
  ListExpensesQuery,
  UpdateExpenseInput,
} from '../validation/expense.schema';
import { findPatientOrThrow } from './patient.service';

const patientSelect = { select: { name: true } } as const;

async function findExpenseForClinic(clinicId: string, expenseId: string) {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, clinicId },
    include: { patient: patientSelect },
  });
  if (!expense) {
    throw new HttpError(404, 'Expense not found', 'EXPENSE_NOT_FOUND');
  }
  return expense;
}

export async function listExpenses(
  clinicId: string,
  query: ListExpensesQuery = {},
): Promise<ExpenseDTO[]> {
  const where: Prisma.ExpenseWhereInput = { clinicId };
  if (query.category) where.category = expenseCategoryToDb(query.category);
  if (query.search) {
    where.OR = [
      { description: { contains: query.search, mode: 'insensitive' } },
      { notes: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.from || query.to) {
    const date: Prisma.DateTimeFilter = {};
    if (query.from) date.gte = toDate(query.from);
    if (query.to) date.lte = toDate(query.to);
    where.date = date;
  }

  const rows = await prisma.expense.findMany({
    where,
    include: { patient: patientSelect },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
  return rows.map(serializeExpense);
}

export async function createExpense(
  clinicId: string,
  input: CreateExpenseInput,
): Promise<ExpenseDTO> {
  if (input.patientId) {
    await findPatientOrThrow(clinicId, input.patientId);
  }
  const created = await prisma.expense.create({
    data: {
      clinicId,
      date: toDate(input.date),
      category: expenseCategoryToDb(input.category),
      description: input.description,
      amount: input.amount,
      paymentMethod: payMethodToDb(input.paymentMethod),
      patientId: input.patientId ?? null,
      notes: input.notes ?? null,
    },
    include: { patient: patientSelect },
  });
  return serializeExpense(created);
}

export async function updateExpense(
  clinicId: string,
  expenseId: string,
  input: UpdateExpenseInput,
): Promise<ExpenseDTO> {
  await findExpenseForClinic(clinicId, expenseId);

  if (input.patientId !== undefined && input.patientId !== null) {
    await findPatientOrThrow(clinicId, input.patientId);
  }

  const data: Prisma.ExpenseUpdateInput = {};
  if (input.date !== undefined) data.date = toDate(input.date);
  if (input.category !== undefined) data.category = expenseCategoryToDb(input.category);
  if (input.description !== undefined) data.description = input.description;
  if (input.amount !== undefined) data.amount = input.amount;
  if (input.paymentMethod !== undefined) data.paymentMethod = payMethodToDb(input.paymentMethod);
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.patientId !== undefined) {
    data.patient = input.patientId ? { connect: { id: input.patientId } } : { disconnect: true };
  }

  const updated = await prisma.expense.update({
    where: { id: expenseId },
    data,
    include: { patient: patientSelect },
  });
  return serializeExpense(updated);
}

export async function deleteExpense(clinicId: string, expenseId: string): Promise<void> {
  await findExpenseForClinic(clinicId, expenseId);
  await prisma.expense.delete({ where: { id: expenseId } });
}
