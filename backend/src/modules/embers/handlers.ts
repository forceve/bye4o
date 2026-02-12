import { Env } from "../../types";
import { HttpError } from "../../shared/errors";
import { ErrorCodes } from "../../shared/errorCodes";
import { json, readJsonObject } from "../../shared/http";
import {
  clearEmberDraftCookie,
  clearEmberNameCookie,
  parseDraftCookie,
  setEmberDraftCookie,
  setEmberNameCookie,
} from "./cookies";
import { DEFAULT_EMBER_NAME, DEFAULT_EMBER_QUERY_LIMIT, EMBER_DRAFT_COOKIE } from "./constants";
import { encodeEmberCursor, parseEmberCursor } from "./cursor";
import { EmberItem, EmberRow } from "./types";
import {
  getStoredEmberName,
  normalizeQueryLimit,
  normalizeEmberMessage,
  normalizeEmberName,
} from "./validation";

interface EmberAuthContext {
  anonUserId: string;
  cookies: Record<string, string>;
  setCookies: string[];
  url: URL;
}

export async function handleListEmbers(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit") ?? DEFAULT_EMBER_QUERY_LIMIT);
  const limit = normalizeQueryLimit(requestedLimit);
  const cursor = parseEmberCursor(url.searchParams.get("cursor"));

  let query: D1PreparedStatement;
  if (cursor) {
    query = env.DB.prepare(
      `
      SELECT id, display_name, message, created_at
      FROM embers
      WHERE (created_at < ?1) OR (created_at = ?1 AND id < ?2)
      ORDER BY created_at DESC, id DESC
      LIMIT ?3
      `
    ).bind(cursor.createdAt, cursor.id, limit);
  } else {
    query = env.DB.prepare(
      `
      SELECT id, display_name, message, created_at
      FROM embers
      ORDER BY created_at DESC, id DESC
      LIMIT ?1
      `
    ).bind(limit);
  }

  const result = await query.all<EmberRow>();
  const rows = result.results ?? [];
  const items = rows.map(toEmberItem);
  const last = rows.at(-1);

  return json({
    items,
    nextCursor: last ? encodeEmberCursor(last.created_at, last.id) : null,
  });
}

export async function handleCreateEmber(
  request: Request,
  env: Env,
  _ctx: ExecutionContext,
  auth: EmberAuthContext
): Promise<Response> {
  const payload = await readJsonObject(request);
  const hasDisplayName = Object.hasOwn(payload, "displayName");

  const submittedName = hasDisplayName ? normalizeEmberName(payload.displayName) : "";
  const fallbackName = getStoredEmberName(auth.cookies) || DEFAULT_EMBER_NAME;
  const displayName = submittedName || fallbackName;
  const message = normalizeEmberMessage(payload.message, true);

  const ember: EmberItem = {
    id: crypto.randomUUID(),
    displayName,
    message,
    createdAt: new Date().toISOString(),
  };

  await env.DB.prepare(
    `
    INSERT INTO embers (id, anon_user_id, display_name, message, created_at)
    VALUES (?1, ?2, ?3, ?4, ?5)
    `
  )
    .bind(ember.id, auth.anonUserId, ember.displayName, ember.message, ember.createdAt)
    .run();

  if (submittedName) {
    setEmberNameCookie(auth.setCookies, submittedName, auth.url);
  }

  clearEmberDraftCookie(auth.setCookies, auth.url);

  return json({ item: ember }, 201);
}

export function handleGetEmberSession(auth: EmberAuthContext): Response {
  const draft = parseDraftCookie(auth.cookies[EMBER_DRAFT_COOKIE]);
  const storedName = getStoredEmberName(auth.cookies);

  return json({
    anonUserId: auth.anonUserId,
    draft: {
      displayName: storedName || draft?.displayName || "",
      message: draft?.message ?? "",
    },
  });
}

export async function handleUpdateEmberSession(
  request: Request,
  auth: EmberAuthContext
): Promise<Response> {
  const payload = await readJsonObject(request);
  const hasDisplayName = Object.hasOwn(payload, "displayName");
  const hasMessage = Object.hasOwn(payload, "message");

  if (!hasDisplayName && !hasMessage) {
    throw new HttpError(
      400,
      ErrorCodes.EmberSessionEmptyUpdate,
      "Provide at least one field: displayName or message."
    );
  }

  const currentDraft = parseDraftCookie(auth.cookies[EMBER_DRAFT_COOKIE]);
  const currentDisplayName = getStoredEmberName(auth.cookies) || currentDraft?.displayName || "";
  const currentMessage = currentDraft?.message ?? "";

  const nextDisplayName = hasDisplayName
    ? normalizeEmberName(payload.displayName)
    : currentDisplayName;
  const nextMessage = hasMessage
    ? normalizeEmberMessage(payload.message, false)
    : currentMessage;

  if (hasDisplayName) {
    if (nextDisplayName) {
      setEmberNameCookie(auth.setCookies, nextDisplayName, auth.url);
    } else {
      clearEmberNameCookie(auth.setCookies, auth.url);
    }
  }

  if (nextDisplayName || nextMessage) {
    setEmberDraftCookie(
      auth.setCookies,
      {
        displayName: nextDisplayName,
        message: nextMessage,
      },
      auth.url
    );
  } else {
    clearEmberDraftCookie(auth.setCookies, auth.url);
  }

  return json({
    anonUserId: auth.anonUserId,
    draft: {
      displayName: nextDisplayName,
      message: nextMessage,
    },
  });
}

function toEmberItem(row: EmberRow): EmberItem {
  return {
    id: row.id,
    displayName: row.display_name,
    message: row.message,
    createdAt: row.created_at,
  };
}
