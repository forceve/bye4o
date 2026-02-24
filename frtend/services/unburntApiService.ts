import { ApiError, apiFetch } from "./apiClient";

export type UnburntRole = "user" | "4o";

export type UnburntVisibility = "private" | "public";

export type UnburntMineVisibility = "all" | UnburntVisibility;

export interface UnburntMessage {
  role: UnburntRole;
  content: string;
  order: number;
}

export interface UnburntEntryListItem {
  id: string;
  title: string;
  summary: string;
  visibility: UnburntVisibility;
  tags: string[];
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UnburntEntryDetail extends UnburntEntryListItem {
  rawText: string;
  messages: UnburntMessage[];
  isMine: boolean;
}

export interface UnburntListResponse {
  items: UnburntEntryListItem[];
  nextCursor: string | null;
}

export interface UnburntDetailResponse {
  item: UnburntEntryDetail;
}

export interface UnburntCreatePayload {
  title: string;
  summary?: string;
  rawText: string;
  messages: UnburntMessage[];
  tags?: string[];
  visibility?: UnburntVisibility;
}

export interface UnburntUpdatePayload {
  title?: string;
  summary?: string;
  rawText?: string;
  messages?: UnburntMessage[];
  tags?: string[];
  visibility?: UnburntVisibility;
}

export interface UnburntVisibilityPayload {
  visibility: UnburntVisibility;
}

export type UnburntDraftMode = "create" | "edit";

export type UnburntDraftStage = "structure" | "meta";

export interface UnburntDraftFragmentMeta {
  title: string;
  summary: string;
  tags: string[];
  visibility: UnburntVisibility;
}

export interface UnburntDraftPayload {
  mode: UnburntDraftMode;
  entryId: string;
  stage: UnburntDraftStage;
  rawText: string;
  lines: string[];
  boundaries: number[];
  messages: UnburntMessage[];
  fragmentMeta: UnburntDraftFragmentMeta;
}

export interface UnburntDraftResponse {
  anonUserId: string;
  draft: UnburntDraftPayload;
}

interface UnburntService {
  listMine(visibility?: UnburntMineVisibility, limit?: number, cursor?: string): Promise<UnburntListResponse>;
  listPublic(limit?: number, cursor?: string): Promise<UnburntListResponse>;
  getMine(id: string): Promise<UnburntDetailResponse>;
  getPublic(id: string): Promise<UnburntDetailResponse>;
  create(payload: UnburntCreatePayload): Promise<UnburntDetailResponse>;
  update(id: string, payload: UnburntUpdatePayload): Promise<UnburntDetailResponse>;
  remove(id: string): Promise<void>;
  updateVisibility(id: string, payload: UnburntVisibilityPayload): Promise<UnburntDetailResponse>;
  getDraft(): Promise<UnburntDraftResponse>;
  saveDraft(payload: UnburntDraftPayload): Promise<UnburntDraftResponse>;
  clearDraft(): Promise<void>;
}

const UNBURNT_BASE = "/api/unburnt";
const UNBURNT_PUBLIC = `${UNBURNT_BASE}/public`;
const UNBURNT_DRAFT = `${UNBURNT_BASE}/draft`;

class UnburntApiService implements UnburntService {
  listMine(visibility: UnburntMineVisibility = "all", limit = 20, cursor?: string): Promise<UnburntListResponse> {
    const query = new URLSearchParams();
    query.set("scope", "mine");
    query.set("visibility", visibility);
    query.set("limit", String(limit));
    if (cursor) {
      query.set("cursor", cursor);
    }

    return apiFetch<UnburntListResponse>(`${UNBURNT_BASE}?${query.toString()}`);
  }

  listPublic(limit = 20, cursor?: string): Promise<UnburntListResponse> {
    const query = new URLSearchParams();
    query.set("limit", String(limit));
    if (cursor) {
      query.set("cursor", cursor);
    }

    return apiFetch<UnburntListResponse>(`${UNBURNT_PUBLIC}?${query.toString()}`);
  }

  getMine(id: string): Promise<UnburntDetailResponse> {
    return apiFetch<UnburntDetailResponse>(`${UNBURNT_BASE}/${encodeURIComponent(id)}`);
  }

