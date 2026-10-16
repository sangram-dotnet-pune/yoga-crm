"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { createExpense, updateExpense } from "@/lib/expenses";
import { toOptionalNumber, todayISO } from "@/lib/format";
import {
  EXPENSE_CATEGORIES,
  PAY_METHODS,
  type Expense,
  type ExpenseCategory,
  type ExpenseInput,
  type PayMethod,
} from "@/lib/types";
import { Button, Field, Modal, Spinner, inputClass } from "@/components/ui";
import { PatientSelect } from "@/components/PatientSelect";

type FormState = {
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: string;
  paymentMethod: PayMethod;
  patientId: string;
  notes: string;
};

function emptyForm(): FormState {
  return {
    date: todayISO(),
    category: "Supplies",
    description: "",
    amount: "",
    paymentMethod: "Cash",
    patientId: "",
    notes: "",
  };
}

function fromExpense(expense: Expense): FormState {
  return {
    date: expense.date,
    category: expense.category,
    description: expense.description,
    amount: String(expense.amount),
    paymentMethod: expense.paymentMethod,
    patientId: expense.patientId ?? "",
    notes: expense.notes ?? "",
  };
}

export function ExpenseForm({
  onClose,
  onSaved,
  expense,
}: {
  onClose: () => void;
  onSaved: () => void;
  expense?: Expense;
}) {
  const editing = Boolean(expense);
  const [form, setForm] = useState<FormState>(() => (expense ? fromExpense(expense) : emptyForm()));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const amount = toOptionalNumber(form.amount);
    if (!amount || amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    const input: ExpenseInput = {
      date: form.date,
      category: form.category,
      description: form.description.trim(),
      amount,
      paymentMethod: form.paymentMethod,
      patientId: form.patientId || null,
      notes: form.notes.trim() || null,
    };

    setSubmitting(true);
    try {
      if (editing && expense) {
        await updateExpense(expense.id, input);
      } else {
        await createExpense(input);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save expense.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "Edit expense" : "New expense"}
      description="Track clinic spending by category."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="expense-form" disabled={submitting}>
            {submitting ? <Spinner /> : null}
            {editing ? "Save changes" : "Add expense"}
          </Button>
        </>
      }
    >
      <form id="expense-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {error ? (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" htmlFor="ef-date">
            <input
              id="ef-date"
              type="date"
              className={inputClass}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              required
            />
          </Field>
          <Field label="Category" htmlFor="ef-category">
            <select
              id="ef-category"
              className={inputClass}
              value={form.category}
              onChange={(e) => set("category", e.target.value as ExpenseCategory)}
            >
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Description" htmlFor="ef-description">
          <input
            id="ef-description"
            className={inputClass}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="e.g. Resistance bands, October rent"
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount (₹)" htmlFor="ef-amount">
            <input
              id="ef-amount"
              type="number"
              min={1}
              step="0.01"
              className={inputClass}
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              required
            />
          </Field>
          <Field label="Payment method" htmlFor="ef-method">
            <select
              id="ef-method"
              className={inputClass}
              value={form.paymentMethod}
              onChange={(e) => set("paymentMethod", e.target.value as PayMethod)}
            >
              {PAY_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <PatientSelect
          id="ef-patient"
          label="Patient (optional)"
          value={form.patientId}
          onChange={(value) => set("patientId", value)}
          emptyLabel="Not linked to a patient"
        />

        <Field label="Notes" htmlFor="ef-notes">
          <textarea
            id="ef-notes"
            rows={2}
            className={inputClass}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
}
