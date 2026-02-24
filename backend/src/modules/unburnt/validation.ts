import { HttpError } from "../../shared/errors";
import { ErrorCodes } from "../../shared/errorCodes";
import {
  DEFAULT_UNBURNT_QUERY_LIMIT as DEFAULT_LIMIT,
  MAX_UNBURNT_DRAFT_BOUNDARIES_COUNT,
  MAX_UNBURNT_DRAFT_LINES_COUNT,
  MAX_UNBURNT_MESSAGE_LENGTH,
  MAX_UNBURNT_MESSAGES_COUNT,
  MAX_UNBURNT_QUERY_LIMIT,
  MAX_UNBURNT_RAW_TEXT_LENGTH,
  MAX_UNBURNT_SUMMARY_LENGTH,
  MAX_UNBURNT_TAG_LENGTH,
  MAX_UNBURNT_TAGS_COUNT,
  MAX_UNBURNT_TITLE_LENGTH,
  UNBURNT_DRAFT_MODE_CREATE,
  UNBURNT_DRAFT_MODE_EDIT,
  UNBURNT_DRAFT_STAGE_META,
  UNBURNT_DRAFT_STAGE_STRUCTURE,
  UNBURNT_SCOPE_MINE,
  UNBURNT_VISIBILITY_PRIVATE,
  UNBURNT_VISIBILITY_PUBLIC,
} from "./constants";
import {
  type UnburntDraftMode,
  type UnburntDraftPayload,
  type UnburntDraftStage,
  type UnburntListVisibility,
  type UnburntMessage,
  type UnburntScope,
  type UnburntVisibility,
} from "./types";

const UNBURNT_VISIBILITIES: readonly UnburntVisibility[] = [
  UNBURNT_VISIBILITY_PRIVATE,
  UNBURNT_VISIBILITY_PUBLIC,
];

const UNBURNT_DRAFT_MODES: readonly UnburntDraftMode[] = [
  UNBURNT_DRAFT_MODE_CREATE,
  UNBURNT_DRAFT_MODE_EDIT,
];

const UNBURNT_DRAFT_STAGES: readonly UnburntDraftStage[] = [
  UNBURNT_DRAFT_STAGE_STRUCTURE,
  UNBURNT_DRAFT_STAGE_META,
];

export function normalizeUnburntScope(value: string | null): UnburntScope {
  if (!value) {
    return UNBURNT_SCOPE_MINE;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized !== UNBURNT_SCOPE_MINE) {
    throw new HttpError(
      400,
      ErrorCodes.UnburntScopeInvalid,
      "scope must be 'mine'."
    );
  }

  return UNBURNT_SCOPE_MINE;
}

export function normalizeUnburntListVisibility(value: string | null): UnburntListVisibility {
  if (!value) {
    return "all";
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "all" || normalized === UNBURNT_VISIBILITY_PRIVATE || normalized === UNBURNT_VISIBILITY_PUBLIC) {
    return normalized;
  }

  throw new HttpError(
    400,
    ErrorCodes.UnburntVisibilityInvalid,
    "visibility must be all, private, or public."
  );
}

export function normalizeUnburntQueryLimit(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_LIMIT;
  }

  const rounded = Math.floor(value);
  if (rounded < 1) {
    return 1;
  }
  if (rounded > MAX_UNBURNT_QUERY_LIMIT) {
    return MAX_UNBURNT_QUERY_LIMIT;
  }
  return rounded;
}

export function normalizeUnburntTitle(value: unknown, required: boolean): string {
  if (typeof value !== "string") {
    throw new HttpError(400, ErrorCodes.UnburntTitleType, "title must be a string.");
  }

  const normalized = value.trim();
  const length = Array.from(normalized).length;

  if (required && length === 0) {
    throw new HttpError(400, ErrorCodes.UnburntTitleEmpty, "title cannot be empty.");
  }

  if (length > MAX_UNBURNT_TITLE_LENGTH) {
    throw new HttpError(
      400,
      ErrorCodes.UnburntTitleTooLong,
      `title must be at most ${MAX_UNBURNT_TITLE_LENGTH} characters.`,
      { maxLength: MAX_UNBURNT_TITLE_LENGTH }
    );
  }

  return normalized;
}

