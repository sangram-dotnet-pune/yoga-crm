"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { createPatient, updatePatient } from "@/lib/patients";
import { toOptionalNumber, toOptionalNumberOrNull, todayISO } from "@/lib/format";
import {
  PATIENT_STATUSES,
  type Patient,
  type PatientInput,
  type PatientStatus,
} from "@/lib/types";
import { Button, Field, Modal, Spinner, inputClass } from "@/components/ui";

type FormState = {
  name: string;
  condition: string;
  age: string;
  gender: string;
  phone: string;
  visitDate: string;
  painBefore: string;
  painAfter: string;
  mobilityBefore: string;
  mobilityAfter: string;
  diagnosis: string;
  doctor: string;
  planMonths: string;
  followUpDate: string;
  status: PatientStatus;
  fee: string;
  paid: string;
  notes: string;
};

function emptyForm(): FormState {
  return {
    name: "",
    condition: "",
    age: "",
    gender: "",
    phone: "",
    visitDate: todayISO(),
    painBefore: "",
    painAfter: "",
    mobilityBefore: "",
    mobilityAfter: "",
    diagnosis: "",
    doctor: "",
    planMonths: "3",
    followUpDate: "",
    status: "Active",
    fee: "",
    paid: "",
    notes: "",
  };
}

function fromPatient(patient: Patient): FormState {
  return {
    name: patient.name,
    condition: patient.condition,
    age: String(patient.age || ""),
    gender: patient.gender ?? "",
    phone: patient.phone ?? "",
    visitDate: patient.visitDate,
    painBefore: patient.painBefore ? String(patient.painBefore) : "",
    painAfter: patient.painAfter !== null ? String(patient.painAfter) : "",
    mobilityBefore: patient.mobilityBefore ?? "",
    mobilityAfter: patient.mobilityAfter ?? "",
    diagnosis: patient.diagnosis ?? "",
    doctor: patient.doctor ?? "",
    planMonths: String(patient.planMonths || ""),
    followUpDate: patient.followUpDate ?? "",
    status: patient.status,
    fee: patient.fee ? String(patient.fee) : "",
    paid: patient.paid ? String(patient.paid) : "",
    notes: patient.notes ?? "",
  };
}

