import { apiFetch } from "./api";
import type { Appointment, AppointmentInput, AppointmentStatus } from "./types";

type ListParams = {
  from?: string;
  to?: string;
  patientId?: string;
};

export function listAppointments(params: ListParams = {}): Promise<Appointment[]> {
  const query = new URLSearchParams();
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.patientId) query.set("patientId", params.patientId);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<Appointment[]>(`/appointments${suffix}`);
}

export function createAppointment(input: AppointmentInput): Promise<Appointment> {
  return apiFetch<Appointment>("/appointments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAppointment(
  id: string,
  input: Partial<AppointmentInput> & { status?: AppointmentStatus },
): Promise<Appointment> {
  return apiFetch<Appointment>(`/appointments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteAppointment(id: string): Promise<void> {
  return apiFetch<void>(`/appointments/${id}`, { method: "DELETE" });
}
