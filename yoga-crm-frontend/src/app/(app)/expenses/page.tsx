"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Receipt, Search, Trash2 } from "lucide-react";
import { ApiError } from "@/lib/api";
import { deleteExpense, listExpenses } from "@/lib/expenses";
import { formatCurrency, formatDate } from "@/lib/format";
import { EXPENSE_CATEGORIES, type Expense, type ExpenseCategory } from "@/lib/types";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  inputClass,
} from "@/components/ui";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ExpenseCategory | "">("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  useEffect(() => {
    let active = true;
    listExpenses()
      .then((rows) => {
        if (!active) return;
        setExpenses(rows);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Unable to load expenses.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  function refresh() {
    setLoading(true);
    setReloadKey((key) => key + 1);
  }

  async function onDelete(expense: Expense) {
    if (!window.confirm(`Delete "${expense.description}"?`)) return;
    try {
      await deleteExpense(expense.id);
      setExpenses((rows) => (rows ? rows.filter((row) => row.id !== expense.id) : rows));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete expense.");
    }
  }

  const term = search.trim().toLowerCase();
  const visible = (expenses ?? []).filter((expense) => {
    if (category && expense.category !== category) return false;
    if (term) {
      const haystack = `${expense.description} ${expense.patientName ?? ""}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
  const total = visible.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Clinic expense tracking."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} aria-hidden />
            New expense
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            placeholder="Search by description or patient"
            aria-label="Search expenses"
            className={`${inputClass} pl-9`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter by category"
          className={`${inputClass} sm:w-48`}
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory | "")}
        >
          <option value="">All categories</option>
          {EXPENSE_CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {error ? <ErrorState message={error} /> : null}

      {loading && !expenses ? (
        <LoadingState label="Loading expenses…" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Receipt size={28} aria-hidden />}
          title={expenses && expenses.length > 0 ? "No matching expenses" : "No expenses yet"}
          description={
            expenses && expenses.length > 0
              ? "Try a different category or search term."
              : "Record your first expense to start tracking clinic spending."
          }
          action={
            !expenses || expenses.length === 0 ? (
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus size={16} aria-hidden />
                New expense
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-border bg-background/60 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b border-border last:border-0 hover:bg-background/60"
                  >
                    <td className="px-4 py-3 text-muted">{formatDate(expense.date)}</td>
                    <td className="px-4 py-3">
                      <Badge tone="neutral">{expense.category}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{expense.description}</p>
                      {expense.notes ? (
                        <p className="text-xs text-muted">{expense.notes}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted">{expense.patientName ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{expense.paymentMethod}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          aria-label="Edit expense"
                          onClick={() => {
                            setEditing(expense);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil size={16} aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          aria-label="Delete expense"
                          onClick={() => void onDelete(expense)}
                        >
                          <Trash2 size={16} aria-hidden />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-background/60">
                  <td className="px-4 py-3 font-medium" colSpan={5}>
                    {visible.length} expense{visible.length === 1 ? "" : "s"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {formatCurrency(total)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {formOpen ? (
        <ExpenseForm
          expense={editing ?? undefined}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSaved={refresh}
        />
      ) : null}
    </div>
  );
}
