import { Env } from "../../types";
import { HttpError } from "../../shared/errors";
import { json, readJsonObject } from "../../shared/http";
import {
  clearTraceDraftCookie,
  clearTraceNameCookie,
  parseDraftCookie,
  setTraceDraftCookie,
  setTraceNameCookie,
} from "./cookies";
import { DEFAULT_TRACE_NAME, DEFAULT_TRACE_QUERY_LIMIT, TRACE_DRAFT_COOKIE } from "./constants";
import { encodeTraceCursor, parseTraceCursor } from "./cursor";
import { TraceItem, TraceRow } from "./types";
import {
  getStoredTraceName,
  normalizeQueryLimit,
  normalizeTraceMessage,
  normalizeTraceName,
} from "./validation";

interface TraceAuthContext {
  anonUserId: string;
  cookies: Record<string, string>;
  setCookies: string[];
  url: URL;
}

export async function handleListTraces(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit") ?? DEFAULT_TRACE_QUERY_LIMIT);
  const limit = normalizeQueryLimit(requestedLimit);
  const cursor = parseTraceCursor(url.searchParams.get("cursor"));

  let query: D1PreparedStatement;
  if (cursor) {
    query = env.DB.prepare(
      `
      SELECT id, display_name, message, created_at
      FROM traces
      WHERE (created_at < ?1) OR (created_at = ?1 AND id < ?2)
      ORDER BY created_at DESC, id DESC
      LIMIT ?3
      `
    ).bind(cursor.createdAt, cursor.id, limit);
  } else {
    query = env.DB.prepare(
      `
      SELECT id, display_name, message, created_at
      FROM traces
      ORDER BY created_at DESC, id DESC
      LIMIT ?1
      `
    ).bind(limit);
  }

  const result = await query.all<TraceRow>();
  const rows = result.results ?? [];
  const items = rows.map(toTraceItem);
  const last = rows.at(-1);

  return json({
    items,
    nextCursor: last ? encodeTraceCursor(last.created_at, last.id) : null,
  });
}

export async function handleCreateTrace(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  auth: TraceAuthContext
): Promise<Response> {
  const payload = await readJsonObject(request);
  const hasDisplayName = Object.hasOwn(payload, "displayName");

  const submittedName = hasDisplayName ? normalizeTraceName(payload.displayName) : "";
  const fallbackName = getStoredTraceName(auth.cookies) || DEFAULT_TRACE_NAME;
  const displayName = submittedName || fallbackName;
  const message = normalizeTraceMessage(payload.message, true);

  const trace: TraceItem = {
    id: crypto.randomUUID(),
    displayName,
    message,
    createdAt: new Date().toISOString(),
  };

  await env.DB.prepare(
    `
    INSERT INTO traces (id, anon_user_id, display_name, message, created_at)
    VALUES (?1, ?2, ?3, ?4, ?5)
    `
  )
    .bind(trace.id, auth.anonUserId, trace.displayName, trace.message, trace.createdAt)
    .run();

  if (submittedName) {
    setTraceNameCookie(auth.setCookies, submittedName, auth.url);
  }

  clearTraceDraftCookie(auth.setCookies, auth.url);
  ctx.waitUntil(archiveTrace(env, trace, auth.anonUserId));

  return json({ item: trace }, 201);
}

export function handleGetTraceSession(auth: TraceAuthContext): Response {
  const draft = parseDraftCookie(auth.cookies[TRACE_DRAFT_COOKIE]);
  const storedName = getStoredTraceName(auth.cookies);

  return json({
    anonUserId: auth.anonUserId,
    draft: {
      displayName: storedName || draft?.displayName || "",
      message: draft?.message ?? "",
    },
  });
}

export async function handleUpdateTraceSession(
  request: Request,
  auth: TraceAuthContext
): Promise<Response> {
  const payload = await readJsonObject(request);
  const hasDisplayName = Object.hasOwn(payload, "displayName");
  const hasMessage = Object.hasOwn(payload, "message");

  if (!hasDisplayName && !hasMessage) {
    throw new HttpError(400, "displayName 或 message 至少提供一个字段。");
  }

  const currentDraft = parseDraftCookie(auth.cookies[TRACE_DRAFT_COOKIE]);
  const currentDisplayName = getStoredTraceName(auth.cookies) || currentDraft?.displayName || "";
  const currentMessage = currentDraft?.message ?? "";

  const nextDisplayName = hasDisplayName
    ? normalizeTraceName(payload.displayName)
    : currentDisplayName;
  const nextMessage = hasMessage
    ? normalizeTraceMessage(payload.message, false)
    : currentMessage;

  if (hasDisplayName) {
    if (nextDisplayName) {
      setTraceNameCookie(auth.setCookies, nextDisplayName, auth.url);
    } else {
      clearTraceNameCookie(auth.setCookies, auth.url);
    }
  }

  if (nextDisplayName || nextMessage) {
    setTraceDraftCookie(
      auth.setCookies,
      {
        displayName: nextDisplayName,
        message: nextMessage,
      },
      auth.url
    );
  } else {
    clearTraceDraftCookie(auth.setCookies, auth.url);
  }

  return json({
    anonUserId: auth.anonUserId,
    draft: {
      displayName: nextDisplayName,
      message: nextMessage,
    },
  });
}

function toTraceItem(row: TraceRow): TraceItem {
  return {
    id: row.id,
    displayName: row.display_name,
    message: row.message,
    createdAt: row.created_at,
  };
}

async function archiveTrace(env: Env, trace: TraceItem, anonUserId: string): Promise<void> {
  if (!env.TRACE_ARCHIVE) {
    return;
  }

  const dayKey = trace.createdAt.slice(0, 10);
  const key = `traces/${dayKey}/${trace.id}.json`;
  const payload = JSON.stringify({
    ...trace,
    anonUserId,
    archivedAt: new Date().toISOString(),
  });

  await env.TRACE_ARCHIVE.put(key, payload, {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
  });
}
