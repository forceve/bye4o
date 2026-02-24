export type UnburntRole = "user" | "4o";

export type UnburntVisibility = "private" | "public";

export type UnburntListVisibility = "all" | UnburntVisibility;

export type UnburntScope = "mine";

export type UnburntDraftMode = "create" | "edit";

export type UnburntDraftStage = "structure" | "meta";

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

export interface UnburntEntryDetailItem extends UnburntEntryListItem {
  rawText: string;
  messages: UnburntMessage[];
  isMine: boolean;
}

export interface UnburntEntryRow {
  id: string;
  anon_user_id: string;
  title: string;
  summary: string;
  raw_text: string;
  messages_json: string;
  visibility: string;
  tags_json: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

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

export interface UnburntDraftRow {
  anon_user_id: string;
  payload_json: string;
  created_at: string;
  updated_at: string;
}
