import { decodeBase64Url, encodeBase64Url } from "../../shared/base64url";

export function encodeEmberCursor(createdAt: string, id: string): string {
  const raw = `${createdAt}|${id}`;
  return encodeBase64Url(new TextEncoder().encode(raw));
}

export function parseEmberCursor(
  cursor: string | null
): { createdAt: string; id: string } | null {
  if (!cursor) {
    return null;
  }

  try {
    const raw = new TextDecoder().decode(decodeBase64Url(cursor));
    const [createdAt, id] = raw.split("|");
    if (!createdAt || !id) {
      return null;
    }

    if (Number.isNaN(Date.parse(createdAt))) {
      return null;
    }

    return { createdAt, id };
  } catch {
    return null;
  }
}
