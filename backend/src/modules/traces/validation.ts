import { HttpError } from "../../shared/errors";
import {
  DEFAULT_TRACE_QUERY_LIMIT,
  MAX_TRACE_MESSAGE_LENGTH,
  MAX_TRACE_NAME_LENGTH,
  MAX_TRACE_QUERY_LIMIT,
  TRACE_NAME_COOKIE,
} from "./constants";

export function normalizeTraceName(value: unknown): string {
  if (typeof value !== "string") {
    throw new HttpError(400, "displayName 必须是字符串。");
  }

  const normalized = value.trim();
  const length = Array.from(normalized).length;
  if (length > MAX_TRACE_NAME_LENGTH) {
    throw new HttpError(400, `displayName 不能超过 ${MAX_TRACE_NAME_LENGTH} 个字符。`);
  }

  return normalized;
}

export function normalizeTraceMessage(value: unknown, required: boolean): string {
  if (typeof value !== "string") {
    throw new HttpError(400, "message 必须是字符串。");
  }

  const normalized = value.trim();
  const length = Array.from(normalized).length;

  if (required && length === 0) {
    throw new HttpError(400, "message 不能为空。");
  }

  if (length > MAX_TRACE_MESSAGE_LENGTH) {
    throw new HttpError(400, `message 不能超过 ${MAX_TRACE_MESSAGE_LENGTH} 个字符。`);
  }

  return normalized;
}

export function normalizeQueryLimit(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_TRACE_QUERY_LIMIT;
  }

  const rounded = Math.floor(value);
  if (rounded < 1) {
    return 1;
  }
  if (rounded > MAX_TRACE_QUERY_LIMIT) {
    return MAX_TRACE_QUERY_LIMIT;
  }
  return rounded;
}

export function getStoredTraceName(cookies: Record<string, string>): string {
  const value = cookies[TRACE_NAME_COOKIE];
  if (!value) {
    return "";
  }

  const normalized = value.trim();
  const length = Array.from(normalized).length;
  if (length === 0 || length > MAX_TRACE_NAME_LENGTH) {
    return "";
  }

  return normalized;
}
