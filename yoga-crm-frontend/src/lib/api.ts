export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export type AuthUser = {
  id: string;
  clinicId: string;
  email: string;
  name: string;
  role: string;
};

export type Health = {
  status: string;
  service: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
};

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

type ApiFetchOptions = {
  retryOnUnauthorized?: boolean;
};

let refreshInFlight: Promise<AuthUser | null> | null = null;

export function refreshSession(): Promise<AuthUser | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (!response.ok) {
          setAccessToken(null);
          return null;
        }
        const data = (await response.json()) as { user: AuthUser; accessToken: string };
        setAccessToken(data.accessToken);
        return data.user;
      } catch {
        setAccessToken(null);
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

function buildHeaders(init?: RequestInit): Record<string, string> {
  const headers: Record<string, string> = {
    ...((init?.headers as Record<string, string> | undefined) ?? {}),
  };
  if (init?.body && !headers["Content-Type"] && !(init.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  options?: ApiFetchOptions,
): Promise<T> {
  let response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: buildHeaders(init),
    credentials: "include",
  });

  const isAuthPath = path.startsWith("/auth/");
  if (
    response.status === 401 &&
    !isAuthPath &&
    (options?.retryOnUnauthorized ?? true)
  ) {
    const user = await refreshSession();
    if (user) {
      response = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: buildHeaders(init),
        credentials: "include",
      });
    }
  }

  const isJson = response.headers.get("content-type")?.includes("application/json") ?? false;
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorBody: ApiErrorBody =
      (body as { error?: ApiErrorBody } | null)?.error ?? {
        code: "REQUEST_FAILED",
        message: response.statusText || "Request failed",
      };
    throw new ApiError(response.status, errorBody);
  }

  return body as T;
}

export async function loginRequest(email: string, password: string): Promise<AuthUser> {
  const data = await apiFetch<{ user: AuthUser; accessToken: string }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
    { retryOnUnauthorized: false },
  );
  setAccessToken(data.accessToken);
  return data.user;
}

export async function logoutRequest(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
  } finally {
    setAccessToken(null);
  }
}

export function getHealth(): Promise<Health> {
  return apiFetch<Health>("/health", undefined, { retryOnUnauthorized: false });
}

export type DownloadedFile = { blob: Blob; filename: string | null };

export async function apiFetchBlob(path: string): Promise<DownloadedFile> {
  let response = await fetch(`${API_BASE}${path}`, {
    headers: buildHeaders(),
    credentials: "include",
  });

  if (response.status === 401 && !path.startsWith("/auth/")) {
    const user = await refreshSession();
    if (user) {
      response = await fetch(`${API_BASE}${path}`, {
        headers: buildHeaders(),
        credentials: "include",
      });
    }
  }

  if (!response.ok) {
    let errorBody: ApiErrorBody | null = null;
    try {
      const json = (await response.json()) as { error?: ApiErrorBody };
      errorBody = json.error ?? null;
    } catch {
      errorBody = null;
    }
    throw new ApiError(
      response.status,
      errorBody ?? {
        code: "REQUEST_FAILED",
        message: response.statusText || "Request failed",
      },
    );
  }

  const disposition = response.headers.get("content-disposition");
  const filename = disposition ? /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? null : null;
  return { blob: await response.blob(), filename };
}
