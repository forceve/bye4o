import { decodeBase64Url, encodeBase64Url } from "../../shared/base64url";

export function encodeUnburntCursor(timestamp: string, id: string): string {
  const raw = `${timestamp}|${id}`;
  return encodeBase64Url(new TextEncoder().encode(raw));
}

export function parseUnburntCursor(
  cursor: string | null
): { timestamp: string; id: string } | null {
  if (!cursor) {
    return null;
  }

  try {
    const raw = new TextDecoder().decode(decodeBase64Url(cursor));
    const [timestamp, id] = raw.split("|");
    if (!timestamp || !id) {
      return null;
    }

    if (Number.isNaN(Date.parse(timestamp))) {
      return null;
    }

    return { timestamp, id };
  } catch {
    return null;
  }
}
