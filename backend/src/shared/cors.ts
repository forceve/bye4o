export function buildPreflightResponse(
  request: Request,
  corsConfig: string | undefined
): Response {
  const origin = request.headers.get("Origin");
  if (!origin) {
    return new Response(null, { status: 204 });
  }

  const allowedOrigin = resolveAllowedOrigin(origin, corsConfig);
  if (!allowedOrigin) {
    return new Response(null, { status: 403 });
  }

  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", allowedOrigin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Max-Age", "600");
  appendVary(headers, "Origin");
  return new Response(null, { status: 204, headers });
}

export function withCommonHeaders(
  response: Response,
  request: Request,
  corsConfig: string | undefined,
  setCookies: string[]
): Response {
  const headers = new Headers(response.headers);

  for (const setCookie of setCookies) {
    headers.append("Set-Cookie", setCookie);
  }

  const origin = request.headers.get("Origin");
  if (origin) {
    const allowedOrigin = resolveAllowedOrigin(origin, corsConfig);
    if (allowedOrigin) {
      headers.set("Access-Control-Allow-Origin", allowedOrigin);
      headers.set("Access-Control-Allow-Credentials", "true");
      appendVary(headers, "Origin");
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function resolveAllowedOrigin(origin: string, configValue: string | undefined): string | null {
  const normalizedConfig = (configValue ?? "").trim();
  if (!normalizedConfig) {
    return origin;
  }

  const allowedOrigins = normalizedConfig
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (allowedOrigins.includes("*")) {
    return origin;
  }

  return allowedOrigins.includes(origin) ? origin : null;
}

function appendVary(headers: Headers, value: string): void {
  const current = headers.get("Vary");
  if (!current) {
    headers.set("Vary", value);
    return;
  }

  const values = current
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!values.includes(value)) {
    values.push(value);
    headers.set("Vary", values.join(", "));
  }
}
