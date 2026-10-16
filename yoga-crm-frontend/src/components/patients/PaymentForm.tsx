"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { createPayment } from "@/lib/patients";
import { todayISO, toOptionalNumber } from "@/lib/format";
import { PAY_METHODS, type PayMethod, type Patient, type PaymentInput } from "@/lib/types";
import { Button, Field, Modal, Spinner, inputClass } from "@/components/ui";

type FormState = {
  amount: string;
  date: string;
  paymentMethod: PayMethod;
  reference: string;
  notes: string;
};

function emptyForm(): FormState {
  return {
    amount: "",
    date: todayISO(),
    paymentMethod: "Cash",
    reference: "",
    notes: "",
  };
}

export function PaymentForm({
  onClose,
  onSaved,
  patientId,
}: {
  onClose: () => void;
  onSaved: (patient: Patient) => void;
  patientId: string;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
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

    const input: PaymentInput = {
      amount,
      date: form.date,
      paymentMethod: form.paymentMethod,
      reference: form.reference.trim() || null,
      notes: form.notes.trim() || null,
    };

    setSubmitting(true);
    try {
      const result = await createPayment(patientId, input);
      onSaved(result.patient);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to record payment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Record payment"
      description="Payments update the patient's paid total and balance."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="payment-form" disabled={submitting}>
            {submitting ? <Spinner /> : null}
            Add payment
          </Button>
        </>
      }
    >
      <form id="payment-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {error ? (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount" htmlFor="pay-amount">
            <input
              id="pay-amount"
              type="number"
              min={1}
              className={inputClass}
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              required
            />
          </Field>
          <Field label="Date" htmlFor="pay-date">
            <input
              id="pay-date"
              type="date"
              className={inputClass}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              required
            />
          </Field>
          <Field label="Method" htmlFor="pay-method">
            <select
              id="pay-method"
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
          <Field label="Reference" htmlFor="pay-reference">
            <input
              id="pay-reference"
              className={inputClass}
              value={form.reference}
              onChange={(e) => set("reference", e.target.value)}
            />
          </Field>
        </div>

        <Field label="Notes" htmlFor="pay-notes">
          <textarea
            id="pay-notes"
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
