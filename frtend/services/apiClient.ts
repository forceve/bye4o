export class ApiError extends Error {
  public readonly status: number;
  public readonly details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  json?: unknown;
}

const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE);

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  const hasJsonBody = options.json !== undefined;

  if (hasJsonBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers,
    body: hasJsonBody ? JSON.stringify(options.json) : undefined,
    credentials: "include",
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    const message =
      extractMessage(payload) ??
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export function buildApiUrl(path: string): string {
  const normalizedPath = normalizePath(path);

  if (!API_BASE) {
    return normalizedPath;
  }

  if (normalizedPath.startsWith("http://") || normalizedPath.startsWith("https://")) {
    return normalizedPath;
  }

  return `${API_BASE}${normalizedPath}`;
}

function normalizeApiBase(value: string | undefined): string {
  if (!value) {
    return "";
  }

  return value.trim().replace(/\/+$/g, "");
}

function normalizePath(path: string): string {
  if (!path) {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const message = (payload as Record<string, unknown>).message;
  return typeof message === "string" && message.trim() ? message : null;
}
