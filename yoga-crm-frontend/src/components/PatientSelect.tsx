"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { listPatients } from "@/lib/patients";
import type { Patient } from "@/lib/types";
import { Field, inputClass } from "@/components/ui";

export function PatientSelect({
  id,
  label = "Patient",
  value,
  onChange,
  required = false,
  emptyLabel = "Select a patient…",
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  emptyLabel?: string;
}) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listPatients({ pageSize: 200 })
      .then((result) => {
        if (active) setPatients(result.items);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiError ? err.message : "Unable to load patients.");
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Field label={label} htmlFor={id} error={error ?? undefined}>
      <select
        id={id}
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      >
        <option value="">{emptyLabel}</option>
        {patients.map((patient) => (
          <option key={patient.id} value={patient.id}>
            {patient.name} · {patient.patientCode}
          </option>
        ))}
      </select>
    </Field>
  );
}