  getPublic(id: string): Promise<UnburntDetailResponse> {
    return apiFetch<UnburntDetailResponse>(`${UNBURNT_PUBLIC}/${encodeURIComponent(id)}`);
  }

  create(payload: UnburntCreatePayload): Promise<UnburntDetailResponse> {
    return apiFetch<UnburntDetailResponse>(UNBURNT_BASE, {
      method: "POST",
      json: payload,
    });
  }

  update(id: string, payload: UnburntUpdatePayload): Promise<UnburntDetailResponse> {
    return apiFetch<UnburntDetailResponse>(`${UNBURNT_BASE}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      json: payload,
    });
  }

  async remove(id: string): Promise<void> {
    await apiFetch<null>(`${UNBURNT_BASE}/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  updateVisibility(id: string, payload: UnburntVisibilityPayload): Promise<UnburntDetailResponse> {
    return apiFetch<UnburntDetailResponse>(
      `${UNBURNT_BASE}/${encodeURIComponent(id)}/visibility`,
      {
        method: "POST",
        json: payload,
      }
    );
  }

  getDraft(): Promise<UnburntDraftResponse> {
    return apiFetch<UnburntDraftResponse>(UNBURNT_DRAFT);
  }

  saveDraft(payload: UnburntDraftPayload): Promise<UnburntDraftResponse> {
    return apiFetch<UnburntDraftResponse>(UNBURNT_DRAFT, {
      method: "PUT",
      json: payload,
    });
  }

  async clearDraft(): Promise<void> {
    await apiFetch<null>(UNBURNT_DRAFT, {
      method: "DELETE",
    });
  }
}

interface MockEntry extends UnburntEntryDetail {
  anonUserId: string;
  deletedAt: string | null;
}

const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function nowIso(): string {
  return new Date().toISOString();
}

function createEmptyDraft(): UnburntDraftPayload {
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
      visibility: "private",
    },
  };
}

function buildSeedEntries(ownerId: string): MockEntry[] {
  const current = Date.now();

  return [
    {
      id: "mock-unburnt-1",
      anonUserId: ownerId,
      title: "Late-night Resolve",
      summary: "A longer check-in on planning, panic, and finishing gently.",
      rawText: [
        "I keep rewriting tomorrow's plan because I am afraid I will fail it.",
        "Let's split it: what must happen, and what can wait.",
        "Must happen: send one email, finish section one, sleep before 1 a.m.",
        "Great. What is the smallest first move for the email?",
        "Open the draft and write three plain lines.",
        "Perfect. Ten minutes, version one, then send.",
        "If I panic halfway, I usually freeze and scroll.",
        "Feet on floor, name five things you see, then return for two more lines.",
        "That sounds possible. I do not need a perfect night.",
        "You need a kind and finishable night. That is enough.",
      ].join("\n"),
      messages: [
        {
          role: "user",
          content: "I keep rewriting tomorrow's plan because I am afraid I will fail it.",
          order: 1,
        },
        { role: "4o", content: "Let's split it: what must happen, and what can wait.", order: 2 },
        {
          role: "user",
          content: "Must happen: send one email, finish section one, sleep before 1 a.m.",
          order: 3,
        },
        { role: "4o", content: "Great. What is the smallest first move for the email?", order: 4 },
        { role: "user", content: "Open the draft and write three plain lines.", order: 5 },
        { role: "4o", content: "Perfect. Ten minutes, version one, then send.", order: 6 },
        { role: "user", content: "If I panic halfway, I usually freeze and scroll.", order: 7 },
        {
          role: "4o",
          content: "Feet on floor, name five things you see, then return for two more lines.",
          order: 8,
        },
        { role: "user", content: "That sounds possible. I do not need a perfect night.", order: 9 },
        { role: "4o", content: "You need a kind and finishable night. That is enough.", order: 10 },
      ],
      visibility: "private",
      tags: ["self", "night"],
      messageCount: 10,
      createdAt: new Date(current - 12 * 60_000).toISOString(),
      updatedAt: new Date(current - 12 * 60_000).toISOString(),
      isMine: true,
      deletedAt: null,
    },
    {
      id: "mock-unburnt-2",
      anonUserId: ownerId,
      title: "Restart",
      summary: "A restart conversation focused on tiny loops instead of dramatic resets.",
      rawText: [
        "I disappeared for a week after one bad day.",
        "That is not failure; that is overload.",
        "I want to restart, but I keep waiting for a perfect Monday.",
        "Use a five-minute restart, not a perfect week.",
        "What does a five-minute restart actually look like?",
        "Open your notes, pick one task, and define one visible next action.",
        "So if the task is exercise, the action is putting shoes by the door tonight?",
        "Exactly. Lower friction now, then begin tomorrow.",
        "And if tomorrow slips again?",
        "Restart again the same day. Small loops beat dramatic resets.",
      ].join("\n"),
      messages: [
        { role: "user", content: "I disappeared for a week after one bad day.", order: 1 },
        { role: "4o", content: "That is not failure; that is overload.", order: 2 },
        {
          role: "user",
          content: "I want to restart, but I keep waiting for a perfect Monday.",
          order: 3,
        },
        { role: "4o", content: "Use a five-minute restart, not a perfect week.", order: 4 },
        { role: "user", content: "What does a five-minute restart actually look like?", order: 5 },
        {
          role: "4o",
          content: "Open your notes, pick one task, and define one visible next action.",
          order: 6,
        },
        {
          role: "user",
          content: "So if the task is exercise, the action is putting shoes by the door tonight?",
          order: 7,
        },
        { role: "4o", content: "Exactly. Lower friction now, then begin tomorrow.", order: 8 },
        { role: "user", content: "And if tomorrow slips again?", order: 9 },
        { role: "4o", content: "Restart again the same day. Small loops beat dramatic resets.", order: 10 },
      ],
      visibility: "public",
      tags: ["restart"],
      messageCount: 10,
      createdAt: new Date(current - 60 * 60_000).toISOString(),
      updatedAt: new Date(current - 60 * 60_000).toISOString(),
      isMine: true,
      deletedAt: null,
    },
    {
      id: "mock-unburnt-3",
      anonUserId: "mock-public-user-1",
      title: "Quiet Check-in",
      summary: "A longer check-in about rest, guilt, and what still counts as progress.",
      rawText: [
        "I paused most of today and felt guilty about it.",
        "Pause can be maintenance, not abandonment.",
        "But my list barely moved.",
        "Did your nervous system calm even a little?",
        "Yes. I took a walk without headphones.",
        "That is meaningful progress; quiet is data too.",
        "How do I track days like this without calling them wasted?",
        "Record three things: what you protected, what you learned, and what you can do next.",
        "Protected: my energy. Learned: I need fewer tabs. Next: one focused hour.",
        "That is a solid day, not a failed one.",
      ].join("\n"),
      messages: [
        { role: "user", content: "I paused most of today and felt guilty about it.", order: 1 },
        { role: "4o", content: "Pause can be maintenance, not abandonment.", order: 2 },
        { role: "user", content: "But my list barely moved.", order: 3 },
        { role: "4o", content: "Did your nervous system calm even a little?", order: 4 },
        { role: "user", content: "Yes. I took a walk without headphones.", order: 5 },
        { role: "4o", content: "That is meaningful progress; quiet is data too.", order: 6 },
        {
          role: "user",
          content: "How do I track days like this without calling them wasted?",
          order: 7,
        },
        {
          role: "4o",
          content: "Record three things: what you protected, what you learned, and what you can do next.",
          order: 8,
        },
        {
          role: "user",
          content: "Protected: my energy. Learned: I need fewer tabs. Next: one focused hour.",
          order: 9,
        },
        { role: "4o", content: "That is a solid day, not a failed one.", order: 10 },
      ],
      visibility: "public",
      tags: ["rest", "pace"],
      messageCount: 10,
      createdAt: new Date(current - 95 * 60_000).toISOString(),
      updatedAt: new Date(current - 95 * 60_000).toISOString(),
      isMine: false,
      deletedAt: null,
    },
    {
      id: "mock-unburnt-4",
      anonUserId: "mock-public-user-2",
      title: "Small Mercy",
      summary: "A longer dialogue on doing less, dropping comparison, and keeping dignity.",
      rawText: [
        "I did less tonight than I promised myself.",
        "Tell me what you did complete.",
        "I cooked, replied to one message, and paid one bill.",
        "That is real care work, not nothing.",
        "I still hear the voice saying I am behind.",
        "Behind compared to which story?",
        "The version of me who never gets tired.",
        "That version is fictional. You are human and still showing up.",
        "How do I stop punishing myself for having limits?",
        "Name the limit, adjust the plan, and keep your dignity.",
      ].join("\n"),
      messages: [
        { role: "user", content: "I did less tonight than I promised myself.", order: 1 },
        { role: "4o", content: "Tell me what you did complete.", order: 2 },
        {
          role: "user",
          content: "I cooked, replied to one message, and paid one bill.",
          order: 3,
        },
        { role: "4o", content: "That is real care work, not nothing.", order: 4 },
        { role: "user", content: "I still hear the voice saying I am behind.", order: 5 },
        { role: "4o", content: "Behind compared to which story?", order: 6 },
        { role: "user", content: "The version of me who never gets tired.", order: 7 },
        {
          role: "4o",
          content: "That version is fictional. You are human and still showing up.",
          order: 8,
        },
        { role: "user", content: "How do I stop punishing myself for having limits?", order: 9 },
        { role: "4o", content: "Name the limit, adjust the plan, and keep your dignity.", order: 10 },
      ],
      visibility: "public",
      tags: ["mercy", "evening"],
      messageCount: 10,
      createdAt: new Date(current - 140 * 60_000).toISOString(),
      updatedAt: new Date(current - 140 * 60_000).toISOString(),
      isMine: false,
      deletedAt: null,
    },
    {
      id: "mock-unburnt-5",
      anonUserId: "mock-public-user-3",
      title: "After Rain",
      summary: "A longer exchange on protecting one quiet minute in a noisy day.",
      rawText: [
        "Today was loud from morning to night.",
        "Let us find one minute that felt quieter.",
        "At the bus stop, rain started and everyone went silent.",
        "What changed in your body in that minute?",
        "My jaw unclenched, and my breathing slowed.",
        "Good signal. That means your system can still recover.",
        "Can I build that feeling on purpose tomorrow?",
        "Yes. Schedule two quiet minutes: after lunch and before bed.",
        "If the day explodes again, I can still protect one minute.",
        "Exactly. One protected minute can keep the whole day from burning.",
      ].join("\n"),
      messages: [
        { role: "user", content: "Today was loud from morning to night.", order: 1 },
        { role: "4o", content: "Let us find one minute that felt quieter.", order: 2 },
        {
          role: "user",
          content: "At the bus stop, rain started and everyone went silent.",
          order: 3,
        },
        { role: "4o", content: "What changed in your body in that minute?", order: 4 },
        { role: "user", content: "My jaw unclenched, and my breathing slowed.", order: 5 },
        { role: "4o", content: "Good signal. That means your system can still recover.", order: 6 },
        { role: "user", content: "Can I build that feeling on purpose tomorrow?", order: 7 },
        {
          role: "4o",
          content: "Yes. Schedule two quiet minutes: after lunch and before bed.",
          order: 8,
        },
        {
          role: "user",
          content: "If the day explodes again, I can still protect one minute.",
          order: 9,
        },
        {
          role: "4o",
          content: "Exactly. One protected minute can keep the whole day from burning.",
          order: 10,
        },
      ],
      visibility: "public",
      tags: ["calm", "weather"],
      messageCount: 10,
      createdAt: new Date(current - 220 * 60_000).toISOString(),
      updatedAt: new Date(current - 220 * 60_000).toISOString(),
      isMine: false,
      deletedAt: null,
    },
  ];
}

class MockUnburntApiService implements UnburntService {
  private anonUserId = "mock-local-user";
  private entries: MockEntry[] = buildSeedEntries(this.anonUserId);
  private draft: UnburntDraftPayload = createEmptyDraft();

