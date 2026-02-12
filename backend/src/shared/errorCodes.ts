export const ErrorCodes = {
  NotFound: "NOT_FOUND",
  InternalError: "INTERNAL_ERROR",
  InvalidJsonBodyType: "INVALID_JSON_BODY_TYPE",
  InvalidJsonBody: "INVALID_JSON_BODY",
  EmberSessionEmptyUpdate: "EMBER_SESSION_EMPTY_UPDATE",
  EmberDisplayNameType: "EMBER_DISPLAY_NAME_TYPE",
  EmberDisplayNameTooLong: "EMBER_DISPLAY_NAME_TOO_LONG",
  EmberMessageType: "EMBER_MESSAGE_TYPE",
  EmberMessageEmpty: "EMBER_MESSAGE_EMPTY",
  EmberMessageTooLong: "EMBER_MESSAGE_TOO_LONG",
  ArticleArchiveUnavailable: "ARTICLE_ARCHIVE_UNAVAILABLE",
  ArticleInvalidPayload: "ARTICLE_INVALID_PAYLOAD",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
