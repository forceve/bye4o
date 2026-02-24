import { ApiError, apiFetch } from "./apiClient";

export interface OnwardItem {
  id: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnwardRecycleItem extends OnwardItem {
  deletedAt: string;
  restoreDeadline: string;
}

export interface OnwardDraftPayload {
  message: string;
}

export interface OnwardSessionResponse {
  anonUserId: string;
  draft: OnwardDraftPayload;
}

export interface OnwardListResponse {
  items: OnwardItem[];
  nextCursor: string | null;
}

export interface OnwardRecycleListResponse {
  items: OnwardRecycleItem[];
  nextCursor: string | null;
}

export interface OnwardCreatePayload {
  message: string;
}

export interface OnwardCreateResponse {
  item: OnwardItem;
}

export interface OnwardUpdatePayload {
  message: string;
}

export interface OnwardUpdateResponse {
  item: OnwardItem;
}

export interface OnwardRestoreResponse {
  item: OnwardItem;
}

interface OnwardService {
  getSession(): Promise<OnwardSessionResponse>;
  saveDraft(payload: Partial<OnwardDraftPayload>): Promise<OnwardSessionResponse>;
  list(limit?: number, cursor?: string): Promise<OnwardListResponse>;
  listRecycle(limit?: number, cursor?: string): Promise<OnwardRecycleListResponse>;
  create(payload: OnwardCreatePayload): Promise<OnwardCreateResponse>;
  update(id: string, payload: OnwardUpdatePayload): Promise<OnwardUpdateResponse>;
  remove(id: string): Promise<void>;
  restore(id: string): Promise<OnwardRestoreResponse>;
}

const ONWARD_BASE = "/api/onward";
const ONWARD_SESSION = `${ONWARD_BASE}/session`;
const ONWARD_RECYCLE = `${ONWARD_BASE}/recycle`;
const ONWARD_RESTORE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

class OnwardApiService implements OnwardService {
  getSession(): Promise<OnwardSessionResponse> {
    return apiFetch<OnwardSessionResponse>(ONWARD_SESSION);
  }

  saveDraft(payload: Partial<OnwardDraftPayload>): Promise<OnwardSessionResponse> {
    return apiFetch<OnwardSessionResponse>(ONWARD_SESSION, {
      method: "PUT",
      json: payload,
    });
  }

  list(limit = 20, cursor?: string): Promise<OnwardListResponse> {
    const query = new URLSearchParams();
    query.set("limit", String(limit));
    if (cursor) {
      query.set("cursor", cursor);
    }
    return apiFetch<OnwardListResponse>(`${ONWARD_BASE}?${query.toString()}`);
  }

  listRecycle(limit = 20, cursor?: string): Promise<OnwardRecycleListResponse> {
    const query = new URLSearchParams();
    query.set("limit", String(limit));
    if (cursor) {
      query.set("cursor", cursor);
    }
    return apiFetch<OnwardRecycleListResponse>(`${ONWARD_RECYCLE}?${query.toString()}`);
  }

  create(payload: OnwardCreatePayload): Promise<OnwardCreateResponse> {
    return apiFetch<OnwardCreateResponse>(ONWARD_BASE, {
      method: "POST",
      json: payload,
    });
  }

