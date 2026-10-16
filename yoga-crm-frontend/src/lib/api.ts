export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: Record<string, string[]>;
};

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, string[]>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const isJson = response.headers.get("content-type")?.includes("application/json") ?? false;
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorBody: ApiErrorBody = body?.error ?? {
      code: "REQUEST_FAILED",
      message: response.statusText || "Request failed",
    };
    throw new ApiError(response.status, errorBody);
  }

  return body as T;
}

export type Health = {
  status: string;
  service: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
};

export function getHealth(): Promise<Health> {
  return apiFetch<Health>("/health");
}
