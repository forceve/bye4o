import { handleHealth } from "./modules/health/handlers";
import { handleGetArticle, handleListArticles } from "./modules/articles/handlers";
import { ensureAnonUserId } from "./modules/embers/cookies";
import {
  handleCreateEmber,
  handleGetEmberSession,
  handleListEmbers,
  handleUpdateEmberSession,
} from "./modules/embers/handlers";
import {
  HEALTH_ROUTE,
  ARTICLES_ROUTE,
  EMBERS_ROUTE,
  EMBERS_SESSION_ROUTE,
  isApiPath,
  parseArticleIdFromPath,
  isEmbersPath,
} from "./routes";
import { buildPreflightResponse, withCommonHeaders } from "./shared/cors";
import { parseCookieHeader } from "./shared/cookies";
import { HttpError } from "./shared/errors";
import { ErrorCodes } from "./shared/errorCodes";
import { json } from "./shared/http";
import { Env } from "./types";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (!isApiPath(pathname)) {
      return json(
        {
          error: ErrorCodes.NotFound,
          code: ErrorCodes.NotFound,
          message: "Route not found.",
          details: null,
        },
        404
      );
    }

    if (request.method.toUpperCase() === "OPTIONS") {
      return buildPreflightResponse(request, env.CORS_ORIGIN);
    }

    const cookies = parseCookieHeader(request.headers.get("Cookie"));
    const setCookies: string[] = [];
    const anonUserId = isEmbersPath(pathname) ? ensureAnonUserId(cookies, setCookies, url) : "";

    try {
      let response: Response;

      if (pathname === HEALTH_ROUTE && request.method === "GET") {
        response = handleHealth();
      } else if (pathname === ARTICLES_ROUTE && request.method === "GET") {
        response = await handleListArticles(request, env);
      } else if (pathname.startsWith(`${ARTICLES_ROUTE}/`) && request.method === "GET") {
        const articleId = parseArticleIdFromPath(pathname);
        if (!articleId) {
          response = json(
            {
              error: ErrorCodes.NotFound,
              code: ErrorCodes.NotFound,
              message: "Route not found.",
              details: null,
            },
            404
          );
        } else {
          response = await handleGetArticle(request, env, articleId);
        }
      } else if (pathname === EMBERS_ROUTE && request.method === "GET") {
        response = await handleListEmbers(request, env);
      } else if (pathname === EMBERS_ROUTE && request.method === "POST") {
        response = await handleCreateEmber(request, env, ctx, {
          anonUserId,
          cookies,
          setCookies,
          url,
        });
      } else if (pathname === EMBERS_SESSION_ROUTE && request.method === "GET") {
        response = handleGetEmberSession({
          anonUserId,
          cookies,
          setCookies,
          url,
        });
      } else if (pathname === EMBERS_SESSION_ROUTE && request.method === "PUT") {
        response = await handleUpdateEmberSession(request, {
          anonUserId,
          cookies,
          setCookies,
          url,
        });
      } else {
        response = json(
          {
            error: ErrorCodes.NotFound,
            code: ErrorCodes.NotFound,
            message: "Route not found.",
            details: null,
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
            code: error.code,
            message: error.message,
            details: error.details ?? null,
          },
          error.status
        );
        return withCommonHeaders(response, request, env.CORS_ORIGIN, setCookies);
      }

      const response = json(
        {
          error: ErrorCodes.InternalError,
          code: ErrorCodes.InternalError,
          message: "Unexpected server error.",
          details: null,
        },
        500
      );
      return withCommonHeaders(response, request, env.CORS_ORIGIN, setCookies);
    }
  },
};