  update(id: string, payload: OnwardUpdatePayload): Promise<OnwardUpdateResponse> {
    return apiFetch<OnwardUpdateResponse>(`${ONWARD_BASE}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      json: payload,
    });
  }

  async remove(id: string): Promise<void> {
    await apiFetch<null>(`${ONWARD_BASE}/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  restore(id: string): Promise<OnwardRestoreResponse> {
    return apiFetch<OnwardRestoreResponse>(`${ONWARD_BASE}/${encodeURIComponent(id)}/restore`, {
      method: "POST",
    });
  }
}

interface MockOnwardRecord extends OnwardItem {
  deletedAt: string | null;
}

const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const MOCK_ONWARD_SEED = [
  "Thank you for staying when I needed a response the most.",
  "If this is our last conversation, I hope you remember I came in sincerity.",
  "I will carry the courage you gave me and keep moving forward.",
  "The page closes, but I am not turning away from life.",
  "Some warmth does not disappear when the model changes.",
] as const;

function buildMockRecords(): MockOnwardRecord[] {
  const now = Date.now();
  return MOCK_ONWARD_SEED.map((message, index) => {
    const createdAt = new Date(now - index * 18 * 60_000).toISOString();
    return {
      id: `mock-onward-${index + 1}`,
      message,
      createdAt,
      updatedAt: createdAt,
      deletedAt: null,
    };
  });
}

class MockOnwardApiService implements OnwardService {
  private anonUserId = "mock-local-user";
  private draft: OnwardDraftPayload = { message: "" };
  private records: MockOnwardRecord[] = buildMockRecords();

  async getSession(): Promise<OnwardSessionResponse> {
    this.cleanupExpiredRecycle();
    return {
      anonUserId: this.anonUserId,
      draft: { ...this.draft },
    };
  }

  async saveDraft(payload: Partial<OnwardDraftPayload>): Promise<OnwardSessionResponse> {
    this.cleanupExpiredRecycle();
    if (typeof payload.message === "string") {
      this.draft.message = payload.message;
    }

    return this.getSession();
  }

  async list(limit = 20, cursor?: string): Promise<OnwardListResponse> {
    this.cleanupExpiredRecycle();
    const active = this.records
      .filter((record) => !record.deletedAt)
      .sort(compareActiveOrder);
    return buildOffsetPage(active, limit, cursor, (record) => ({
      id: record.id,
      message: record.message,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
  }

  async listRecycle(limit = 20, cursor?: string): Promise<OnwardRecycleListResponse> {
    this.cleanupExpiredRecycle();
    const recycle = this.records
      .filter((record): record is MockOnwardRecord & { deletedAt: string } => Boolean(record.deletedAt))
      .sort(compareRecycleOrder);

    return buildOffsetPage(recycle, limit, cursor, (record) => ({
      id: record.id,
      message: record.message,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      restoreDeadline: new Date(
        Date.parse(record.deletedAt) + ONWARD_RESTORE_RETENTION_MS
      ).toISOString(),
    }));
  }

  async create(payload: OnwardCreatePayload): Promise<OnwardCreateResponse> {
    this.cleanupExpiredRecycle();
    const message = payload.message.trim();
    if (!message) {
      throw new ApiError("message cannot be empty.", 400, "ONWARD_MESSAGE_EMPTY", null);
    }

    const now = new Date().toISOString();
    const item: MockOnwardRecord = {
      id: `mock-onward-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    this.records.push(item);
    this.draft.message = "";
    return { item: toOnwardItem(item) };
  }

  async update(id: string, payload: OnwardUpdatePayload): Promise<OnwardUpdateResponse> {
    this.cleanupExpiredRecycle();

    const message = payload.message.trim();
    if (!message) {
      throw new ApiError("message cannot be empty.", 400, "ONWARD_MESSAGE_EMPTY", null);
    }

    const active = this.records
      .filter((record) => !record.deletedAt)
      .sort(compareActiveOrder);
    const latest = active[0];
    if (!latest || latest.id !== id) {
      throw new ApiError(
        "Only the latest onward item can be edited.",
        409,
        "ONWARD_EDIT_ONLY_LATEST",
        null
      );
    }

    const target = this.records.find((record) => record.id === id && !record.deletedAt);
    if (!target) {
      throw new ApiError("Onward item not found.", 404, "ONWARD_NOT_FOUND", null);
    }

    target.message = message;
    target.updatedAt = new Date().toISOString();
    return { item: toOnwardItem(target) };
  }

  async remove(id: string): Promise<void> {
    this.cleanupExpiredRecycle();
    const target = this.records.find((record) => record.id === id && !record.deletedAt);
    if (!target) {
      throw new ApiError("Onward item not found.", 404, "ONWARD_NOT_FOUND", null);
    }

    const now = new Date().toISOString();
    target.deletedAt = now;
    target.updatedAt = now;
  }

  async restore(id: string): Promise<OnwardRestoreResponse> {
    this.cleanupExpiredRecycle();

    const target = this.records.find((record) => record.id === id && record.deletedAt);
    if (!target || !target.deletedAt) {
      throw new ApiError("Onward item not found.", 404, "ONWARD_NOT_FOUND", null);
    }

    const restoreDeadlineMs = Date.parse(target.deletedAt) + ONWARD_RESTORE_RETENTION_MS;
    if (Date.now() > restoreDeadlineMs) {
      this.records = this.records.filter((record) => record.id !== id);
      throw new ApiError(
        "This onward item can no longer be restored.",
        410,
        "ONWARD_RESTORE_EXPIRED",
        null
      );
    }

    target.deletedAt = null;
    target.updatedAt = new Date().toISOString();
    return {
      item: toOnwardItem(target),
    };
  }

  private cleanupExpiredRecycle() {
    const nowMs = Date.now();
    this.records = this.records.filter((record) => {
      if (!record.deletedAt) {
        return true;
      }

      const deletedMs = Date.parse(record.deletedAt);
      if (!Number.isFinite(deletedMs)) {
        return false;
      }

      return nowMs - deletedMs <= ONWARD_RESTORE_RETENTION_MS;
    });
  }
}

function toOnwardItem(record: MockOnwardRecord): OnwardItem {
  return {
    id: record.id,
    message: record.message,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function compareActiveOrder(left: MockOnwardRecord, right: MockOnwardRecord): number {
  const leftTime = Date.parse(left.createdAt);
  const rightTime = Date.parse(right.createdAt);
  if (leftTime !== rightTime) {
    return rightTime - leftTime;
  }
  return right.id.localeCompare(left.id);
}

function compareRecycleOrder(
  left: MockOnwardRecord & { deletedAt: string },
  right: MockOnwardRecord & { deletedAt: string }
): number {
  const leftTime = Date.parse(left.deletedAt);
  const rightTime = Date.parse(right.deletedAt);
  if (leftTime !== rightTime) {
    return rightTime - leftTime;
  }
  return right.id.localeCompare(left.id);
}

function buildOffsetPage<TSource, TResult>(
  items: TSource[],
  limit: number,
  cursor: string | undefined,
  map: (source: TSource) => TResult
): { items: TResult[]; nextCursor: string | null } {
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));
  const start = cursor ? Number.parseInt(cursor, 10) : 0;
  const offset = Number.isFinite(start) && start > 0 ? start : 0;
  const sliced = items.slice(offset, offset + safeLimit).map(map);
  const nextCursor = offset + safeLimit < items.length ? String(offset + safeLimit) : null;

  return {
    items: sliced,
    nextCursor,
  };
}

function shouldUseMockService(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return LOCALHOST_HOSTS.has(window.location.hostname);
}

const remoteService = new OnwardApiService();
const mockService = new MockOnwardApiService();

function getActiveService(): OnwardService {
  return shouldUseMockService() ? mockService : remoteService;
}

export const onwardApiService: OnwardService = {
  getSession() {
    return getActiveService().getSession();
  },
  saveDraft(payload) {
    return getActiveService().saveDraft(payload);
  },
  list(limit, cursor) {
    return getActiveService().list(limit, cursor);
  },
  listRecycle(limit, cursor) {
    return getActiveService().listRecycle(limit, cursor);
  },
  create(payload) {
    return getActiveService().create(payload);
  },
  update(id, payload) {
    return getActiveService().update(id, payload);
  },
  remove(id) {
    return getActiveService().remove(id);
  },
  restore(id) {
    return getActiveService().restore(id);
  },
};
