import type { ArticleLocale } from "./types";

const RENDER_VERSION = "articles-html-v1";
const DETAIL_CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=1800";
const LIST_CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=1800";

export type ArticleRenderState = "hit" | "miss" | "rebuild";

interface GetOrBuildDetailHtmlOptions {
  bucket: R2Bucket;
  locale: ArticleLocale;
  articleId: string;
  sourceKey: string;
  sourceEtag: string;
  build: () => Promise<string> | string;
}

interface GetOrBuildListHtmlOptions {
  bucket: R2Bucket;
  locale: ArticleLocale;
  freshnessMs: number;
  build: () => Promise<string> | string;
}

export interface ArticleRenderResult {
  html: string;
  state: ArticleRenderState;
}

export function getArticlePageCacheControl(): string {
  return DETAIL_CACHE_CONTROL;
}

export function getArticleListCacheControl(): string {
  return LIST_CACHE_CONTROL;
}

export async function getOrBuildArticleDetailHtml(
  options: GetOrBuildDetailHtmlOptions
): Promise<ArticleRenderResult> {
  const key = buildDetailCacheKey(options.locale, options.articleId);
  const cached = await options.bucket.get(key);

  if (cached) {
    const metadata = cached.customMetadata ?? {};
    const cacheSourceKey = metadata.sourceKey ?? "";
    const cacheSourceEtag = metadata.sourceEtag ?? "";
    const cacheVersion = metadata.renderVersion ?? "";
    if (
      cacheSourceKey === options.sourceKey &&
      cacheSourceEtag === options.sourceEtag &&
      cacheVersion === RENDER_VERSION
    ) {
      return {
        html: await cached.text(),
        state: "hit",
      };
    }
  }

  const html = await options.build();
  await options.bucket.put(key, html, {
    httpMetadata: {
      contentType: "text/html; charset=utf-8",
      cacheControl: DETAIL_CACHE_CONTROL,
    },
    customMetadata: {
      sourceKey: options.sourceKey,
      sourceEtag: options.sourceEtag,
      renderVersion: RENDER_VERSION,
      generatedAt: String(Date.now()),
      locale: options.locale,
    },
  });

  return {
    html,
    state: cached ? "rebuild" : "miss",
  };
}

export async function getOrBuildArticleListHtml(
  options: GetOrBuildListHtmlOptions
): Promise<ArticleRenderResult> {
  const key = buildListCacheKey(options.locale);
  const cached = await options.bucket.get(key);
  const now = Date.now();

  if (cached) {
    const metadata = cached.customMetadata ?? {};
    const cacheVersion = metadata.renderVersion ?? "";
    const generatedAt = Number(metadata.generatedAt ?? "0");
    const listLocale = metadata.listLocale ?? "";

    if (
      cacheVersion === RENDER_VERSION &&
      listLocale === options.locale &&
      Number.isFinite(generatedAt) &&
      now - generatedAt <= options.freshnessMs
    ) {
      return {
        html: await cached.text(),
        state: "hit",
      };
    }
  }

  const html = await options.build();
  await options.bucket.put(key, html, {
    httpMetadata: {
      contentType: "text/html; charset=utf-8",
      cacheControl: LIST_CACHE_CONTROL,
    },
    customMetadata: {
      renderVersion: RENDER_VERSION,
      generatedAt: String(now),
      listLocale: options.locale,
    },
  });

  return {
    html,
    state: cached ? "rebuild" : "miss",
  };
}

function buildDetailCacheKey(locale: ArticleLocale, articleId: string): string {
  return `rendered/html/${locale}/articles/${articleId}.html`;
}

function buildListCacheKey(locale: ArticleLocale): string {
  return `rendered/html/${locale}/carvings/articles.html`;
}
