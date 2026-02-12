import { apiFetch } from "./apiClient";

export interface TraceItem {
  id: string;
  displayName: string;
  message: string;
  createdAt: string;
}

export interface TraceDraftPayload {
  displayName: string;
  message: string;
}

export interface TraceSessionResponse {
  anonUserId: string;
  draft: TraceDraftPayload;
}

export interface TraceListResponse {
  items: TraceItem[];
  nextCursor: string | null;
}

export interface TraceCreatePayload {
  displayName?: string;
  message: string;
}

export interface TraceCreateResponse {
  item: TraceItem;
}

const TRACES_BASE = "/api/traces";
const TRACES_SESSION = `${TRACES_BASE}/session`;

class TracesApiService {
  getSession(): Promise<TraceSessionResponse> {
    return apiFetch<TraceSessionResponse>(TRACES_SESSION);
  }

  saveDraft(payload: Partial<TraceDraftPayload>): Promise<TraceSessionResponse> {
    return apiFetch<TraceSessionResponse>(TRACES_SESSION, {
      method: "PUT",
      json: payload,
    });
  }

  list(limit = 20, cursor?: string): Promise<TraceListResponse> {
    const query = new URLSearchParams();
    query.set("limit", String(limit));
    if (cursor) {
      query.set("cursor", cursor);
    }
    return apiFetch<TraceListResponse>(`${TRACES_BASE}?${query.toString()}`);
  }

  create(payload: TraceCreatePayload): Promise<TraceCreateResponse> {
    return apiFetch<TraceCreateResponse>(TRACES_BASE, {
      method: "POST",
      json: payload,
    });
  }
}

export const tracesApiService = new TracesApiService();
