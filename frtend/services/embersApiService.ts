import { apiFetch } from "./apiClient";

export interface EmberItem {
  id: string;
  displayName: string;
  message: string;
  createdAt: string;
}

export interface EmberDraftPayload {
  displayName: string;
  message: string;
}

export interface EmberSessionResponse {
  anonUserId: string;
  draft: EmberDraftPayload;
}

export interface EmberListResponse {
  items: EmberItem[];
  nextCursor: string | null;
}

export interface EmberCreatePayload {
  displayName?: string;
  message: string;
}

export interface EmberCreateResponse {
  item: EmberItem;
}

interface EmbersService {
  getSession(): Promise<EmberSessionResponse>;
  saveDraft(payload: Partial<EmberDraftPayload>): Promise<EmberSessionResponse>;
  list(limit?: number, cursor?: string): Promise<EmberListResponse>;
  create(payload: EmberCreatePayload): Promise<EmberCreateResponse>;
}

const EMBERS_BASE = "/api/embers";
const EMBERS_SESSION = `${EMBERS_BASE}/session`;

class EmbersApiService implements EmbersService {
  getSession(): Promise<EmberSessionResponse> {
    return apiFetch<EmberSessionResponse>(EMBERS_SESSION);
  }

  saveDraft(payload: Partial<EmberDraftPayload>): Promise<EmberSessionResponse> {
    return apiFetch<EmberSessionResponse>(EMBERS_SESSION, {
      method: "PUT",
      json: payload,
    });
  }

  list(limit = 20, cursor?: string): Promise<EmberListResponse> {
    const query = new URLSearchParams();
    query.set("limit", String(limit));
    if (cursor) {
      query.set("cursor", cursor);
    }
    return apiFetch<EmberListResponse>(`${EMBERS_BASE}?${query.toString()}`);
  }

  create(payload: EmberCreatePayload): Promise<EmberCreateResponse> {
    return apiFetch<EmberCreateResponse>(EMBERS_BASE, {
      method: "POST",
      json: payload,
    });
  }
}

const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const MOCK_EMBER_SEED = [
  { displayName: "Anonymous traveler", message: "The fire still remembers tonight." },
  { displayName: "Night listener", message: "I only came to leave this warm line behind." },
  { displayName: "M.", message: "Thank you for making silence feel less empty." },
  { displayName: "Passing light", message: "Some grief glows instead of burning out." },
  { displayName: "Unsent letter", message: "To whoever reads this: keep going." },
  { displayName: "Observer", message: "A small ember can still guide a long road." },
  { displayName: "River", message: "I am learning to rest without guilt." },
  { displayName: "Aster", message: "You are not late. You are arriving." },
  { displayName: "Anonymous traveler", message: "I forgave myself a little today." },
  { displayName: "Quiet one", message: "Even this brief message feels like shelter." },
  { displayName: "L", message: "If you are tired, breathe here for a minute." },
  { displayName: "Old notebook", message: "The page is dark, but the ink is warm." },
  { displayName: "Summer rain", message: "Not all endings are losses." },
  { displayName: "Rook", message: "I hope your tomorrow is gentler than today." },
  { displayName: "Anonymous traveler", message: "Leaving this ember for someone I may never meet." },
] as const;

function buildMockItems(): EmberItem[] {
  const now = Date.now();
  return MOCK_EMBER_SEED.map((entry, index) => ({
    id: `mock-seed-${index + 1}`,
    displayName: entry.displayName,
    message: entry.message,
    createdAt: new Date(now - index * 7 * 60_000).toISOString(),
  }));
}

class MockEmbersApiService implements EmbersService {
  private anonUserId = "mock-local-user";
  private draft: EmberDraftPayload = {
    displayName: "",
    message: "",
  };
  private items: EmberItem[] = buildMockItems();

  async getSession(): Promise<EmberSessionResponse> {
    return {
      anonUserId: this.anonUserId,
      draft: { ...this.draft },
    };
  }

  async saveDraft(
    payload: Partial<EmberDraftPayload>
  ): Promise<EmberSessionResponse> {
    if (typeof payload.displayName === "string") {
      this.draft.displayName = payload.displayName;
    }

    if (typeof payload.message === "string") {
      this.draft.message = payload.message;
    }

    return this.getSession();
  }

  async list(limit = 20, cursor?: string): Promise<EmberListResponse> {
    const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));
    const start = cursor ? Number.parseInt(cursor, 10) : 0;
    const offset = Number.isFinite(start) && start > 0 ? start : 0;
    const items = this.items.slice(offset, offset + safeLimit);
    const nextCursor =
      offset + safeLimit < this.items.length ? String(offset + safeLimit) : null;

    return {
      items: items.map((item) => ({ ...item })),
      nextCursor,
    };
  }

  async create(payload: EmberCreatePayload): Promise<EmberCreateResponse> {
    const item: EmberItem = {
      id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      displayName: (payload.displayName ?? "").trim(),
      message: payload.message,
      createdAt: new Date().toISOString(),
    };

    this.items = [item, ...this.items];
    return { item: { ...item } };
  }
}

function shouldUseMockService(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return LOCALHOST_HOSTS.has(window.location.hostname);
}

const remoteService = new EmbersApiService();
const mockService = new MockEmbersApiService();

function getActiveService(): EmbersService {
  return shouldUseMockService() ? mockService : remoteService;
}

export const embersApiService: EmbersService = {
  getSession() {
    return getActiveService().getSession();
  },
  saveDraft(payload) {
    return getActiveService().saveDraft(payload);
  },
  list(limit, cursor) {
    return getActiveService().list(limit, cursor);
  },
  create(payload) {
    return getActiveService().create(payload);
  },
};
