import { json } from "../../shared/http";
import { Env } from "../../types";
import { HttpError } from "../../shared/errors";
import { ErrorCodes } from "../../shared/errorCodes";
import {
  getArticleListCacheControl,
  getArticlePageCacheControl,
  getOrBuildArticleDetailHtml,
  getOrBuildArticleListHtml,
} from "./html-cache";
import {
  getArticleNotFoundCopy,
  getArticleServerErrorCopy,
  renderArticleDetailPageHtml,
  renderArticleErrorPageHtml,
  renderArticleListPageHtml,
} from "./html-render";
import {
  articleDetailToMarkdown,
  listArticleItems,
  loadArticleById,
  resolveArticleBucket,
  resolveRequestedLocale,
} from "./source";
import type { ArticleLocale } from "./types";

const ARTICLE_LIST_FRESHNESS_MS = 5 * 60 * 1000;

export async function handleListArticles(request: Request, env: Env): Promise<Response> {
  const bucket = resolveArticleBucket(env);
  const locale = resolveRequestedLocale(request);
  const items = await listArticleItems(bucket, locale);
  return json({ items });
}

export async function handleGetArticle(
  request: Request,
  env: Env,
  articleId: string
): Promise<Response> {
  const bucket = resolveArticleBucket(env);
  const locale = resolveRequestedLocale(request);
  const loaded = await loadArticleById(bucket, articleId, locale);
  if (!loaded) {
    throw new HttpError(404, ErrorCodes.NotFound, "Article not found.");
  }

  return json({ item: loaded.item });
}

export async function handleGetArticleSourceMarkdown(
  request: Request,
  env: Env,
  articleId: string
): Promise<Response> {
  const bucket = resolveArticleBucket(env);
  const locale = resolveRequestedLocale(request);
  const loaded = await loadArticleById(bucket, articleId, locale);
  if (!loaded) {
    throw new HttpError(404, ErrorCodes.NotFound, "Article not found.");
  }

  const markdown =
    loaded.source.extension === ".md" ? loaded.sourceMarkdown : articleDetailToMarkdown(loaded.item);
  const response = new Response(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=1800",
    },
  });

  const url = new URL(request.url);
  if (url.searchParams.get("download") === "1") {
    const filename = buildMarkdownFileName(loaded.item.id, locale);
    response.headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  }

  return response;
}

export async function handleRenderArticleListPage(
  request: Request,
  env: Env,
  locale: ArticleLocale
): Promise<Response> {
  const bucket = resolveArticleBucket(env);
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  const rendered = await getOrBuildArticleListHtml({
    bucket,
    locale,
    freshnessMs: ARTICLE_LIST_FRESHNESS_MS,
    build: async () => {
      const items = await listArticleItems(bucket, locale);
      return renderArticleListPageHtml({
        origin,
        locale,
        pathname: url.pathname,
        items,
      });
    },
  });

  return htmlResponse(rendered.html, 200, {
    "Cache-Control": getArticleListCacheControl(),
    "X-Article-Render": rendered.state,
  });
}

export async function handleRenderArticleDetailPage(
  request: Request,
  env: Env,
  locale: ArticleLocale,
  articleId: string
): Promise<Response> {
  const bucket = resolveArticleBucket(env);
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  try {
    const loaded = await loadArticleById(bucket, articleId, locale);
    if (!loaded) {
      const notFound = getArticleNotFoundCopy(locale);
      const html = renderArticleErrorPageHtml({
        origin,
        locale,
        pathname: url.pathname,
        title: notFound.title,
        description: notFound.lead,
        statusCode: 404,
      });
      return htmlResponse(html, 404, {
        "Cache-Control": getArticlePageCacheControl(),
        "X-Article-Render": "miss",
      });
    }

    const rendered = await getOrBuildArticleDetailHtml({
      bucket,
      locale,
      articleId: loaded.item.id,
      sourceKey: loaded.source.key,
      sourceEtag: loaded.sourceEtag,
      build: () =>
        renderArticleDetailPageHtml({
          origin,
          locale,
          pathname: url.pathname,
          item: loaded.item,
        }),
    });

    return htmlResponse(rendered.html, 200, {
      "Cache-Control": getArticlePageCacheControl(),
      "X-Article-Render": rendered.state,
    });
  } catch (error) {
    console.error("Failed to render article detail page", {
      articleId,
      locale,
      message: error instanceof Error ? error.message : String(error),
    });
    const errorCopy = getArticleServerErrorCopy(locale);
    const html = renderArticleErrorPageHtml({
      origin,
      locale,
      pathname: url.pathname,
      title: errorCopy.title,
      description: errorCopy.lead,
      statusCode: 500,
    });
    return htmlResponse(html, 500, {
      "Cache-Control": getArticlePageCacheControl(),
      "X-Article-Render": "miss",
    });
  }
}

function htmlResponse(
  html: string,
  status = 200,
  extraHeaders: Record<string, string> = {}
): Response {
  const headers = new Headers({
    "Content-Type": "text/html; charset=utf-8",
    ...extraHeaders,
  });

  return new Response(html, {
    status,
    headers,
  });
}

function buildMarkdownFileName(articleId: string, locale: ArticleLocale): string {
  return `${articleId}.${locale}.md`;
}
