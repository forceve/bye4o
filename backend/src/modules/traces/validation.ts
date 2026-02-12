import { HttpError } from "../../shared/errors";
import { ErrorCodes } from "../../shared/errorCodes";
import {
  DEFAULT_TRACE_QUERY_LIMIT,
  MAX_TRACE_MESSAGE_LENGTH,
  MAX_TRACE_NAME_LENGTH,
  MAX_TRACE_QUERY_LIMIT,
  TRACE_NAME_COOKIE,
} from "./constants";

export function normalizeTraceName(value: unknown): string {
  if (typeof value !== "string") {
    throw new HttpError(
      400,
      ErrorCodes.TraceDisplayNameType,
      "displayName must be a string."
    );
  }

  const normalized = value.trim();
  const length = Array.from(normalized).length;
  if (length > MAX_TRACE_NAME_LENGTH) {
    throw new HttpError(
      400,
      ErrorCodes.TraceDisplayNameTooLong,
      `displayName must be at most ${MAX_TRACE_NAME_LENGTH} characters.`,
      { maxLength: MAX_TRACE_NAME_LENGTH }
    );
  }

  return normalized;
}

export function normalizeTraceMessage(value: unknown, required: boolean): string {
  if (typeof value !== "string") {
    throw new HttpError(400, ErrorCodes.TraceMessageType, "message must be a string.");
  }

  const normalized = value.trim();
  const length = Array.from(normalized).length;

  if (required && length === 0) {
    throw new HttpError(400, ErrorCodes.TraceMessageEmpty, "message cannot be empty.");
  }

  if (length > MAX_TRACE_MESSAGE_LENGTH) {
    throw new HttpError(
      400,
      ErrorCodes.TraceMessageTooLong,
      `message must be at most ${MAX_TRACE_MESSAGE_LENGTH} characters.`,
      { maxLength: MAX_TRACE_MESSAGE_LENGTH }
    );
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