export function normalizeUnburntSummary(value: unknown): string {
  if (typeof value !== "string") {
    throw new HttpError(400, ErrorCodes.UnburntSummaryType, "summary must be a string.");
  }

  const normalized = value.trim();
  const length = Array.from(normalized).length;

  if (length > MAX_UNBURNT_SUMMARY_LENGTH) {
    throw new HttpError(
      400,
      ErrorCodes.UnburntSummaryTooLong,
      `summary must be at most ${MAX_UNBURNT_SUMMARY_LENGTH} characters.`,
      { maxLength: MAX_UNBURNT_SUMMARY_LENGTH }
    );
  }

  return normalized;
}

export function normalizeUnburntRawText(value: unknown, required: boolean): string {
  if (typeof value !== "string") {
    throw new HttpError(400, ErrorCodes.UnburntRawTextType, "rawText must be a string.");
  }

  const normalized = value.replace(/\r\n?/g, "\n");
  const length = Array.from(normalized).length;

  if (required && length === 0) {
    throw new HttpError(400, ErrorCodes.UnburntRawTextEmpty, "rawText cannot be empty.");
  }

  if (length > MAX_UNBURNT_RAW_TEXT_LENGTH) {
    throw new HttpError(
      400,
      ErrorCodes.UnburntRawTextTooLong,
      `rawText must be at most ${MAX_UNBURNT_RAW_TEXT_LENGTH} characters.`,
      { maxLength: MAX_UNBURNT_RAW_TEXT_LENGTH }
    );
  }

  return normalized;
}

export function normalizeUnburntVisibility(value: unknown): UnburntVisibility {
  if (typeof value !== "string") {
    throw new HttpError(400, ErrorCodes.UnburntVisibilityInvalid, "visibility must be a string.");
  }

  const normalized = value.trim().toLowerCase() as UnburntVisibility;
  if (!UNBURNT_VISIBILITIES.includes(normalized)) {
    throw new HttpError(
      400,
      ErrorCodes.UnburntVisibilityInvalid,
      "visibility must be private or public."
    );
  }

  return normalized;
}

export function normalizeUnburntTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new HttpError(400, ErrorCodes.UnburntTagsType, "tags must be an array.");
  }

  const output: string[] = [];
  const seen = new Set<string>();

  for (const candidate of value) {
    if (typeof candidate !== "string") {
      throw new HttpError(400, ErrorCodes.UnburntTagType, "every tag must be a string.");
    }

    const normalized = candidate.trim();
    if (!normalized) {
      continue;
    }

    const length = Array.from(normalized).length;
    if (length > MAX_UNBURNT_TAG_LENGTH) {
      throw new HttpError(
        400,
        ErrorCodes.UnburntTagTooLong,
        `tag must be at most ${MAX_UNBURNT_TAG_LENGTH} characters.`,
        { maxLength: MAX_UNBURNT_TAG_LENGTH }
      );
    }

    const dedupeKey = normalized.toLowerCase();
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    output.push(normalized);
  }

  if (output.length > MAX_UNBURNT_TAGS_COUNT) {
    throw new HttpError(
      400,
      ErrorCodes.UnburntTagsTooMany,
      `tags must contain at most ${MAX_UNBURNT_TAGS_COUNT} items.`,
      { maxLength: MAX_UNBURNT_TAGS_COUNT }
    );
  }

  return output;
}

export function normalizeUnburntMessages(value: unknown, required: boolean): UnburntMessage[] {
  return normalizeMessageArray(value, {
    required,
    allowEmptyContent: false,
    strictOrder: true,
  });
}

export function normalizeUnburntDraftPayload(value: unknown): UnburntDraftPayload {
  const record = asRecord(
    value,
    ErrorCodes.UnburntDraftPayloadType,
    "payload must be a JSON object."
  );

  const mode = normalizeDraftMode(record.mode);
  const stage = normalizeDraftStage(record.stage);

  const entryIdRaw = record.entryId;
  if (entryIdRaw !== undefined && typeof entryIdRaw !== "string") {
    throw new HttpError(400, ErrorCodes.UnburntDraftEntryIdType, "draft.entryId must be a string.");
  }

  const entryId = typeof entryIdRaw === "string" ? entryIdRaw.trim() : "";

  const rawText = normalizeDraftRawText(record.rawText);
  const lines = normalizeDraftLines(record.lines);
  const boundaries = normalizeDraftBoundaries(record.boundaries);
  const messages = normalizeMessageArray(record.messages, {
    required: false,
    allowEmptyContent: true,
    strictOrder: false,
  });

  const fragmentMeta = normalizeDraftFragmentMeta(record.fragmentMeta);

  return {
    mode,
    entryId,
    stage,
    rawText,
    lines,
    boundaries,
    messages,
    fragmentMeta,
  };
}

