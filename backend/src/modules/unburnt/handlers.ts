import { Env } from "../../types";
import { HttpError } from "../../shared/errors";
import { ErrorCodes } from "../../shared/errorCodes";
import { json, readJsonObject } from "../../shared/http";
import {
  DEFAULT_UNBURNT_QUERY_LIMIT,
  UNBURNT_VISIBILITY_PRIVATE,
  UNBURNT_VISIBILITY_PUBLIC,
} from "./constants";
import { encodeUnburntCursor, parseUnburntCursor } from "./cursor";
import type {
  UnburntDraftPayload,
  UnburntEntryDetailItem,
  UnburntEntryListItem,
  UnburntEntryRow,
  UnburntListVisibility,
  UnburntMessage,
  UnburntVisibility,
} from "./types";
import {
  normalizeUnburntDraftPayload,
  normalizeUnburntListVisibility,
  normalizeUnburntMessages,
  normalizeUnburntQueryLimit,
  normalizeUnburntRawText,
  normalizeUnburntScope,
  normalizeUnburntSummary,
  normalizeUnburntTags,
  normalizeUnburntTitle,
  normalizeUnburntVisibility,
} from "./validation";

interface UnburntAuthContext {
  anonUserId: string;
  cookies: Record<string, string>;
  setCookies: string[];
  url: URL;
}

export async function handleListUnburntMine(
  request: Request,
  env: Env,
  auth: UnburntAuthContext
): Promise<Response> {
  const url = new URL(request.url);
  normalizeUnburntScope(url.searchParams.get("scope"));

  const visibilityFilter = normalizeUnburntListVisibility(url.searchParams.get("visibility"));
  const requestedLimit = Number(url.searchParams.get("limit") ?? DEFAULT_UNBURNT_QUERY_LIMIT);
  const limit = normalizeUnburntQueryLimit(requestedLimit);
  const cursor = parseUnburntCursor(url.searchParams.get("cursor"));

  const { query, binds } = buildMineListQuery(auth.anonUserId, visibilityFilter, limit, cursor);

  const result = await env.DB.prepare(query).bind(...binds).all<UnburntEntryRow>();
  const rows = result.results ?? [];

  const items = rows.map((row) => toUnburntListItem(row));
  const last = rows.at(-1);

  return json({
    items,
    nextCursor: last ? encodeUnburntCursor(last.created_at, last.id) : null,
  });
}

