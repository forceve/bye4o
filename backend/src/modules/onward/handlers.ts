import { Env } from "../../types";
import { HttpError } from "../../shared/errors";
import { ErrorCodes } from "../../shared/errorCodes";
import { json, readJsonObject } from "../../shared/http";
import { clearOnwardDraftCookie, parseOnwardDraftCookie, setOnwardDraftCookie } from "./cookies";
import {
  DEFAULT_ONWARD_QUERY_LIMIT,
  ONWARD_DRAFT_COOKIE,
  ONWARD_RESTORE_RETENTION_MS,
} from "./constants";
import { encodeOnwardCursor, parseOnwardCursor } from "./cursor";
import { OnwardItem, OnwardRecycleItem, OnwardRow } from "./types";
import { normalizeOnwardMessage, normalizeOnwardQueryLimit } from "./validation";

interface OnwardAuthContext {
  anonUserId: string;
  cookies: Record<string, string>;
  setCookies: string[];
  url: URL;
}

export async function handleListOnward(
  request: Request,
  env: Env,
  auth: OnwardAuthContext
): Promise<Response> {
  await cleanupExpiredOnwardEntries(env);

  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit") ?? DEFAULT_ONWARD_QUERY_LIMIT);
  const limit = normalizeOnwardQueryLimit(requestedLimit);
  const cursor = parseOnwardCursor(url.searchParams.get("cursor"));

  let query: D1PreparedStatement;
  if (cursor) {
    query = env.DB.prepare(
      `
      SELECT id, message, created_at, updated_at, deleted_at
      FROM onward_entries
      WHERE anon_user_id = ?1
        AND deleted_at IS NULL
        AND ((created_at < ?2) OR (created_at = ?2 AND id < ?3))
      ORDER BY created_at DESC, id DESC
      LIMIT ?4
      `
    ).bind(auth.anonUserId, cursor.timestamp, cursor.id, limit);
  } else {
    query = env.DB.prepare(
      `
      SELECT id, message, created_at, updated_at, deleted_at
      FROM onward_entries
      WHERE anon_user_id = ?1
        AND deleted_at IS NULL
      ORDER BY created_at DESC, id DESC
      LIMIT ?2
      `
    ).bind(auth.anonUserId, limit);
  }

  const result = await query.all<OnwardRow>();
  const rows = result.results ?? [];
  const items = rows.map(toOnwardItem);
  const last = rows.at(-1);

  return json({
    items,
    nextCursor: last ? encodeOnwardCursor(last.created_at, last.id) : null,
  });
}

export async function handleListOnwardRecycle(
  request: Request,
  env: Env,
  auth: OnwardAuthContext
): Promise<Response> {
  await cleanupExpiredOnwardEntries(env);

  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit") ?? DEFAULT_ONWARD_QUERY_LIMIT);
  const limit = normalizeOnwardQueryLimit(requestedLimit);
  const cursor = parseOnwardCursor(url.searchParams.get("cursor"));

  let query: D1PreparedStatement;
  if (cursor) {
    query = env.DB.prepare(
      `
      SELECT id, message, created_at, updated_at, deleted_at
      FROM onward_entries
      WHERE anon_user_id = ?1
        AND deleted_at IS NOT NULL
        AND ((deleted_at < ?2) OR (deleted_at = ?2 AND id < ?3))
      ORDER BY deleted_at DESC, id DESC
      LIMIT ?4
      `
    ).bind(auth.anonUserId, cursor.timestamp, cursor.id, limit);
  } else {
    query = env.DB.prepare(
      `
      SELECT id, message, created_at, updated_at, deleted_at
      FROM onward_entries
      WHERE anon_user_id = ?1
        AND deleted_at IS NOT NULL
      ORDER BY deleted_at DESC, id DESC
      LIMIT ?2
      `
    ).bind(auth.anonUserId, limit);
  }

  const result = await query.all<OnwardRow>();
  const rows = result.results ?? [];
  const items = rows
    .map(toOnwardRecycleItem)
    .filter((item): item is OnwardRecycleItem => item !== null);
  const last = rows.at(-1);

  return json({
    items,
    nextCursor: last?.deleted_at ? encodeOnwardCursor(last.deleted_at, last.id) : null,
  });
}

