export interface EmberItem {
  id: string;
  displayName: string;
  message: string;
  createdAt: string;
}

export interface EmberRow {
  id: string;
  display_name: string;
  message: string;
  created_at: string;
}

export interface EmberDraftPayload {
  displayName: string;
  message: string;
}