  async listMine(
    visibility: UnburntMineVisibility = "all",
    limit = 20,
    cursor?: string
  ): Promise<UnburntListResponse> {
    const safeLimit = normalizeLimit(limit);
    const offset = parseOffsetCursor(cursor);

    const source = this.entries
      .filter((entry) => entry.anonUserId === this.anonUserId && !entry.deletedAt)
      .filter((entry) => visibility === "all" || entry.visibility === visibility)
      .sort(compareEntryOrder);

    return buildOffsetPage(source, safeLimit, offset);
  }

  async listPublic(limit = 20, cursor?: string): Promise<UnburntListResponse> {
    const safeLimit = normalizeLimit(limit);
    const offset = parseOffsetCursor(cursor);

    const source = this.entries
      .filter((entry) => entry.visibility === "public" && !entry.deletedAt)
      .sort(compareEntryOrder);

    return buildOffsetPage(source, safeLimit, offset);
  }

  async getMine(id: string): Promise<UnburntDetailResponse> {
    const item = this.entries.find(
      (entry) => entry.id === id && entry.anonUserId === this.anonUserId && !entry.deletedAt
    );

    if (!item) {
      throw new ApiError("Unburnt entry not found.", 404, "UNBURNT_NOT_FOUND", null);
    }

    return { item: cloneDetail(item, true) };
  }

