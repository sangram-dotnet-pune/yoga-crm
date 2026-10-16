import { apiFetch } from "./api";
import type { Expense, ExpenseCategory, ExpenseInput } from "./types";

type ListParams = {
  search?: string;
  category?: ExpenseCategory;
  from?: string;
  to?: string;
};

export function listExpenses(params: ListParams = {}): Promise<Expense[]> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<Expense[]>(`/expenses${suffix}`);
}

export function createExpense(input: ExpenseInput): Promise<Expense> {
  return apiFetch<Expense>("/expenses", { method: "POST", body: JSON.stringify(input) });
}

export function updateExpense(id: string, input: Partial<ExpenseInput>): Promise<Expense> {
  return apiFetch<Expense>(`/expenses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteExpense(id: string): Promise<void> {
  return apiFetch<void>(`/expenses/${id}`, { method: "DELETE" });
}