export async function handleListUnburntPublic(
  request: Request,
  env: Env,
  anonUserId?: string
): Promise<Response> {
  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit") ?? DEFAULT_UNBURNT_QUERY_LIMIT);
  const limit = normalizeUnburntQueryLimit(requestedLimit);
  const cursor = parseUnburntCursor(url.searchParams.get("cursor"));

  // 查询 public 条目
  const { query, binds } = buildPublicListQuery(limit, cursor);
  const result = await env.DB.prepare(query).bind(...binds).all<UnburntEntryRow>();
  const rows = result.results ?? [];
  const publicItems = rows.map((row) => toUnburntListItem(row));
  const publicItemIds = new Set(publicItems.map((item) => item.id));

  // 如果有用户ID，尝试获取一个该用户的私有条目（随机）
  // 确保该条目不在当前的 public 列表中
  let myPrivateRow: UnburntEntryRow | null = null;
  if (anonUserId) {
    // 先尝试获取一个随机的 private 条目
    // 如果它在 public 列表中，就再查询一个（最多尝试几次）
    let found = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      const myPrivateResult = await env.DB.prepare(
        `
        SELECT id, anon_user_id, title, summary, raw_text, messages_json, visibility, tags_json, created_at, updated_at, deleted_at
        FROM unburnt_entries
        WHERE anon_user_id = ?1
          AND deleted_at IS NULL
          AND visibility = ?2
        ORDER BY RANDOM()
        LIMIT 1
        `
      )
        .bind(anonUserId, UNBURNT_VISIBILITY_PRIVATE)
        .first<UnburntEntryRow>();

      if (!myPrivateResult) {
        break; // 没有 private 条目
      }

      // 如果不在 public 列表中，使用它
      if (!publicItemIds.has(myPrivateResult.id)) {
        myPrivateRow = myPrivateResult;
        found = true;
        break;
      }
    }

    // 如果尝试多次都找不到，获取所有 private 条目，排除已在 public 列表中的，然后随机选择一个
    if (!found) {
      const allMyPrivateRows = await env.DB.prepare(
        `
        SELECT id, anon_user_id, title, summary, raw_text, messages_json, visibility, tags_json, created_at, updated_at, deleted_at
        FROM unburnt_entries
        WHERE anon_user_id = ?1
          AND deleted_at IS NULL
          AND visibility = ?2
        `
      )
        .bind(anonUserId, UNBURNT_VISIBILITY_PRIVATE)
        .all<UnburntEntryRow>();

      const availableRows = (allMyPrivateRows.results ?? []).filter(
        (row) => !publicItemIds.has(row.id)
      );

      if (availableRows.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableRows.length);
        myPrivateRow = availableRows[randomIndex];
      }
    }
  }

  // 合并结果
  const items: UnburntEntryListItem[] = [...publicItems];

  // 如果找到了自己的 private 条目，添加到结果中
  if (myPrivateRow) {
    items.push(toUnburntListItem(myPrivateRow));
  }

  // 按创建时间排序（最新的在前）
  items.sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    if (timeA !== timeB) {
      return timeB - timeA;
    }
    return a.id.localeCompare(b.id);
  });

  // 限制总数不超过 limit
  const finalItems = items.slice(0, limit);
  // 使用最后一个 public 条目作为 cursor（保持分页一致性）
  const last = rows.length > 0 ? rows.at(-1) : null;

  return json({
    items: finalItems,
    nextCursor: last ? encodeUnburntCursor(last.created_at, last.id) : null,
  });
}

export async function handleCreateUnburnt(
  request: Request,
  env: Env,
  auth: UnburntAuthContext
): Promise<Response> {
  const payload = await readJsonObject(request);

  const title = normalizeUnburntTitle(payload.title, true);
  const summary = payload.summary === undefined ? "" : normalizeUnburntSummary(payload.summary);
  const rawText = normalizeUnburntRawText(payload.rawText, true);
  const messages = normalizeUnburntMessages(payload.messages, true);
  const tags = payload.tags === undefined ? [] : normalizeUnburntTags(payload.tags);
  const visibility =
    payload.visibility === undefined
      ? UNBURNT_VISIBILITY_PRIVATE
      : normalizeUnburntVisibility(payload.visibility);

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await env.DB.prepare(
    `
    INSERT INTO unburnt_entries (
      id,
      anon_user_id,
      title,
      summary,
      raw_text,
      messages_json,
      visibility,
      tags_json,
      created_at,
      updated_at,
      deleted_at
    )
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, NULL)
    `
  )
    .bind(
      id,
      auth.anonUserId,
      title,
      summary,
      rawText,
      JSON.stringify(messages),
      visibility,
      JSON.stringify(tags),
      now,
      now
    )
    .run();

  const item: UnburntEntryDetailItem = {
    id,
    title,
    summary,
    rawText,
    messages,
    visibility,
    tags,
    messageCount: messages.length,
    createdAt: now,
    updatedAt: now,
    isMine: true,
  };

  return json({ item }, 201);
}

export async function handleGetUnburntMine(
  env: Env,
  auth: UnburntAuthContext,
  unburntId: string
): Promise<Response> {
  const row = await getMineEntryRow(env, auth.anonUserId, unburntId);
  return json({ item: toUnburntDetailItem(row, true) });
}

