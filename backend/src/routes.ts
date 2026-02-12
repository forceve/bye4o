export const API_PREFIX = "/api";

export const HEALTH_ROUTE = `${API_PREFIX}/health`;
export const EMBERS_ROUTE = `${API_PREFIX}/embers`;
export const EMBERS_SESSION_ROUTE = `${EMBERS_ROUTE}/session`;
export const ARTICLES_ROUTE = `${API_PREFIX}/articles`;

export function isApiPath(pathname: string): boolean {
  return pathname.startsWith(API_PREFIX);
}

export function isEmbersPath(pathname: string): boolean {
  return pathname === EMBERS_ROUTE || pathname.startsWith(`${EMBERS_ROUTE}/`);
}

export function isArticlesPath(pathname: string): boolean {
  return pathname === ARTICLES_ROUTE || pathname.startsWith(`${ARTICLES_ROUTE}/`);
}

export function parseArticleIdFromPath(pathname: string): string | null {
  if (!pathname.startsWith(`${ARTICLES_ROUTE}/`)) {
    return null;
  }

  const raw = pathname.slice(`${ARTICLES_ROUTE}/`.length);
  if (!raw || raw.includes("/")) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(raw).trim().toLowerCase();
    return decoded || null;
  } catch {
    const trimmed = raw.trim().toLowerCase();
    return trimmed || null;
  }
}