function normalizeMessageArray(
  value: unknown,
  options: { required: boolean; allowEmptyContent: boolean; strictOrder: boolean }
): UnburntMessage[] {
  if (!Array.isArray(value)) {
    throw new HttpError(400, ErrorCodes.UnburntMessagesType, "messages must be an array.");
  }

  if (options.required && value.length === 0) {
    throw new HttpError(400, ErrorCodes.UnburntMessagesEmpty, "messages cannot be empty.");
  }

  if (value.length > MAX_UNBURNT_MESSAGES_COUNT) {
    throw new HttpError(
      400,
      ErrorCodes.UnburntMessagesTooMany,
      `messages must contain at most ${MAX_UNBURNT_MESSAGES_COUNT} items.`,
      { maxLength: MAX_UNBURNT_MESSAGES_COUNT }
    );
  }

  const mapped = value.map((candidate, index) => {
    const row = asRecord(
      candidate,
      ErrorCodes.UnburntMessagesType,
      "each message must be a JSON object."
    );

    const roleValue = row.role;
    if (typeof roleValue !== "string") {
      throw new HttpError(
        400,
        ErrorCodes.UnburntMessageRoleInvalid,
        "message.role must be 'user' or '4o'."
      );
    }

    const role = roleValue.trim().toLowerCase();
    if (role !== "user" && role !== "4o") {
      throw new HttpError(
        400,
        ErrorCodes.UnburntMessageRoleInvalid,
        "message.role must be 'user' or '4o'."
      );
    }

    const contentValue = row.content;
    if (typeof contentValue !== "string") {
      throw new HttpError(
        400,
        ErrorCodes.UnburntMessageContentType,
        "message.content must be a string."
      );
    }

    const content = contentValue.trim();
    const contentLength = Array.from(content).length;

    if (!options.allowEmptyContent && contentLength === 0) {
      throw new HttpError(
        400,
        ErrorCodes.UnburntMessageContentEmpty,
        "message.content cannot be empty."
      );
    }

    if (contentLength > MAX_UNBURNT_MESSAGE_LENGTH) {
      throw new HttpError(
        400,
        ErrorCodes.UnburntMessageContentTooLong,
        `message.content must be at most ${MAX_UNBURNT_MESSAGE_LENGTH} characters.`,
        { maxLength: MAX_UNBURNT_MESSAGE_LENGTH }
      );
    }

    const orderValue = row.order;
    if (options.strictOrder) {
      if (!Number.isInteger(orderValue) || (orderValue as number) < 1) {
        throw new HttpError(
          400,
          ErrorCodes.UnburntMessageOrderInvalid,
          "message.order must be a positive integer."
        );
      }
      return {
        role,
        content,
        order: orderValue as number,
      } satisfies UnburntMessage;
    }

    return {
      role,
      content,
      order:
        Number.isInteger(orderValue) && (orderValue as number) > 0
          ? (orderValue as number)
          : index + 1,
    } satisfies UnburntMessage;
  });

  if (!options.strictOrder) {
    return mapped
      .sort((left, right) => left.order - right.order)
      .map((item, index) => ({ ...item, order: index + 1 }));
  }

  const sorted = [...mapped].sort((left, right) => left.order - right.order);
  for (let index = 0; index < sorted.length; index += 1) {
    if (sorted[index].order !== index + 1) {
      throw new HttpError(
        400,
        ErrorCodes.UnburntMessageOrderInvalid,
        "message.order must be consecutive and start from 1."
      );
    }
  }

  return sorted;
}

function normalizeDraftMode(value: unknown): UnburntDraftMode {
  if (value === undefined || value === null || value === "") {
    return UNBURNT_DRAFT_MODE_CREATE;
  }

  if (typeof value !== "string") {
    throw new HttpError(400, ErrorCodes.UnburntDraftModeInvalid, "draft.mode must be a string.");
  }

  const normalized = value.trim().toLowerCase() as UnburntDraftMode;
  if (!UNBURNT_DRAFT_MODES.includes(normalized)) {
    throw new HttpError(
      400,
      ErrorCodes.UnburntDraftModeInvalid,
      "draft.mode must be 'create' or 'edit'."
    );
  }

  return normalized;
}