export async function handleGetUnburntPublic(env: Env, unburntId: string): Promise<Response> {
  const row = await env.DB.prepare(
    `
    SELECT id, anon_user_id, title, summary, raw_text, messages_json, visibility, tags_json, created_at, updated_at, deleted_at
    FROM unburnt_entries
    WHERE id = ?1
      AND deleted_at IS NULL
      AND visibility = ?2
    LIMIT 1
    `
  )
    .bind(unburntId, UNBURNT_VISIBILITY_PUBLIC)
    .first<UnburntEntryRow>();

  if (!row) {
    throw new HttpError(404, ErrorCodes.UnburntNotFound, "Unburnt entry not found.");
  }

  return json({ item: toUnburntDetailItem(row, false) });
}

export async function handleUpdateUnburnt(
  request: Request,
  env: Env,
  auth: UnburntAuthContext,
  unburntId: string
): Promise<Response> {
  const payload = await readJsonObject(request);

  const hasTitle = Object.hasOwn(payload, "title");
  const hasSummary = Object.hasOwn(payload, "summary");
  const hasRawText = Object.hasOwn(payload, "rawText");
  const hasMessages = Object.hasOwn(payload, "messages");
  const hasVisibility = Object.hasOwn(payload, "visibility");
  const hasTags = Object.hasOwn(payload, "tags");

  if (!hasTitle && !hasSummary && !hasRawText && !hasMessages && !hasVisibility && !hasTags) {
    throw new HttpError(
      400,
      ErrorCodes.UnburntEmptyUpdate,
      "Provide at least one updatable field: title, summary, rawText, messages, visibility, tags."
    );
  }

  const row = await getMineEntryRow(env, auth.anonUserId, unburntId);

  const nextTitle = hasTitle ? normalizeUnburntTitle(payload.title, true) : row.title;
  const nextSummary = hasSummary ? normalizeUnburntSummary(payload.summary) : row.summary;
  const nextRawText = hasRawText ? normalizeUnburntRawText(payload.rawText, true) : row.raw_text;
  const nextMessages = hasMessages
    ? normalizeUnburntMessages(payload.messages, true)
    : parseStoredMessages(row.messages_json);
  const nextVisibility = hasVisibility
    ? normalizeUnburntVisibility(payload.visibility)
    : toVisibility(row.visibility);
  const nextTags = hasTags ? normalizeUnburntTags(payload.tags) : parseStoredTags(row.tags_json);

  const updatedAt = new Date().toISOString();

  await env.DB.prepare(
    `
    UPDATE unburnt_entries
    SET title = ?1,
        summary = ?2,
        raw_text = ?3,
        messages_json = ?4,
        visibility = ?5,
        tags_json = ?6,
        updated_at = ?7
    WHERE id = ?8
      AND anon_user_id = ?9
      AND deleted_at IS NULL
    `
  )
    .bind(
      nextTitle,
      nextSummary,
      nextRawText,
      JSON.stringify(nextMessages),
      nextVisibility,
      JSON.stringify(nextTags),
      updatedAt,
      unburntId,
      auth.anonUserId
    )
    .run();

  const item: UnburntEntryDetailItem = {
    id: row.id,
    title: nextTitle,
    summary: nextSummary,
    rawText: nextRawText,
    messages: nextMessages,
    visibility: nextVisibility,
    tags: nextTags,
    messageCount: nextMessages.length,
    createdAt: row.created_at,
    updatedAt,
    isMine: true,
  };

  return json({ item });
}

export async function handleDeleteUnburnt(
  env: Env,
  auth: UnburntAuthContext,
  unburntId: string
): Promise<Response> {
  await getMineEntryRow(env, auth.anonUserId, unburntId);

  const now = new Date().toISOString();
  await env.DB.prepare(
    `
    UPDATE unburnt_entries
    SET deleted_at = ?1,
        updated_at = ?1
    WHERE id = ?2
      AND anon_user_id = ?3
      AND deleted_at IS NULL
    `
  )
    .bind(now, unburntId, auth.anonUserId)
    .run();

  return new Response(null, { status: 204 });
}