export async function handleCreateOnward(
  request: Request,
  env: Env,
  auth: OnwardAuthContext
): Promise<Response> {
  await cleanupExpiredOnwardEntries(env);

  const payload = await readJsonObject(request);
  const message = normalizeOnwardMessage(payload.message, true);
  const now = new Date().toISOString();

  const item: OnwardItem = {
    id: crypto.randomUUID(),
    message,
    createdAt: now,
    updatedAt: now,
  };

  await env.DB.prepare(
    `
    INSERT INTO onward_entries (id, anon_user_id, message, created_at, updated_at, deleted_at)
    VALUES (?1, ?2, ?3, ?4, ?5, NULL)
    `
  )
    .bind(item.id, auth.anonUserId, item.message, item.createdAt, item.updatedAt)
    .run();

  clearOnwardDraftCookie(auth.setCookies, auth.url);

  return json({ item }, 201);
}

export async function handleUpdateOnward(
  request: Request,
  env: Env,
  auth: OnwardAuthContext,
  onwardId: string
): Promise<Response> {
  await cleanupExpiredOnwardEntries(env);

  const payload = await readJsonObject(request);
  const message = normalizeOnwardMessage(payload.message, true);

  const row = await env.DB.prepare(
    `
    SELECT id, message, created_at, updated_at, deleted_at
    FROM onward_entries
    WHERE id = ?1 AND anon_user_id = ?2
    LIMIT 1
    `
  )
    .bind(onwardId, auth.anonUserId)
    .first<OnwardRow>();

  if (!row || row.deleted_at) {
    throw new HttpError(404, ErrorCodes.OnwardNotFound, "Onward item not found.");
  }

  const latestRow = await env.DB.prepare(
    `
    SELECT id
    FROM onward_entries
    WHERE anon_user_id = ?1
      AND deleted_at IS NULL
    ORDER BY created_at DESC, id DESC
    LIMIT 1
    `
  )
    .bind(auth.anonUserId)
    .first<{ id: string }>();

  if (!latestRow || latestRow.id !== onwardId) {
    throw new HttpError(
      409,
      ErrorCodes.OnwardEditOnlyLatest,
      "Only the latest onward item can be edited."
    );
  }

  const updatedAt = new Date().toISOString();

  await env.DB.prepare(
    `
    UPDATE onward_entries
    SET message = ?1, updated_at = ?2
    WHERE id = ?3 AND anon_user_id = ?4
    `
  )
    .bind(message, updatedAt, onwardId, auth.anonUserId)
    .run();

  return json({
    item: {
      id: row.id,
      message,
      createdAt: row.created_at,
      updatedAt,
    } satisfies OnwardItem,
  });
}

export async function handleDeleteOnward(
  env: Env,
  auth: OnwardAuthContext,
  onwardId: string
): Promise<Response> {
  await cleanupExpiredOnwardEntries(env);

  const row = await env.DB.prepare(
    `
    SELECT id
    FROM onward_entries
    WHERE id = ?1
      AND anon_user_id = ?2
      AND deleted_at IS NULL
    LIMIT 1
    `
  )
    .bind(onwardId, auth.anonUserId)
    .first<{ id: string }>();

  if (!row) {
    throw new HttpError(404, ErrorCodes.OnwardNotFound, "Onward item not found.");
  }

  const now = new Date().toISOString();

  await env.DB.prepare(
    `
    UPDATE onward_entries
    SET deleted_at = ?1, updated_at = ?1
    WHERE id = ?2 AND anon_user_id = ?3
    `
  )
    .bind(now, onwardId, auth.anonUserId)
    .run();

  return new Response(null, { status: 204 });
}

