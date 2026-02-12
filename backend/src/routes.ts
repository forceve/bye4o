export const API_PREFIX = "/api";

export const HEALTH_ROUTE = `${API_PREFIX}/health`;
export const TRACES_ROUTE = `${API_PREFIX}/traces`;
export const TRACES_SESSION_ROUTE = `${TRACES_ROUTE}/session`;
export const ARTICLES_ROUTE = `${API_PREFIX}/articles`;

export function isApiPath(pathname: string): boolean {
  return pathname.startsWith(API_PREFIX);
}

export function isTracesPath(pathname: string): boolean {
  return pathname === TRACES_ROUTE || pathname.startsWith(`${TRACES_ROUTE}/`);
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