export async function handleUpdateUnburntVisibility(
  request: Request,
  env: Env,
  auth: UnburntAuthContext,
  unburntId: string
): Promise<Response> {
  const payload = await readJsonObject(request);
  const visibility = normalizeUnburntVisibility(payload.visibility);

  const row = await getMineEntryRow(env, auth.anonUserId, unburntId);
  const updatedAt = new Date().toISOString();

  await env.DB.prepare(
    `
    UPDATE unburnt_entries
    SET visibility = ?1,
        updated_at = ?2
    WHERE id = ?3
      AND anon_user_id = ?4
      AND deleted_at IS NULL
    `
  )
    .bind(visibility, updatedAt, unburntId, auth.anonUserId)
    .run();

  return json({
    item: {
      ...toUnburntDetailItem(row, true),
      visibility,
      updatedAt,
    } satisfies UnburntEntryDetailItem,
  });
}

export async function handleGetUnburntDraft(
  env: Env,
  auth: UnburntAuthContext
): Promise<Response> {
  const row = await env.DB.prepare(
    `
    SELECT anon_user_id, payload_json, created_at, updated_at
    FROM unburnt_drafts
    WHERE anon_user_id = ?1
    LIMIT 1
    `
  )
    .bind(auth.anonUserId)
    .first<{ anon_user_id: string; payload_json: string; created_at: string; updated_at: string }>();

  if (!row) {
    return json({
      anonUserId: auth.anonUserId,
      draft: emptyDraftPayload(),
    });
  }

  const draft = parseStoredDraft(row.payload_json);

  return json({
    anonUserId: auth.anonUserId,
    draft,
  });
}

export async function handleUpdateUnburntDraft(
  request: Request,
  env: Env,
  auth: UnburntAuthContext
): Promise<Response> {
  const payload = await readJsonObject(request);
  const draft = normalizeUnburntDraftPayload(payload);

  const now = new Date().toISOString();

  await env.DB.prepare(
    `
    INSERT INTO unburnt_drafts (anon_user_id, payload_json, created_at, updated_at)
    VALUES (?1, ?2, ?3, ?4)
    ON CONFLICT(anon_user_id) DO UPDATE SET
      payload_json = excluded.payload_json,
      updated_at = excluded.updated_at
    `
  )
    .bind(auth.anonUserId, JSON.stringify(draft), now, now)
    .run();

  return json({
    anonUserId: auth.anonUserId,
    draft,
  });
}

export async function handleDeleteUnburntDraft(
  env: Env,
  auth: UnburntAuthContext
): Promise<Response> {
  await env.DB.prepare(
    `
    DELETE FROM unburnt_drafts
    WHERE anon_user_id = ?1
    `
  )
    .bind(auth.anonUserId)
    .run();

  return new Response(null, { status: 204 });
}

async function getMineEntryRow(
  env: Env,
  anonUserId: string,
  unburntId: string
): Promise<UnburntEntryRow> {
  const row = await env.DB.prepare(
    `
    SELECT id, anon_user_id, title, summary, raw_text, messages_json, visibility, tags_json, created_at, updated_at, deleted_at
    FROM unburnt_entries
    WHERE id = ?1
      AND anon_user_id = ?2
      AND deleted_at IS NULL
    LIMIT 1
    `
  )
    .bind(unburntId, anonUserId)
    .first<UnburntEntryRow>();

  if (!row) {
    throw new HttpError(404, ErrorCodes.UnburntNotFound, "Unburnt entry not found.");
  }

  return row;
}

