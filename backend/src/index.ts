import { handleHealth } from "./modules/health/handlers";
import { ensureAnonUserId } from "./modules/traces/cookies";
import {
  handleCreateTrace,
  handleGetTraceSession,
  handleListTraces,
  handleUpdateTraceSession,
} from "./modules/traces/handlers";
import {
  HEALTH_ROUTE,
  TRACES_ROUTE,
  TRACES_SESSION_ROUTE,
  isApiPath,
  isTracesPath,
} from "./routes";
import { buildPreflightResponse, withCommonHeaders } from "./shared/cors";
import { parseCookieHeader } from "./shared/cookies";
import { HttpError } from "./shared/errors";
import { json } from "./shared/http";
import { Env } from "./types";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (!isApiPath(pathname)) {
      return json(
        {
          error: "NOT_FOUND",
          message: "Route not found.",
        },
        404
      );
    }

    if (request.method.toUpperCase() === "OPTIONS") {
      return buildPreflightResponse(request, env.CORS_ORIGIN);
    }

    const cookies = parseCookieHeader(request.headers.get("Cookie"));
    const setCookies: string[] = [];
    const anonUserId = isTracesPath(pathname) ? ensureAnonUserId(cookies, setCookies, url) : "";

    try {
      let response: Response;

      if (pathname === HEALTH_ROUTE && request.method === "GET") {
        response = handleHealth();
      } else if (pathname === TRACES_ROUTE && request.method === "GET") {
        response = await handleListTraces(request, env);
      } else if (pathname === TRACES_ROUTE && request.method === "POST") {
        response = await handleCreateTrace(request, env, ctx, {
          anonUserId,
          cookies,
          setCookies,
          url,
        });
      } else if (pathname === TRACES_SESSION_ROUTE && request.method === "GET") {
        response = handleGetTraceSession({
          anonUserId,
          cookies,
          setCookies,
          url,
        });
      } else if (pathname === TRACES_SESSION_ROUTE && request.method === "PUT") {
        response = await handleUpdateTraceSession(request, {
          anonUserId,
          cookies,
          setCookies,
          url,
        });
      } else {
        response = json(
          {
            error: "NOT_FOUND",
            message: "Route not found.",
          },
          404
        );
      }

      return withCommonHeaders(response, request, env.CORS_ORIGIN, setCookies);
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        const response = json(
          {
            error: "BAD_REQUEST",
            message: error.message,
          },
          error.status
        );
        return withCommonHeaders(response, request, env.CORS_ORIGIN, setCookies);
      }

      const response = json(
        {
          error: "INTERNAL_ERROR",
          message: "Unexpected server error.",
        },
        500
      );
      return withCommonHeaders(response, request, env.CORS_ORIGIN, setCookies);
    }
  },
};
