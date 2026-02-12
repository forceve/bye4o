export interface TraceItem {
  id: string;
  displayName: string;
  message: string;
  createdAt: string;
}

export interface TraceRow {
  id: string;
  display_name: string;
  message: string;
  created_at: string;
}

export interface TraceDraftPayload {
  displayName: string;
  message: string;
}
