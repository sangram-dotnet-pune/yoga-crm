"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { createVisit, updateVisit } from "@/lib/patients";
import { toOptionalNumberOrNull, todayISO } from "@/lib/format";
import type { Visit, VisitInput } from "@/lib/types";
import { Button, Field, Modal, Spinner, inputClass } from "@/components/ui";

const VISIT_TYPES = [
  "Initial assessment",
  "Follow-up",
  "Rehabilitation",
  "Therapy session",
  "Consultation",
];

type FormState = {
  date: string;
  visitType: string;
  painScore: string;
  mobility: string;
  treatment: string;
  exercises: string;
  notes: string;
};

function emptyForm(): FormState {
  return {
    date: todayISO(),
    visitType: "Follow-up",
    painScore: "",
    mobility: "",
    treatment: "",
    exercises: "",
    notes: "",
  };
}

function fromVisit(visit: Visit): FormState {
  return {
    date: visit.date,
    visitType: visit.visitType,
    painScore: visit.painScore !== null ? String(visit.painScore) : "",
    mobility: visit.mobility !== null ? String(visit.mobility) : "",
    treatment: visit.treatment ?? "",
    exercises: visit.exercises ?? "",
    notes: visit.notes ?? "",
  };
}

export function VisitForm({
  onClose,
  onSaved,
  patientId,
  visit,
}: {
  onClose: () => void;
  onSaved: () => void;
  patientId: string;
  visit?: Visit;
}) {
  const editing = Boolean(visit);
  const [form, setForm] = useState<FormState>(() => (visit ? fromVisit(visit) : emptyForm()));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const input: VisitInput = {
      date: form.date,
      visitType: form.visitType.trim(),
      painScore: toOptionalNumberOrNull(form.painScore),
      mobility: toOptionalNumberOrNull(form.mobility),
      treatment: form.treatment.trim() || null,
      exercises: form.exercises.trim() || null,
      notes: form.notes.trim() || null,
    };

    setSubmitting(true);
    try {
      if (editing && visit) {
        await updateVisit(visit.id, input);
      } else {
        await createVisit(patientId, input);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save visit.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "Edit visit" : "New visit"}
      description="Record assessment and treatment for this session."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="visit-form" disabled={submitting}>
            {submitting ? <Spinner /> : null}
            {editing ? "Save changes" : "Add visit"}
          </Button>
        </>
      }
    >
      <form id="visit-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {error ? (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" htmlFor="vf-date">
            <input
              id="vf-date"
              type="date"
              className={inputClass}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              required
            />
          </Field>
          <Field label="Visit type" htmlFor="vf-type">
            <select
              id="vf-type"
              className={inputClass}
              value={form.visitType}
              onChange={(e) => set("visitType", e.target.value)}
            >
              {VISIT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Pain score (0–10)" htmlFor="vf-pain">
            <input
              id="vf-pain"
              type="number"
              min={0}
              max={10}
              className={inputClass}
              value={form.painScore}
              onChange={(e) => set("painScore", e.target.value)}
            />
          </Field>
          <Field label="Mobility (0–100)" htmlFor="vf-mobility">
            <input
              id="vf-mobility"
              type="number"
              min={0}
              max={100}
              className={inputClass}
              value={form.mobility}
              onChange={(e) => set("mobility", e.target.value)}
            />
          </Field>
        </div>

        <Field label="Treatment" htmlFor="vf-treatment">
          <textarea
            id="vf-treatment"
            rows={2}
            className={inputClass}
            value={form.treatment}
            onChange={(e) => set("treatment", e.target.value)}
          />
        </Field>
        <Field label="Exercises" htmlFor="vf-exercises">
          <textarea
            id="vf-exercises"
            rows={2}
            className={inputClass}
            value={form.exercises}
            onChange={(e) => set("exercises", e.target.value)}
          />
        </Field>
        <Field label="Notes" htmlFor="vf-notes">
          <textarea
            id="vf-notes"
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
