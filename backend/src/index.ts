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
  handleCreateOnward,
  handleDeleteOnward,
  handleGetOnwardSession,
  handleListOnward,
  handleListOnwardRecycle,
  handleRestoreOnward,
  handleUpdateOnward,
  handleUpdateOnwardSession,
} from "./modules/onward/handlers";
import {
  handleCreateUnburnt,
  handleDeleteUnburnt,
  handleDeleteUnburntDraft,
  handleGetUnburntDraft,
  handleGetUnburntMine,
  handleGetUnburntPublic,
  handleListUnburntMine,
  handleListUnburntPublic,
  handleUpdateUnburnt,
  handleUpdateUnburntDraft,
  handleUpdateUnburntVisibility,
} from "./modules/unburnt/handlers";
import {
  HEALTH_ROUTE,
  ARTICLES_ROUTE,
  EMBERS_ROUTE,
  EMBERS_SESSION_ROUTE,
  ONWARD_ROUTE,
  ONWARD_RECYCLE_ROUTE,
  ONWARD_SESSION_ROUTE,
  UNBURNT_ROUTE,
  UNBURNT_DRAFT_ROUTE,
  UNBURNT_PUBLIC_ROUTE,
  isApiPath,
  parseArticleIdFromPath,
  isEmbersPath,
  isOnwardPath,
  isUnburntPath,
  parseOnwardIdFromPath,
  parseOnwardRestoreIdFromPath,
  parseUnburntIdFromPath,
  parseUnburntPublicIdFromPath,
  parseUnburntVisibilityIdFromPath,
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
    const anonUserId =
      isEmbersPath(pathname) || isOnwardPath(pathname) || isUnburntPath(pathname)
        ? ensureAnonUserId(cookies, setCookies, url)
        : "";

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
      } else if (pathname === ONWARD_ROUTE && request.method === "GET") {
        response = await handleListOnward(request, env, {
          anonUserId,
          cookies,
          setCookies,
          url,
        });
      } else if (pathname === ONWARD_RECYCLE_ROUTE && request.method === "GET") {
        response = await handleListOnwardRecycle(request, env, {
          anonUserId,
          cookies,
          setCookies,
          url,
        });
      } else if (pathname === ONWARD_ROUTE && request.method === "POST") {
        response = await handleCreateOnward(request, env, {
          anonUserId,
          cookies,
          setCookies,
          url,
        });
      } else if (pathname === ONWARD_SESSION_ROUTE && request.method === "GET") {
        response = await handleGetOnwardSession(env, {
          anonUserId,
          cookies,
          setCookies,
          url,
        });
      } else if (pathname === ONWARD_SESSION_ROUTE && request.method === "PUT") {
        response = await handleUpdateOnwardSession(request, env, {
          anonUserId,
          cookies,
          setCookies,
          url,
        });
      } else if (pathname === UNBURNT_ROUTE && request.method === "GET") {
        response = await handleListUnburntMine(request, env, {
          anonUserId,
          cookies,
          setCookies,
          url,
        });
      } else if (pathname === UNBURNT_ROUTE && request.method === "POST") {
        response = await handleCreateUnburnt(request, env, {
          anonUserId,
          cookies,
          setCookies,
          url,
        });
      } else if (pathname === UNBURNT_DRAFT_ROUTE && request.method === "GET") {
        response = await handleGetUnburntDraft(env, {
          anonUserId,
          cookies,
          setCookies,
          url,
        });
      } else if (pathname === UNBURNT_DRAFT_ROUTE && request.method === "PUT") {
        response = await handleUpdateUnburntDraft(request, env, {
          anonUserId,
          cookies,
          setCookies,
          url,
        });
      } else if (pathname === UNBURNT_DRAFT_ROUTE && request.method === "DELETE") {
        response = await handleDeleteUnburntDraft(env, {
          anonUserId,
          cookies,
          setCookies,
          url,
        });
      } else if (pathname === UNBURNT_PUBLIC_ROUTE && request.method === "GET") {
        response = await handleListUnburntPublic(request, env, anonUserId);
      } else if (
        pathname.startsWith(`${UNBURNT_PUBLIC_ROUTE}/`) &&
        request.method === "GET"
      ) {
        const unburntId = parseUnburntPublicIdFromPath(pathname);
        if (!unburntId) {
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
          response = await handleGetUnburntPublic(env, unburntId);
        }
      } else if (
        pathname.startsWith(`${UNBURNT_ROUTE}/`) &&
        pathname.endsWith("/visibility") &&
        request.method === "POST"
      ) {
        const unburntId = parseUnburntVisibilityIdFromPath(pathname);
        if (!unburntId) {
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
          response = await handleUpdateUnburntVisibility(request, env, {
            anonUserId,
            cookies,
            setCookies,
            url,
          }, unburntId);
        }
      } else if (pathname.startsWith(`${UNBURNT_ROUTE}/`) && request.method === "GET") {
        const unburntId = parseUnburntIdFromPath(pathname);
        if (!unburntId) {
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
          response = await handleGetUnburntMine(env, {
            anonUserId,
            cookies,
            setCookies,
            url,
          }, unburntId);
        }
      } else if (pathname.startsWith(`${UNBURNT_ROUTE}/`) && request.method === "PATCH") {
        const unburntId = parseUnburntIdFromPath(pathname);
        if (!unburntId) {
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
          response = await handleUpdateUnburnt(request, env, {
            anonUserId,
            cookies,
            setCookies,
            url,
          }, unburntId);
        }
      } else if (pathname.startsWith(`${UNBURNT_ROUTE}/`) && request.method === "DELETE") {
        const unburntId = parseUnburntIdFromPath(pathname);
        if (!unburntId) {
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
          response = await handleDeleteUnburnt(env, {
            anonUserId,
            cookies,
            setCookies,
            url,
          }, unburntId);
        }
      } else if (
        pathname.startsWith(`${ONWARD_ROUTE}/`) &&
        pathname.endsWith("/restore") &&
        request.method === "POST"
      ) {
        const onwardId = parseOnwardRestoreIdFromPath(pathname);
        if (!onwardId) {
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
          response = await handleRestoreOnward(env, {
            anonUserId,
            cookies,
            setCookies,
            url,
          }, onwardId);
        }
      } else if (pathname.startsWith(`${ONWARD_ROUTE}/`) && request.method === "PATCH") {
        const onwardId = parseOnwardIdFromPath(pathname);
        if (!onwardId) {
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
          response = await handleUpdateOnward(request, env, {
            anonUserId,
            cookies,
            setCookies,
            url,
          }, onwardId);
        }
      } else if (pathname.startsWith(`${ONWARD_ROUTE}/`) && request.method === "DELETE") {
        const onwardId = parseOnwardIdFromPath(pathname);
        if (!onwardId) {
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
          response = await handleDeleteOnward(env, {
            anonUserId,
            cookies,
            setCookies,
            url,
          }, onwardId);
        }
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
