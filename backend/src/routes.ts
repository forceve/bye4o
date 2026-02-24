export const API_PREFIX = "/api";

export const HEALTH_ROUTE = `${API_PREFIX}/health`;
export const EMBERS_ROUTE = `${API_PREFIX}/embers`;
export const EMBERS_SESSION_ROUTE = `${EMBERS_ROUTE}/session`;
export const ARTICLES_ROUTE = `${API_PREFIX}/articles`;
export const ONWARD_ROUTE = `${API_PREFIX}/onward`;
export const ONWARD_SESSION_ROUTE = `${ONWARD_ROUTE}/session`;
export const ONWARD_RECYCLE_ROUTE = `${ONWARD_ROUTE}/recycle`;
export const UNBURNT_ROUTE = `${API_PREFIX}/unburnt`;
export const UNBURNT_PUBLIC_ROUTE = `${UNBURNT_ROUTE}/public`;
export const UNBURNT_DRAFT_ROUTE = `${UNBURNT_ROUTE}/draft`;

export function isApiPath(pathname: string): boolean {
  return pathname.startsWith(API_PREFIX);
}

export function isEmbersPath(pathname: string): boolean {
  return pathname === EMBERS_ROUTE || pathname.startsWith(`${EMBERS_ROUTE}/`);
}

export function isOnwardPath(pathname: string): boolean {
  return pathname === ONWARD_ROUTE || pathname.startsWith(`${ONWARD_ROUTE}/`);
}

export function isArticlesPath(pathname: string): boolean {
  return pathname === ARTICLES_ROUTE || pathname.startsWith(`${ARTICLES_ROUTE}/`);
}

export function isUnburntPath(pathname: string): boolean {
  return pathname === UNBURNT_ROUTE || pathname.startsWith(`${UNBURNT_ROUTE}/`);
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

export function parseOnwardIdFromPath(pathname: string): string | null {
  if (!pathname.startsWith(`${ONWARD_ROUTE}/`)) {
    return null;
  }

  const raw = pathname.slice(`${ONWARD_ROUTE}/`.length);
  if (!raw || raw.includes("/")) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(raw).trim();
    return decoded || null;
  } catch {
    const trimmed = raw.trim();
    return trimmed || null;
  }
}

export function parseOnwardRestoreIdFromPath(pathname: string): string | null {
  if (!pathname.startsWith(`${ONWARD_ROUTE}/`) || !pathname.endsWith("/restore")) {
    return null;
  }

  const raw = pathname.slice(`${ONWARD_ROUTE}/`.length, -"/restore".length);
  if (!raw || raw.includes("/")) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(raw).trim();
    return decoded || null;
  } catch {
    const trimmed = raw.trim();
    return trimmed || null;
  }
}

export function parseUnburntIdFromPath(pathname: string): string | null {
  if (!pathname.startsWith(`${UNBURNT_ROUTE}/`)) {
    return null;
  }

  const raw = pathname.slice(`${UNBURNT_ROUTE}/`.length);
  if (!raw || raw.includes("/")) {
    return null;
  }

  if (raw === "public" || raw === "draft") {
    return null;
  }

  try {
    const decoded = decodeURIComponent(raw).trim();
    return decoded || null;
  } catch {
    const trimmed = raw.trim();
    return trimmed || null;
  }
}

export function parseUnburntVisibilityIdFromPath(pathname: string): string | null {
  if (!pathname.startsWith(`${UNBURNT_ROUTE}/`) || !pathname.endsWith("/visibility")) {
    return null;
  }

  const raw = pathname.slice(`${UNBURNT_ROUTE}/`.length, -"/visibility".length);
  if (!raw || raw.includes("/")) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(raw).trim();
    return decoded || null;
  } catch {
    const trimmed = raw.trim();
    return trimmed || null;
  }
}

export function parseUnburntPublicIdFromPath(pathname: string): string | null {
  if (!pathname.startsWith(`${UNBURNT_PUBLIC_ROUTE}/`)) {
    return null;
  }

  const raw = pathname.slice(`${UNBURNT_PUBLIC_ROUTE}/`.length);
  if (!raw || raw.includes("/")) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(raw).trim();
    return decoded || null;
  } catch {
    const trimmed = raw.trim();
    return trimmed || null;
  }
}
