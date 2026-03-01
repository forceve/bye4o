interface PagesGatewayEnv {
  WORKER_ORIGIN?: string;
  GATEWAY_PROXY_ALL?: string;
}

interface PagesContext {
  request: Request;
  env: PagesGatewayEnv;
  next: () => Promise<Response>;
}

const ARTICLE_LIST_PATHS = new Set([
  "/carvings/articles",
  "/zh/carvings/articles",
  "/en/carvings/articles",
]);

const ARTICLE_DETAIL_PATH_PATTERN = /^\/(?:(zh|en)\/)?articles\/[a-z0-9][a-z0-9-]*\/?$/i;

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const sourceUrl = new URL(request.url);
  const pathname = normalizePath(sourceUrl.pathname);
  const proxyAll = env.GATEWAY_PROXY_ALL === "1";

  if (!proxyAll && !shouldProxyPath(pathname)) {
    return context.next();
  }

  const upstreamOrigin = normalizeOrigin(env.WORKER_ORIGIN);
  if (!upstreamOrigin) {
    return new Response("Gateway upstream is not configured.", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const upstreamUrl = new URL(request.url);
  upstreamUrl.protocol = upstreamOrigin.protocol;
  upstreamUrl.host = upstreamOrigin.host;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.set("x-forwarded-host", sourceUrl.host);
  headers.set("x-forwarded-proto", sourceUrl.protocol.replace(":", ""));
  const clientIp = request.headers.get("cf-connecting-ip");
  if (clientIp) {
    headers.set("x-forwarded-for", clientIp);
  }

  const upstreamRequest = new Request(upstreamUrl.toString(), {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual",
  });

  return fetch(upstreamRequest);
}

function shouldProxyPath(pathname: string): boolean {
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return true;
  }

  if (ARTICLE_LIST_PATHS.has(pathname)) {
    return true;
  }

  return ARTICLE_DETAIL_PATH_PATTERN.test(pathname);
}

function normalizePath(pathname: string): string {
  if (!pathname) {
    return "/";
  }

  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function normalizeOrigin(value: string | undefined): URL | null {
  const raw = (value ?? "").trim();
  if (!raw) {
    return null;
  }

  try {
    const url = new URL(raw);
    if (!/^https?:$/i.test(url.protocol)) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}