export async function handleRestoreOnward(
  env: Env,
  auth: OnwardAuthContext,
  onwardId: string
): Promise<Response> {
  await cleanupExpiredOnwardEntries(env);

  const row = await env.DB.prepare(
    `
    SELECT id, message, created_at, updated_at, deleted_at
    FROM onward_entries
    WHERE id = ?1
      AND anon_user_id = ?2
      AND deleted_at IS NOT NULL
    LIMIT 1
    `
  )
    .bind(onwardId, auth.anonUserId)
    .first<OnwardRow>();

  if (!row || !row.deleted_at) {
    throw new HttpError(404, ErrorCodes.OnwardNotFound, "Onward item not found.");
  }

  const deletedAtMs = Date.parse(row.deleted_at);
  const restoreDeadlineMs = deletedAtMs + ONWARD_RESTORE_RETENTION_MS;
  if (!Number.isFinite(deletedAtMs) || Date.now() > restoreDeadlineMs) {
    await env.DB.prepare(
      `
      DELETE FROM onward_entries
      WHERE id = ?1 AND anon_user_id = ?2
      `
    )
      .bind(onwardId, auth.anonUserId)
      .run();

    throw new HttpError(
      410,
      ErrorCodes.OnwardRestoreExpired,
      "This onward item can no longer be restored."
    );
  }

  const updatedAt = new Date().toISOString();

  await env.DB.prepare(
    `
    UPDATE onward_entries
    SET deleted_at = NULL, updated_at = ?1
    WHERE id = ?2 AND anon_user_id = ?3
    `
  )
    .bind(updatedAt, onwardId, auth.anonUserId)
    .run();

  return json({
    item: {
      id: row.id,
      message: row.message,
      createdAt: row.created_at,
      updatedAt,
    } satisfies OnwardItem,
  });
}

export async function handleGetOnwardSession(
  env: Env,
  auth: OnwardAuthContext
): Promise<Response> {
  await cleanupExpiredOnwardEntries(env);

  const draft = parseOnwardDraftCookie(auth.cookies[ONWARD_DRAFT_COOKIE]);

  return json({
    anonUserId: auth.anonUserId,
    draft: {
      message: draft?.message ?? "",
    },
  });
}

export async function handleUpdateOnwardSession(
  request: Request,
  env: Env,
  auth: OnwardAuthContext
): Promise<Response> {
  await cleanupExpiredOnwardEntries(env);

  const payload = await readJsonObject(request);
  const hasMessage = Object.hasOwn(payload, "message");

  if (!hasMessage) {
    throw new HttpError(
      400,
      ErrorCodes.OnwardSessionEmptyUpdate,
      "Provide at least one field: message."
    );
  }

  const message = normalizeOnwardMessage(payload.message, false);

  if (message) {
    setOnwardDraftCookie(auth.setCookies, { message }, auth.url);
  } else {
    clearOnwardDraftCookie(auth.setCookies, auth.url);
  }

  return json({
    anonUserId: auth.anonUserId,
    draft: {
      message,
    },
  });
}

async function cleanupExpiredOnwardEntries(env: Env): Promise<void> {
  const cutoff = new Date(Date.now() - ONWARD_RESTORE_RETENTION_MS).toISOString();

  await env.DB.prepare(
    `
    DELETE FROM onward_entries
    WHERE deleted_at IS NOT NULL
      AND deleted_at < ?1
    `
  )
    .bind(cutoff)
    .run();
}

function toOnwardItem(row: OnwardRow): OnwardItem {
  return {
    id: row.id,
    message: row.message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toOnwardRecycleItem(row: OnwardRow): OnwardRecycleItem | null {
  if (!row.deleted_at) {
    return null;
  }

  const deletedAtMs = Date.parse(row.deleted_at);
  if (!Number.isFinite(deletedAtMs)) {
    return null;
  }

  return {
    ...toOnwardItem(row),
    deletedAt: row.deleted_at,
    restoreDeadline: new Date(deletedAtMs + ONWARD_RESTORE_RETENTION_MS).toISOString(),
  };
}
