export const API_PREFIX = "/api";

export const HEALTH_ROUTE = `${API_PREFIX}/health`;
export const TRACES_ROUTE = `${API_PREFIX}/traces`;
export const TRACES_SESSION_ROUTE = `${TRACES_ROUTE}/session`;

export function isApiPath(pathname: string): boolean {
  return pathname.startsWith(API_PREFIX);
}

export function isTracesPath(pathname: string): boolean {
  return pathname === TRACES_ROUTE || pathname.startsWith(`${TRACES_ROUTE}/`);
}
