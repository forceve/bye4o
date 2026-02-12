export const ErrorCodes = {
  NotFound: "NOT_FOUND",
  InternalError: "INTERNAL_ERROR",
  InvalidJsonBodyType: "INVALID_JSON_BODY_TYPE",
  InvalidJsonBody: "INVALID_JSON_BODY",
  TraceSessionEmptyUpdate: "TRACE_SESSION_EMPTY_UPDATE",
  TraceDisplayNameType: "TRACE_DISPLAY_NAME_TYPE",
  TraceDisplayNameTooLong: "TRACE_DISPLAY_NAME_TOO_LONG",
  TraceMessageType: "TRACE_MESSAGE_TYPE",
  TraceMessageEmpty: "TRACE_MESSAGE_EMPTY",
  TraceMessageTooLong: "TRACE_MESSAGE_TOO_LONG",
  ArticleArchiveUnavailable: "ARTICLE_ARCHIVE_UNAVAILABLE",
  ArticleInvalidPayload: "ARTICLE_INVALID_PAYLOAD",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
