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

export interface OnwardRow {
  id: string;
  message: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface OnwardDraftPayload {
  message: string;
}