export function PatientForm({
  onClose,
  onSaved,
  patient,
}: {
  onClose: () => void;
  onSaved: (patient: Patient) => void;
  patient?: Patient;
}) {
  const editing = Boolean(patient);
  const [form, setForm] = useState<FormState>(() => (patient ? fromPatient(patient) : emptyForm()));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!form.name.trim() || !form.condition.trim()) {
      setFieldErrors({
        ...(form.name.trim() ? {} : { name: ["Name is required"] }),
        ...(form.condition.trim() ? {} : { condition: ["Condition is required"] }),
      });
      return;
    }

    const input: PatientInput = {
      name: form.name.trim(),
      condition: form.condition.trim(),
      age: toOptionalNumber(form.age),
      gender: form.gender.trim() || undefined,
      phone: form.phone.trim() || undefined,
      visitDate: form.visitDate || undefined,
      painBefore: toOptionalNumber(form.painBefore),
      painAfter: toOptionalNumberOrNull(form.painAfter),
      mobilityBefore: form.mobilityBefore.trim() || undefined,
      mobilityAfter: form.mobilityAfter.trim() || null,
      diagnosis: form.diagnosis.trim() || undefined,
      doctor: form.doctor.trim() || undefined,
      planMonths: toOptionalNumber(form.planMonths),
      followUpDate: form.followUpDate || undefined,
      status: form.status,
      fee: toOptionalNumber(form.fee),
      paid: toOptionalNumber(form.paid),
      notes: form.notes.trim() || undefined,
    };

    setSubmitting(true);
    try {
      const saved = editing && patient
        ? await updatePatient(patient.id, input)
        : await createPatient(input);
      onSaved(saved);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.details) setFieldErrors(err.details);
      } else {
        setError("Unable to save patient. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={editing ? `Edit ${patient?.name}` : "New patient"}
      description={
        editing ? "Update the patient record." : "Register a new patient and start their plan."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="patient-form" disabled={submitting}>
            {submitting ? <Spinner /> : null}
            {editing ? "Save changes" : "Create patient"}
          </Button>
        </>
      }
    >
      <form id="patient-form" onSubmit={onSubmit} className="space-y-6" noValidate>
        {error ? (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="pf-name" error={fieldErrors.name?.[0]}>
            <input
              id="pf-name"
              className={inputClass}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </Field>
          <Field label="Condition" htmlFor="pf-condition" error={fieldErrors.condition?.[0]}>
            <input
              id="pf-condition"
              className={inputClass}
              value={form.condition}
              onChange={(e) => set("condition", e.target.value)}
              required
            />
          </Field>

          <Field label="Age" htmlFor="pf-age">
            <input
              id="pf-age"
              type="number"
              min={0}
              max={120}
              className={inputClass}
              value={form.age}
              onChange={(e) => set("age", e.target.value)}
            />
          </Field>
          <Field label="Gender" htmlFor="pf-gender">
            <input
              id="pf-gender"
              className={inputClass}
              value={form.gender}
              onChange={(e) => set("gender", e.target.value)}
            />
          </Field>

          <Field label="Phone" htmlFor="pf-phone">
            <input
              id="pf-phone"
              className={inputClass}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
          <Field label="Visit date" htmlFor="pf-visit-date">
            <input
              id="pf-visit-date"
              type="date"
              className={inputClass}
              value={form.visitDate}
              onChange={(e) => set("visitDate", e.target.value)}
            />
          </Field>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Assessment</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pain before (0–10)" htmlFor="pf-pain-before">
              <input
                id="pf-pain-before"
                type="number"
                min={0}
                max={10}
                className={inputClass}
                value={form.painBefore}
                onChange={(e) => set("painBefore", e.target.value)}
              />
            </Field>
            <Field label="Pain after (0–10)" htmlFor="pf-pain-after">
              <input
                id="pf-pain-after"
                type="number"
                min={0}
                max={10}
                className={inputClass}
                value={form.painAfter}
                onChange={(e) => set("painAfter", e.target.value)}
              />
            </Field>
            <Field label="Mobility before" htmlFor="pf-mobility-before">
              <input
                id="pf-mobility-before"
                className={inputClass}
                value={form.mobilityBefore}
                onChange={(e) => set("mobilityBefore", e.target.value)}
              />
            </Field>
            <Field label="Mobility after" htmlFor="pf-mobility-after">
              <input
                id="pf-mobility-after"
                className={inputClass}
                value={form.mobilityAfter}
                onChange={(e) => set("mobilityAfter", e.target.value)}
              />
            </Field>
            <Field label="Diagnosis" htmlFor="pf-diagnosis">
              <input
                id="pf-diagnosis"
                className={inputClass}
                value={form.diagnosis}
                onChange={(e) => set("diagnosis", e.target.value)}
              />
            </Field>
            <Field label="Doctor" htmlFor="pf-doctor">
              <input
                id="pf-doctor"
                className={inputClass}
                value={form.doctor}
                onChange={(e) => set("doctor", e.target.value)}
              />
            </Field>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Plan & billing</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Plan (months)" htmlFor="pf-plan">
              <input
                id="pf-plan"
                type="number"
                min={1}
                max={36}
                className={inputClass}
                value={form.planMonths}
                onChange={(e) => set("planMonths", e.target.value)}
              />
            </Field>
            <Field label="Follow-up date" htmlFor="pf-follow-up">
              <input
                id="pf-follow-up"
                type="date"
                className={inputClass}
                value={form.followUpDate}
                onChange={(e) => set("followUpDate", e.target.value)}
              />
            </Field>
            <Field label="Status" htmlFor="pf-status">
              <select
                id="pf-status"
                className={inputClass}
                value={form.status}
                onChange={(e) => set("status", e.target.value as PatientStatus)}
              >
                {PATIENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fee" htmlFor="pf-fee">
              <input
                id="pf-fee"
                type="number"
                min={0}
                className={inputClass}
                value={form.fee}
                onChange={(e) => set("fee", e.target.value)}
              />
            </Field>
            <Field
              label="Paid"
              htmlFor="pf-paid"
              hint="Derived from payments; use Reconcile to resync."
            >
              <input
                id="pf-paid"
                type="number"
                min={0}
                className={inputClass}
                value={form.paid}
                onChange={(e) => set("paid", e.target.value)}
              />
            </Field>
          </div>
        </div>

        <Field label="Notes" htmlFor="pf-notes">
          <textarea
            id="pf-notes"
            rows={3}
            className={inputClass}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
}
