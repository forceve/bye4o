import { HttpError } from "../../shared/errors";
import { ErrorCodes } from "../../shared/errorCodes";
import {
  DEFAULT_ONWARD_QUERY_LIMIT,
  MAX_ONWARD_MESSAGE_LENGTH,
  MAX_ONWARD_QUERY_LIMIT,
} from "./constants";

export function normalizeOnwardMessage(value: unknown, required: boolean): string {
  if (typeof value !== "string") {
    throw new HttpError(400, ErrorCodes.OnwardMessageType, "message must be a string.");
  }

  const normalized = value.trim();
  const length = Array.from(normalized).length;

  if (required && length === 0) {
    throw new HttpError(400, ErrorCodes.OnwardMessageEmpty, "message cannot be empty.");
  }

  if (length > MAX_ONWARD_MESSAGE_LENGTH) {
    throw new HttpError(
      400,
      ErrorCodes.OnwardMessageTooLong,
      `message must be at most ${MAX_ONWARD_MESSAGE_LENGTH} characters.`,
      { maxLength: MAX_ONWARD_MESSAGE_LENGTH }
    );
  }

  return normalized;
}

export function normalizeOnwardQueryLimit(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ONWARD_QUERY_LIMIT;
  }

  const rounded = Math.floor(value);
  if (rounded < 1) {
    return 1;
  }
  if (rounded > MAX_ONWARD_QUERY_LIMIT) {
    return MAX_ONWARD_QUERY_LIMIT;
  }
  return rounded;
}