  async getPublic(id: string): Promise<UnburntDetailResponse> {
    const item = this.entries.find(
      (entry) => entry.id === id && entry.visibility === "public" && !entry.deletedAt
    );

    if (!item) {
      throw new ApiError("Unburnt entry not found.", 404, "UNBURNT_NOT_FOUND", null);
    }

    return { item: cloneDetail(item, item.anonUserId === this.anonUserId) };
  }

  async create(payload: UnburntCreatePayload): Promise<UnburntDetailResponse> {
    const normalized = normalizeCreatePayload(payload);
    const createdAt = nowIso();

    const item: MockEntry = {
      id: `mock-unburnt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      anonUserId: this.anonUserId,
      title: normalized.title,
      summary: normalized.summary,
      rawText: normalized.rawText,
      messages: normalized.messages,
      visibility: normalized.visibility,
      tags: normalized.tags,
      messageCount: normalized.messages.length,
      createdAt,
      updatedAt: createdAt,
      isMine: true,
      deletedAt: null,
    };

    this.entries = [item, ...this.entries];
    return { item: cloneDetail(item, true) };
  }

  async update(id: string, payload: UnburntUpdatePayload): Promise<UnburntDetailResponse> {
    const target = this.entries.find(
      (entry) => entry.id === id && entry.anonUserId === this.anonUserId && !entry.deletedAt
    );

    if (!target) {
      throw new ApiError("Unburnt entry not found.", 404, "UNBURNT_NOT_FOUND", null);
    }

    const normalized = normalizeUpdatePayload(payload);
    if (Object.keys(normalized).length === 0) {
      throw new ApiError("No valid fields to update.", 400, "UNBURNT_EMPTY_UPDATE", null);
    }

    if (normalized.title !== undefined) {
      target.title = normalized.title;
    }
    if (normalized.summary !== undefined) {
      target.summary = normalized.summary;
    }
    if (normalized.rawText !== undefined) {
      target.rawText = normalized.rawText;
    }
    if (normalized.messages !== undefined) {
      target.messages = normalized.messages;
      target.messageCount = normalized.messages.length;
    }
    if (normalized.visibility !== undefined) {
      target.visibility = normalized.visibility;
    }
    if (normalized.tags !== undefined) {
      target.tags = normalized.tags;
    }

    target.updatedAt = nowIso();

    return { item: cloneDetail(target, true) };
  }

  async remove(id: string): Promise<void> {
    const target = this.entries.find(
      (entry) => entry.id === id && entry.anonUserId === this.anonUserId && !entry.deletedAt
    );

    if (!target) {
      throw new ApiError("Unburnt entry not found.", 404, "UNBURNT_NOT_FOUND", null);
    }

    target.deletedAt = nowIso();
    target.updatedAt = target.deletedAt;
  }

  async updateVisibility(
    id: string,
    payload: UnburntVisibilityPayload
  ): Promise<UnburntDetailResponse> {
    const target = this.entries.find(
      (entry) => entry.id === id && entry.anonUserId === this.anonUserId && !entry.deletedAt
    );

    if (!target) {
      throw new ApiError("Unburnt entry not found.", 404, "UNBURNT_NOT_FOUND", null);
    }

    target.visibility = normalizeVisibility(payload.visibility);
    target.updatedAt = nowIso();

    return { item: cloneDetail(target, true) };
  }

  async getDraft(): Promise<UnburntDraftResponse> {
    return {
      anonUserId: this.anonUserId,
      draft: cloneDraft(this.draft),
    };
  }

  async saveDraft(payload: UnburntDraftPayload): Promise<UnburntDraftResponse> {
    this.draft = normalizeDraft(payload);
    return {
      anonUserId: this.anonUserId,
      draft: cloneDraft(this.draft),
    };
  }

  async clearDraft(): Promise<void> {
    this.draft = createEmptyDraft();
  }
}

function normalizeLimit(limit: number): number {
  if (!Number.isFinite(limit)) {
    return 20;
  }

  return Math.max(1, Math.min(50, Math.floor(limit)));
}

function parseOffsetCursor(cursor?: string): number {
  if (!cursor) {
    return 0;
  }

  const parsed = Number.parseInt(cursor, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function buildOffsetPage(
  source: MockEntry[],
  limit: number,
  offset: number
): UnburntListResponse {
  const sliced = source.slice(offset, offset + limit).map((entry) => cloneListItem(entry));
  const nextCursor = offset + limit < source.length ? String(offset + limit) : null;

  return {
    items: sliced,
    nextCursor,
  };
}

function compareEntryOrder(left: MockEntry, right: MockEntry): number {
  const leftTime = Date.parse(left.createdAt);
  const rightTime = Date.parse(right.createdAt);

  if (leftTime !== rightTime) {
    return rightTime - leftTime;
  }

  return right.id.localeCompare(left.id);
}

function cloneListItem(entry: MockEntry): UnburntEntryListItem {
  return {
    id: entry.id,
    title: entry.title,
    summary: entry.summary,
    visibility: entry.visibility,
    tags: [...entry.tags],
    messageCount: entry.messageCount,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

function cloneDetail(entry: MockEntry, isMine: boolean): UnburntEntryDetail {
  return {
    ...cloneListItem(entry),
    rawText: entry.rawText,
    messages: entry.messages.map((message) => ({ ...message })),
    isMine,
  };
}

function cloneDraft(draft: UnburntDraftPayload): UnburntDraftPayload {
  return {
    mode: draft.mode,
    entryId: draft.entryId,
    stage: draft.stage,
    rawText: draft.rawText,
    lines: [...draft.lines],
    boundaries: [...draft.boundaries],
    messages: draft.messages.map((message) => ({ ...message })),
    fragmentMeta: {
      title: draft.fragmentMeta.title,
      summary: draft.fragmentMeta.summary,
      tags: [...draft.fragmentMeta.tags],
      visibility: draft.fragmentMeta.visibility,
    },
  };
}

function normalizeCreatePayload(payload: UnburntCreatePayload): Required<UnburntCreatePayload> {
  const title = normalizeTitle(payload.title, true);
  const summary = normalizeSummary(payload.summary ?? "");
  const rawText = normalizeRawText(payload.rawText, true);
  const messages = normalizeMessages(payload.messages, true);
  const visibility = normalizeVisibility(payload.visibility ?? "private");
  const tags = normalizeTags(payload.tags ?? []);

  return {
    title,
    summary,
    rawText,
    messages,
    visibility,
    tags,
  };
}

function normalizeUpdatePayload(payload: UnburntUpdatePayload): {
  title?: string;
  summary?: string;
  rawText?: string;
  messages?: UnburntMessage[];
  tags?: string[];
  visibility?: UnburntVisibility;
} {
  const output: {
    title?: string;
    summary?: string;
    rawText?: string;
    messages?: UnburntMessage[];
    tags?: string[];
    visibility?: UnburntVisibility;
  } = {};

  if (Object.hasOwn(payload, "title")) {
    output.title = normalizeTitle(payload.title, true);
  }

  if (Object.hasOwn(payload, "summary")) {
    output.summary = normalizeSummary(payload.summary ?? "");
  }

  if (Object.hasOwn(payload, "rawText")) {
    output.rawText = normalizeRawText(payload.rawText ?? "", true);
  }

  if (Object.hasOwn(payload, "messages")) {
    output.messages = normalizeMessages(payload.messages ?? [], true);
  }

  if (Object.hasOwn(payload, "tags")) {
    output.tags = normalizeTags(payload.tags ?? []);
  }

  if (Object.hasOwn(payload, "visibility")) {
    output.visibility = normalizeVisibility(payload.visibility ?? "private");
  }

  return output;
}

function normalizeTitle(value: unknown, required: boolean): string {
  if (typeof value !== "string") {
    throw new ApiError("title must be a string.", 400, "UNBURNT_TITLE_TYPE", null);
  }

  const normalized = value.trim();
  if (required && !normalized) {
    throw new ApiError("title cannot be empty.", 400, "UNBURNT_TITLE_EMPTY", null);
  }

  if (Array.from(normalized).length > 120) {
    throw new ApiError("title too long.", 400, "UNBURNT_TITLE_TOO_LONG", { maxLength: 120 });
  }

  return normalized;
}

function normalizeSummary(value: unknown): string {
  if (typeof value !== "string") {
    throw new ApiError("summary must be a string.", 400, "UNBURNT_SUMMARY_TYPE", null);
  }

  const normalized = value.trim();
  if (Array.from(normalized).length > 500) {
    throw new ApiError("summary too long.", 400, "UNBURNT_SUMMARY_TOO_LONG", { maxLength: 500 });
  }

  return normalized;
}

function normalizeRawText(value: unknown, required: boolean): string {
  if (typeof value !== "string") {
    throw new ApiError("rawText must be a string.", 400, "UNBURNT_RAW_TEXT_TYPE", null);
  }

  const normalized = value.replace(/\r\n?/g, "\n");
  if (required && !normalized) {
    throw new ApiError("rawText cannot be empty.", 400, "UNBURNT_RAW_TEXT_EMPTY", null);
  }

  if (Array.from(normalized).length > 50_000) {
    throw new ApiError("rawText too long.", 400, "UNBURNT_RAW_TEXT_TOO_LONG", {
      maxLength: 50_000,
    });
  }

  return normalized;
}

function normalizeMessages(value: unknown, required: boolean): UnburntMessage[] {
  if (!Array.isArray(value)) {
    throw new ApiError("messages must be an array.", 400, "UNBURNT_MESSAGES_TYPE", null);
  }

  if (required && value.length === 0) {
    throw new ApiError("messages cannot be empty.", 400, "UNBURNT_MESSAGES_EMPTY", null);
  }

  if (value.length > 200) {
    throw new ApiError("messages too many.", 400, "UNBURNT_MESSAGES_TOO_MANY", {
      maxLength: 200,
    });
  }

  const mapped: UnburntMessage[] = value.map((candidate) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      throw new ApiError("message must be an object.", 400, "UNBURNT_MESSAGES_TYPE", null);
    }

    const role = (candidate as Record<string, unknown>).role;
    const content = (candidate as Record<string, unknown>).content;
    const order = (candidate as Record<string, unknown>).order;

    if (role !== "user" && role !== "4o") {
      throw new ApiError(
        "message.role must be 'user' or '4o'.",
        400,
        "UNBURNT_MESSAGE_ROLE_INVALID",
        null
      );
    }

    if (typeof content !== "string") {
      throw new ApiError(
        "message.content must be a string.",
        400,
        "UNBURNT_MESSAGE_CONTENT_TYPE",
        null
      );
    }

    const normalizedContent = content.trim();
    if (!normalizedContent) {
      throw new ApiError(
        "message.content cannot be empty.",
        400,
        "UNBURNT_MESSAGE_CONTENT_EMPTY",
        null
      );
    }

    if (Array.from(normalizedContent).length > 5000) {
      throw new ApiError(
        "message.content too long.",
        400,
        "UNBURNT_MESSAGE_CONTENT_TOO_LONG",
        { maxLength: 5000 }
      );
    }

    if (!Number.isInteger(order) || (order as number) < 1) {
      throw new ApiError(
        "message.order must be a positive integer.",
        400,
        "UNBURNT_MESSAGE_ORDER_INVALID",
        null
      );
    }

    return {
      role,
      content: normalizedContent,
      order: order as number,
    };
  });

  const sorted = mapped.sort((left, right) => left.order - right.order);
  for (let index = 0; index < sorted.length; index += 1) {
    if (sorted[index].order !== index + 1) {
      throw new ApiError(
        "message.order must be consecutive.",
        400,
        "UNBURNT_MESSAGE_ORDER_INVALID",
        null
      );
    }
  }

  return sorted;
}

function normalizeVisibility(value: unknown): UnburntVisibility {
  if (value !== "private" && value !== "public") {
    throw new ApiError(
      "visibility must be private or public.",
      400,
      "UNBURNT_VISIBILITY_INVALID",
      null
    );
  }

  return value;
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new ApiError("tags must be an array.", 400, "UNBURNT_TAGS_TYPE", null);
  }

  const output: string[] = [];
  const seen = new Set<string>();

  for (const candidate of value) {
    if (typeof candidate !== "string") {
      throw new ApiError("tag must be a string.", 400, "UNBURNT_TAG_TYPE", null);
    }

    const normalized = candidate.trim();
    if (!normalized) {
      continue;
    }

    if (Array.from(normalized).length > 24) {
      throw new ApiError("tag too long.", 400, "UNBURNT_TAG_TOO_LONG", {
        maxLength: 24,
      });
    }

    const dedupeKey = normalized.toLowerCase();
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    output.push(normalized);
  }

  if (output.length > 12) {
    throw new ApiError("too many tags.", 400, "UNBURNT_TAGS_TOO_MANY", {
      maxLength: 12,
    });
  }

  return output;
}

function normalizeDraft(payload: UnburntDraftPayload): UnburntDraftPayload {
  const mode = payload.mode === "edit" ? "edit" : "create";
  const stage = payload.stage === "meta" ? "meta" : "structure";
  const entryId = typeof payload.entryId === "string" ? payload.entryId.trim() : "";
  const rawText = normalizeRawText(payload.rawText ?? "", false);

  const lines = Array.isArray(payload.lines)
    ? payload.lines
        .filter((line): line is string => typeof line === "string")
        .map((line) => line.replace(/\r\n?/g, "\n"))
        .slice(0, 5000)
    : [];

  const boundaries = Array.isArray(payload.boundaries)
    ? Array.from(
        new Set(
          payload.boundaries
            .filter((candidate): candidate is number => Number.isInteger(candidate) && candidate > 0)
            .slice(0, 5000)
        )
      ).sort((left, right) => left - right)
    : [];

  const messages = Array.isArray(payload.messages)
    ? payload.messages
        .filter(
          (message): message is UnburntMessage =>
            Boolean(message) &&
            typeof message === "object" &&
            (message.role === "user" || message.role === "4o") &&
            typeof message.content === "string"
        )
        .map((message, index) => ({
          role: message.role,
          content: message.content.trim(),
          order: index + 1,
        }))
        .slice(0, 200)
    : [];

  const visibility =
    payload.fragmentMeta?.visibility === "public" ? "public" : "private";

  const title = normalizeTitle(payload.fragmentMeta?.title ?? "", false);
  const summary = normalizeSummary(payload.fragmentMeta?.summary ?? "");
  const tags = normalizeTags(payload.fragmentMeta?.tags ?? []);

  return {
    mode,
    entryId,
    stage,
    rawText,
    lines,
    boundaries,
    messages,
    fragmentMeta: {
      title,
      summary,
      tags,
      visibility,
    },
  };
}

function shouldUseMockService(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return LOCALHOST_HOSTS.has(window.location.hostname);
}

const remoteService = new UnburntApiService();
const mockService = new MockUnburntApiService();

function getActiveService(): UnburntService {
  return shouldUseMockService() ? mockService : remoteService;
}

export const unburntApiService: UnburntService = {
  listMine(visibility, limit, cursor) {
    return getActiveService().listMine(visibility, limit, cursor);
  },
  listPublic(limit, cursor) {
    return getActiveService().listPublic(limit, cursor);
  },
  getMine(id) {
    return getActiveService().getMine(id);
  },
  getPublic(id) {
    return getActiveService().getPublic(id);
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
  updateVisibility(id, payload) {
    return getActiveService().updateVisibility(id, payload);
  },
  getDraft() {
    return getActiveService().getDraft();
  },
  saveDraft(payload) {
    return getActiveService().saveDraft(payload);
  },
  clearDraft() {
    return getActiveService().clearDraft();
  },
};
