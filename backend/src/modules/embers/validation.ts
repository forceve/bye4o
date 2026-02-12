import { HttpError } from "../../shared/errors";
import { ErrorCodes } from "../../shared/errorCodes";
import {
  DEFAULT_EMBER_QUERY_LIMIT,
  MAX_EMBER_MESSAGE_LENGTH,
  MAX_EMBER_NAME_LENGTH,
  MAX_EMBER_QUERY_LIMIT,
  EMBER_NAME_COOKIE,
} from "./constants";

export function normalizeEmberName(value: unknown): string {
  if (typeof value !== "string") {
    throw new HttpError(
      400,
      ErrorCodes.EmberDisplayNameType,
      "displayName must be a string."
    );
  }

  const normalized = value.trim();
  const length = Array.from(normalized).length;
  if (length > MAX_EMBER_NAME_LENGTH) {
    throw new HttpError(
      400,
      ErrorCodes.EmberDisplayNameTooLong,
      `displayName must be at most ${MAX_EMBER_NAME_LENGTH} characters.`,
      { maxLength: MAX_EMBER_NAME_LENGTH }
    );
  }

  return normalized;
}

export function normalizeEmberMessage(value: unknown, required: boolean): string {
  if (typeof value !== "string") {
    throw new HttpError(400, ErrorCodes.EmberMessageType, "message must be a string.");
  }

  const normalized = value.trim();
  const length = Array.from(normalized).length;

  if (required && length === 0) {
    throw new HttpError(400, ErrorCodes.EmberMessageEmpty, "message cannot be empty.");
  }

  if (length > MAX_EMBER_MESSAGE_LENGTH) {
    throw new HttpError(
      400,
      ErrorCodes.EmberMessageTooLong,
      `message must be at most ${MAX_EMBER_MESSAGE_LENGTH} characters.`,
      { maxLength: MAX_EMBER_MESSAGE_LENGTH }
    );
  }

  return normalized;
}

export function normalizeQueryLimit(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_EMBER_QUERY_LIMIT;
  }

  const rounded = Math.floor(value);
  if (rounded < 1) {
    return 1;
  }
  if (rounded > MAX_EMBER_QUERY_LIMIT) {
    return MAX_EMBER_QUERY_LIMIT;
  }
  return rounded;
}

export function getStoredEmberName(cookies: Record<string, string>): string {
  const value = cookies[EMBER_NAME_COOKIE];
  if (!value) {
    return "";
  }

  const normalized = value.trim();
  const length = Array.from(normalized).length;
  if (length === 0 || length > MAX_EMBER_NAME_LENGTH) {
    return "";
  }

  return normalized;
}
