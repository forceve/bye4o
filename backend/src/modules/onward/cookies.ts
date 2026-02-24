import { decodeBase64Url, encodeBase64Url } from "../../shared/base64url";
import { serializeCookie, shouldUseSecureCookie } from "../../shared/cookies";
import {
  MAX_ONWARD_MESSAGE_LENGTH,
  ONWARD_DRAFT_COOKIE,
  ONWARD_DRAFT_COOKIE_MAX_AGE_SECONDS,
} from "./constants";
import { OnwardDraftPayload } from "./types";

export function setOnwardDraftCookie(
  setCookies: string[],
  payload: OnwardDraftPayload,
  url: URL
): void {
  setCookies.push(
    serializeCookie(ONWARD_DRAFT_COOKIE, encodeDraftCookie(payload), {
      maxAge: ONWARD_DRAFT_COOKIE_MAX_AGE_SECONDS,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: shouldUseSecureCookie(url),
    })
  );
}

export function clearOnwardDraftCookie(setCookies: string[], url: URL): void {
  setCookies.push(
    serializeCookie(ONWARD_DRAFT_COOKIE, "", {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: shouldUseSecureCookie(url),
    })
  );
}

export function parseOnwardDraftCookie(rawValue: string | undefined): OnwardDraftPayload | null {
  if (!rawValue) {
    return null;
  }

  try {
    const decoded = decodeDraftCookie(rawValue);
    if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) {
      return null;
    }

    const messageRaw = (decoded as Record<string, unknown>).message;
    const message = typeof messageRaw === "string" ? messageRaw.trim() : "";

    if (Array.from(message).length > MAX_ONWARD_MESSAGE_LENGTH) {
      return null;
    }

    return { message };
  } catch {
    return null;
  }
}

function encodeDraftCookie(payload: OnwardDraftPayload): string {
  const jsonValue = JSON.stringify(payload);
  const encoded = new TextEncoder().encode(jsonValue);
  return encodeBase64Url(encoded);
}

function decodeDraftCookie(value: string): unknown {
  const bytes = decodeBase64Url(value);
  const jsonValue = new TextDecoder().decode(bytes);
  return JSON.parse(jsonValue);
}
