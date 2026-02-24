export type ApiErrorPayload = {
  detail?: string;
  [key: string]: unknown;
};

export class ApiError extends Error {
  status: number;
  payload: ApiErrorPayload | null;

  constructor(message: string, status: number, payload: ApiErrorPayload | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export async function apiRequest<T>(args: {
  baseUrl: string;
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  token?: string | null;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}): Promise<T> {
  const {
    baseUrl,
    path,
    method = 'GET',
    token,
    body,
    headers = {},
    signal,
  } = args;

  const res = await fetch(joinUrl(baseUrl, path), {
    method,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  const text = await res.text();
  const payload = text ? (safeJson(text) as ApiErrorPayload | unknown) : null;

  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && payload && 'detail' in payload && (payload as ApiErrorPayload).detail) ||
      `${res.status} ${res.statusText}`;
    throw new ApiError(String(message), res.status, (payload as ApiErrorPayload) ?? null);
  }

  // Some endpoints may return empty response.
  if (!text) return undefined as T;
  return (payload as T) ?? (undefined as T);
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

