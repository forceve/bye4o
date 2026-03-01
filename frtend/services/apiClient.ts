export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string | null;
  public readonly details: unknown;

  constructor(message: string, status: number, code: string | null, details: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  json?: unknown;
}

const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE);

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const response = await apiFetchRaw(path, options);
  const payload = await parseJsonSafely(response);
  return payload as T;
}

export async function apiFetchRaw(
  path: string,
  options: ApiFetchOptions = {}
): Promise<Response> {
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

  if (!response.ok) {
    const payload = await parseJsonSafely(response.clone());
    const code = extractCode(payload);
    const details = extractDetails(payload);
    const plainText = await readTextSafely(response.clone());
    const message =
      extractMessage(payload) ??
      plainText ??
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, code, details);
  }

  return response;
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

async function readTextSafely(response: Response): Promise<string | null> {
  try {
    const value = await response.text();
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
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

function extractCode(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const code = (payload as Record<string, unknown>).code;
  return typeof code === "string" && code.trim() ? code : null;
}

function extractDetails(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return (payload as Record<string, unknown>).details ?? null;
}
