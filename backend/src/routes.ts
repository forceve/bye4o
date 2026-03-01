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

export type WebsiteArticleRoute =
  | { kind: "list"; locale: "zh" | "en" }
  | { kind: "detail"; locale: "zh" | "en"; articleId: string };

export function isApiPath(pathname: string): boolean {
  return pathname.startsWith(API_PREFIX);
}

export function parseWebsiteArticleRoute(pathname: string): WebsiteArticleRoute | null {
  const normalizedPath = normalizePath(pathname);
  const segments = normalizedPath.split("/").filter(Boolean);

  if (segments.length === 2 && segments[0] === "carvings" && segments[1] === "articles") {
    return { kind: "list", locale: "zh" };
  }

  if (
    segments.length === 3 &&
    isWebsiteLocale(segments[0]) &&
    segments[1] === "carvings" &&
    segments[2] === "articles"
  ) {
    return { kind: "list", locale: segments[0] };
  }

  if (segments.length === 2 && segments[0] === "articles") {
    const articleId = normalizeWebsiteArticleId(segments[1]);
    if (!articleId) {
      return null;
    }
    return { kind: "detail", locale: "zh", articleId };
  }

  if (segments.length === 3 && isWebsiteLocale(segments[0]) && segments[1] === "articles") {
    const articleId = normalizeWebsiteArticleId(segments[2]);
    if (!articleId) {
      return null;
    }
    return { kind: "detail", locale: segments[0], articleId };
  }

  return null;
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

export function parseArticleSourceIdFromPath(pathname: string): string | null {
  if (!pathname.startsWith(`${ARTICLES_ROUTE}/`) || !pathname.endsWith("/source")) {
    return null;
  }

  const raw = pathname.slice(`${ARTICLES_ROUTE}/`.length, -"/source".length);
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

function normalizePath(pathname: string): string {
  const base = pathname.split(/[?#]/, 1)[0]?.trim().toLowerCase() ?? "";
  if (!base) {
    return "/";
  }
  const withLeadingSlash = base.startsWith("/") ? base : `/${base}`;
  if (withLeadingSlash.length > 1 && withLeadingSlash.endsWith("/")) {
    return withLeadingSlash.slice(0, -1);
  }
  return withLeadingSlash;
}

function isWebsiteLocale(value: string): value is "zh" | "en" {
  return value === "zh" || value === "en";
}

function normalizeWebsiteArticleId(raw: string): string | null {
  try {
    const decoded = decodeURIComponent(raw).trim().toLowerCase();
    if (!decoded) {
      return null;
    }
    return /^[a-z0-9][a-z0-9-]*$/.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}
