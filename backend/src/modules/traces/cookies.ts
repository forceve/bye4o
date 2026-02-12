import { decodeBase64Url, encodeBase64Url } from "../../shared/base64url";
import {
  serializeCookie,
  shouldUseSecureCookie,
} from "../../shared/cookies";
import {
  ANON_USER_COOKIE,
  MAX_TRACE_MESSAGE_LENGTH,
  MAX_TRACE_NAME_LENGTH,
  ONE_YEAR_SECONDS,
  THIRTY_DAYS_SECONDS,
  TRACE_DRAFT_COOKIE,
  TRACE_NAME_COOKIE,
} from "./constants";
import { TraceDraftPayload } from "./types";

export function ensureAnonUserId(
  cookies: Record<string, string>,
  setCookies: string[],
  url: URL
): string {
  const existing = cookies[ANON_USER_COOKIE];
  if (existing && isUuidLike(existing)) {
    return existing;
  }

  const anonUserId = crypto.randomUUID();
  setCookies.push(
    serializeCookie(ANON_USER_COOKIE, anonUserId, {
      maxAge: ONE_YEAR_SECONDS,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: shouldUseSecureCookie(url),
    })
  );
  return anonUserId;
}

export function setTraceNameCookie(
  setCookies: string[],
  displayName: string,
  url: URL
): void {
  setCookies.push(
    serializeCookie(TRACE_NAME_COOKIE, displayName, {
      maxAge: ONE_YEAR_SECONDS,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: shouldUseSecureCookie(url),
    })
  );
}

export function clearTraceNameCookie(setCookies: string[], url: URL): void {
  setCookies.push(
    serializeCookie(TRACE_NAME_COOKIE, "", {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: shouldUseSecureCookie(url),
    })
  );
}

export function setTraceDraftCookie(
  setCookies: string[],
  payload: TraceDraftPayload,
  url: URL
): void {
  setCookies.push(
    serializeCookie(TRACE_DRAFT_COOKIE, encodeDraftCookie(payload), {
      maxAge: THIRTY_DAYS_SECONDS,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: shouldUseSecureCookie(url),
    })
  );
}

export function clearTraceDraftCookie(setCookies: string[], url: URL): void {
  setCookies.push(
    serializeCookie(TRACE_DRAFT_COOKIE, "", {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: shouldUseSecureCookie(url),
    })
  );
}

export function parseDraftCookie(rawValue: string | undefined): TraceDraftPayload | null {
  if (!rawValue) {
    return null;
  }

  try {
    const decoded = decodeDraftCookie(rawValue);
    if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) {
      return null;
    }

    const displayNameRaw = (decoded as Record<string, unknown>).displayName;
    const messageRaw = (decoded as Record<string, unknown>).message;

    const displayName = typeof displayNameRaw === "string" ? displayNameRaw.trim() : "";
    const message = typeof messageRaw === "string" ? messageRaw.trim() : "";

    if (Array.from(displayName).length > MAX_TRACE_NAME_LENGTH) {
      return null;
    }

    if (Array.from(message).length > MAX_TRACE_MESSAGE_LENGTH) {
      return null;
    }

    return { displayName, message };
  } catch {
    return null;
  }
}

function encodeDraftCookie(payload: TraceDraftPayload): string {
  const jsonValue = JSON.stringify(payload);
  const encoded = new TextEncoder().encode(jsonValue);
  return encodeBase64Url(encoded);
}

function decodeDraftCookie(value: string): unknown {
  const bytes = decodeBase64Url(value);
  const jsonValue = new TextDecoder().decode(bytes);
  return JSON.parse(jsonValue);
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