function normalizeDraftStage(value: unknown): UnburntDraftStage {
  if (value === undefined || value === null || value === "") {
    return UNBURNT_DRAFT_STAGE_STRUCTURE;
  }

  if (typeof value !== "string") {
    throw new HttpError(
      400,
      ErrorCodes.UnburntDraftStageInvalid,
      "draft.stage must be a string."
    );
  }

  const normalized = value.trim().toLowerCase() as UnburntDraftStage;
  if (!UNBURNT_DRAFT_STAGES.includes(normalized)) {
    throw new HttpError(
      400,
      ErrorCodes.UnburntDraftStageInvalid,
      "draft.stage must be 'structure' or 'meta'."
    );
  }

  return normalized;
}

function normalizeDraftRawText(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value !== "string") {
    throw new HttpError(400, ErrorCodes.UnburntRawTextType, "draft.rawText must be a string.");
  }

  return normalizeUnburntRawText(value, false);
}

function normalizeDraftLines(value: unknown): string[] {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new HttpError(400, ErrorCodes.UnburntDraftLinesType, "draft.lines must be an array.");
  }

  if (value.length > MAX_UNBURNT_DRAFT_LINES_COUNT) {
    throw new HttpError(
      400,
      ErrorCodes.UnburntDraftLinesTooMany,
      `draft.lines must contain at most ${MAX_UNBURNT_DRAFT_LINES_COUNT} items.`,
      { maxLength: MAX_UNBURNT_DRAFT_LINES_COUNT }
    );
  }

  return value.map((line) => {
    if (typeof line !== "string") {
      throw new HttpError(400, ErrorCodes.UnburntDraftLinesType, "draft.lines must be an array of strings.");
    }

    const normalized = line.replace(/\r\n?/g, "\n");
    if (Array.from(normalized).length > MAX_UNBURNT_RAW_TEXT_LENGTH) {
      throw new HttpError(
        400,
        ErrorCodes.UnburntRawTextTooLong,
        `draft line must be at most ${MAX_UNBURNT_RAW_TEXT_LENGTH} characters.`,
        { maxLength: MAX_UNBURNT_RAW_TEXT_LENGTH }
      );
    }

    return normalized;
  });
}

function normalizeDraftBoundaries(value: unknown): number[] {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new HttpError(
      400,
      ErrorCodes.UnburntDraftBoundariesType,
      "draft.boundaries must be an array."
    );
  }

  if (value.length > MAX_UNBURNT_DRAFT_BOUNDARIES_COUNT) {
    throw new HttpError(
      400,
      ErrorCodes.UnburntDraftBoundariesTooMany,
      `draft.boundaries must contain at most ${MAX_UNBURNT_DRAFT_BOUNDARIES_COUNT} items.`,
      { maxLength: MAX_UNBURNT_DRAFT_BOUNDARIES_COUNT }
    );
  }

  const numbers = value.map((candidate) => {
    if (!Number.isInteger(candidate) || (candidate as number) < 1) {
      throw new HttpError(
        400,
        ErrorCodes.UnburntDraftBoundariesType,
        "draft.boundaries must be an array of positive integers."
      );
    }

    return candidate as number;
  });

  return Array.from(new Set(numbers)).sort((left, right) => left - right);
}

function normalizeDraftFragmentMeta(value: unknown): UnburntDraftPayload["fragmentMeta"] {
  if (value === undefined || value === null) {
    return {
      title: "",
      summary: "",
      tags: [],
      visibility: UNBURNT_VISIBILITY_PRIVATE,
    };
  }

  const record = asRecord(
    value,
    ErrorCodes.UnburntDraftPayloadType,
    "draft.fragmentMeta must be a JSON object."
  );

  const title = record.title === undefined ? "" : normalizeUnburntTitle(record.title, false);
  const summary = record.summary === undefined ? "" : normalizeUnburntSummary(record.summary);
  const tags = record.tags === undefined ? [] : normalizeUnburntTags(record.tags);
  const visibility =
    record.visibility === undefined
      ? UNBURNT_VISIBILITY_PRIVATE
      : normalizeUnburntVisibility(record.visibility);

  return {
    title,
    summary,
    tags,
    visibility,
  };
}

function asRecord(
  value: unknown,
  code: (typeof ErrorCodes)[keyof typeof ErrorCodes],
  message: string
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, code, message);
  }

  return value as Record<string, unknown>;
}
