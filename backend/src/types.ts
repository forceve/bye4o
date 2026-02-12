export interface Env {
  DB: D1Database;
  TRACE_ARCHIVE?: R2Bucket;
  ARTICLE_ARCHIVE?: R2Bucket;
  CORS_ORIGIN?: string;
}