function buildMineListQuery(
  anonUserId: string,
  visibilityFilter: UnburntListVisibility,
  limit: number,
  cursor: { timestamp: string; id: string } | null
): { query: string; binds: unknown[] } {
  let query = `
    SELECT id, anon_user_id, title, summary, raw_text, messages_json, visibility, tags_json, created_at, updated_at, deleted_at
    FROM unburnt_entries
    WHERE anon_user_id = ?
      AND deleted_at IS NULL
  `;

  const binds: unknown[] = [anonUserId];

  if (visibilityFilter !== "all") {
    query += "\n      AND visibility = ?";
    binds.push(visibilityFilter);
  }

  if (cursor) {
    query += "\n      AND ((created_at < ?) OR (created_at = ? AND id < ?))";
    binds.push(cursor.timestamp, cursor.timestamp, cursor.id);
  }

  query += "\n    ORDER BY created_at DESC, id DESC\n    LIMIT ?";
  binds.push(limit);

  return { query, binds };
}

function buildPublicListQuery(
  limit: number,
  cursor: { timestamp: string; id: string } | null
): { query: string; binds: unknown[] } {
  let query = `
    SELECT id, anon_user_id, title, summary, raw_text, messages_json, visibility, tags_json, created_at, updated_at, deleted_at
    FROM unburnt_entries
    WHERE deleted_at IS NULL
      AND visibility = ?
  `;

  const binds: unknown[] = [UNBURNT_VISIBILITY_PUBLIC];

  if (cursor) {
    query += "\n      AND ((created_at < ?) OR (created_at = ? AND id < ?))";
    binds.push(cursor.timestamp, cursor.timestamp, cursor.id);
  }

  query += "\n    ORDER BY created_at DESC, id DESC\n    LIMIT ?";
  binds.push(limit);

  return { query, binds };
}

function toUnburntListItem(row: UnburntEntryRow): UnburntEntryListItem {
  const messages = parseStoredMessages(row.messages_json);
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    visibility: toVisibility(row.visibility),
    tags: parseStoredTags(row.tags_json),
    messageCount: messages.length,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toUnburntDetailItem(row: UnburntEntryRow, isMine: boolean): UnburntEntryDetailItem {
  const messages = parseStoredMessages(row.messages_json);
  return {
    ...toUnburntListItem(row),
    rawText: row.raw_text,
    messages,
    isMine,
  };
}

function parseStoredMessages(raw: string): UnburntMessage[] {
  try {
    const payload = JSON.parse(raw);
    if (!Array.isArray(payload)) {
      return [];
    }

    const output: UnburntMessage[] = [];
    for (const candidate of payload) {
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
        continue;
      }

      const role = (candidate as Record<string, unknown>).role;
      const content = (candidate as Record<string, unknown>).content;
      const order = (candidate as Record<string, unknown>).order;

      if ((role !== "user" && role !== "4o") || typeof content !== "string") {
        continue;
      }

      output.push({
        role,
        content: content.trim(),
        order: Number.isInteger(order) && (order as number) > 0 ? (order as number) : output.length + 1,
      });
    }

    return output
      .sort((left, right) => left.order - right.order)
      .map((item, index) => ({ ...item, order: index + 1 }));
  } catch {
    return [];
  }
}

function parseStoredTags(raw: string): string[] {
  try {
    const payload = JSON.parse(raw);
    if (!Array.isArray(payload)) {
      return [];
    }

    return payload
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 50);
  } catch {
    return [];
  }
}

function parseStoredDraft(raw: string): UnburntDraftPayload {
  try {
    return normalizeUnburntDraftPayload(JSON.parse(raw));
  } catch {
    return emptyDraftPayload();
  }
}

function emptyDraftPayload(): UnburntDraftPayload {
  return {
    mode: "create",
    entryId: "",
    stage: "structure",
    rawText: "",
    lines: [],
    boundaries: [],
    messages: [],
    fragmentMeta: {
      title: "",
      summary: "",
      tags: [],
      visibility: UNBURNT_VISIBILITY_PRIVATE,
    },
  };
}

function toVisibility(value: string): UnburntVisibility {
  return value === UNBURNT_VISIBILITY_PUBLIC ? UNBURNT_VISIBILITY_PUBLIC : UNBURNT_VISIBILITY_PRIVATE;
}
