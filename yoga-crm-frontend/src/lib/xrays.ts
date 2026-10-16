import { apiFetch } from "./api";
import type { Xray, XrayInput, XrayMetadataInput } from "./types";

export function listXrays(patientId: string): Promise<Xray[]> {
  return apiFetch<Xray[]>(`/patients/${patientId}/xrays`);
}

export function uploadXray(patientId: string, file: File, input: XrayInput): Promise<Xray> {
  const form = new FormData();
  form.append("image", file);
  form.append("date", input.date);
  form.append("kind", input.kind);
  if (input.bodyArea) form.append("bodyArea", input.bodyArea);
  if (input.title) form.append("title", input.title);
  if (input.notes) form.append("notes", input.notes);
  return apiFetch<Xray>(`/patients/${patientId}/xrays`, { method: "POST", body: form });
}

export function updateXray(id: string, input: XrayMetadataInput): Promise<Xray> {
  return apiFetch<Xray>(`/xrays/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteXray(id: string): Promise<void> {
  return apiFetch<void>(`/xrays/${id}`, { method: "DELETE" });
}
