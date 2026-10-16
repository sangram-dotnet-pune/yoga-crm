"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { createAppointment, updateAppointment } from "@/lib/appointments";
import { todayISO } from "@/lib/format";
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  type Appointment,
  type AppointmentInput,
  type AppointmentStatus,
} from "@/lib/types";
import { Button, Field, Modal, Spinner, inputClass } from "@/components/ui";
import { PatientSelect } from "@/components/PatientSelect";

type FormState = {
  patientId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: AppointmentStatus;
  notes: string;
};

function emptyForm(defaultPatientId: string): FormState {
  return {
    patientId: defaultPatientId,
    date: todayISO(),
    startTime: "09:00",
    endTime: "09:30",
    type: APPOINTMENT_TYPES[1],
    status: "Scheduled",
    notes: "",
  };
}

function fromAppointment(appointment: Appointment): FormState {
  return {
    patientId: appointment.patientId,
    date: appointment.date,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    type: appointment.type,
    status: appointment.status,
    notes: appointment.notes ?? "",
  };
}

export function AppointmentForm({
  onClose,
  onSaved,
  appointment,
  defaultPatientId = "",
}: {
  onClose: () => void;
  onSaved: () => void;
  appointment?: Appointment;
  defaultPatientId?: string;
}) {
  const editing = Boolean(appointment);
  const [form, setForm] = useState<FormState>(() =>
    appointment ? fromAppointment(appointment) : emptyForm(defaultPatientId),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.patientId) {
      setError("Please select a patient.");
      return;
    }

    const input: AppointmentInput = {
      patientId: form.patientId,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      type: form.type,
      status: form.status,
      notes: form.notes.trim() || null,
    };

    setSubmitting(true);
    try {
      if (editing && appointment) {
        await updateAppointment(appointment.id, input);
      } else {
        await createAppointment(input);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save appointment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "Edit appointment" : "New appointment"}
      description="Schedule a session and update its status."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="appointment-form" disabled={submitting}>
            {submitting ? <Spinner /> : null}
            {editing ? "Save changes" : "Book appointment"}
          </Button>
        </>
      }
    >
      <form id="appointment-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {error ? (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <PatientSelect
          id="af-patient"
          value={form.patientId}
          onChange={(value) => set("patientId", value)}
          required
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Date" htmlFor="af-date">
            <input
              id="af-date"
              type="date"
              className={inputClass}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              required
            />
          </Field>
          <Field label="Start" htmlFor="af-start">
            <input
              id="af-start"
              type="time"
              className={inputClass}
              value={form.startTime}
              onChange={(e) => set("startTime", e.target.value)}
              required
            />
          </Field>
          <Field label="End" htmlFor="af-end">
            <input
              id="af-end"
              type="time"
              className={inputClass}
              value={form.endTime}
              onChange={(e) => set("endTime", e.target.value)}
              required
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type" htmlFor="af-type">
            <select
              id="af-type"
              className={inputClass}
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
            >
              {APPOINTMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status" htmlFor="af-status">
            <select
              id="af-status"
              className={inputClass}
              value={form.status}
              onChange={(e) => set("status", e.target.value as AppointmentStatus)}
            >
              {APPOINTMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Notes" htmlFor="af-notes">
          <textarea
            id="af-notes"
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
