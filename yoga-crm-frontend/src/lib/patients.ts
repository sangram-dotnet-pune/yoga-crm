import { apiFetch } from "./api";
import type {
  Exercise,
  ExerciseInput,
  Patient,
  PatientDetail,
  PatientInput,
  PatientList,
  PatientStatus,
  Payment,
  PaymentInput,
  Visit,
  VisitInput,
} from "./types";

type ListParams = {
  search?: string;
  status?: PatientStatus;
  page?: number;
  pageSize?: number;
};

export function listPatients(params: ListParams = {}): Promise<PatientList> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<PatientList>(`/patients${suffix}`);
}

export function getPatient(id: string): Promise<PatientDetail> {
  return apiFetch<PatientDetail>(`/patients/${id}`);
}

export function createPatient(input: PatientInput): Promise<Patient> {
  return apiFetch<Patient>(`/patients`, { method: "POST", body: JSON.stringify(input) });
}

export function updatePatient(id: string, input: Partial<PatientInput>): Promise<Patient> {
  return apiFetch<Patient>(`/patients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deletePatient(id: string): Promise<void> {
  return apiFetch<void>(`/patients/${id}`, { method: "DELETE" });
}

export function listVisits(patientId: string): Promise<Visit[]> {
  return apiFetch<Visit[]>(`/patients/${patientId}/visits`);
}

export function createVisit(patientId: string, input: VisitInput): Promise<Visit> {
  return apiFetch<Visit>(`/patients/${patientId}/visits`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateVisit(id: string, input: Partial<VisitInput>): Promise<Visit> {
  return apiFetch<Visit>(`/visits/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteVisit(id: string): Promise<void> {
  return apiFetch<void>(`/visits/${id}`, { method: "DELETE" });
}

export function listExercises(patientId: string): Promise<Exercise[]> {
  return apiFetch<Exercise[]>(`/patients/${patientId}/exercises`);
}

export function replaceExercises(
  patientId: string,
  exercises: ExerciseInput[],
): Promise<Exercise[]> {
  return apiFetch<Exercise[]>(`/patients/${patientId}/exercises`, {
    method: "PUT",
    body: JSON.stringify({ exercises }),
  });
}

export function listPayments(patientId: string): Promise<Payment[]> {
  return apiFetch<Payment[]>(`/patients/${patientId}/payments`);
}

export function createPayment(
  patientId: string,
  input: PaymentInput,
): Promise<{ payment: Payment; patient: Patient }> {
  return apiFetch<{ payment: Payment; patient: Patient }>(`/patients/${patientId}/payments`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deletePayment(id: string): Promise<{ patient: Patient }> {
  return apiFetch<{ patient: Patient }>(`/payments/${id}`, { method: "DELETE" });
}

export function reconcilePayments(patientId: string): Promise<Patient> {
  return apiFetch<Patient>(`/patients/${patientId}/payments/reconcile`, { method: "POST" });
}
