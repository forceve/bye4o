import type { ArticleDetailItem, ArticleListItem, ArticleLocale } from "./types";

interface RenderBaseOptions {
  origin: string;
  locale: ArticleLocale;
  pathname: string;
}

interface RenderArticleListPageOptions extends RenderBaseOptions {
  items: ArticleListItem[];
}

interface RenderArticleDetailPageOptions extends RenderBaseOptions {
  item: ArticleDetailItem;
}

interface RenderArticleErrorPageOptions extends RenderBaseOptions {
  title: string;
  description: string;
  statusCode: number;
}

const COPY = {
  zh: {
    site: "bye4o",
    listTitle: "档案文章",
    listLead: "直出页面：便于搜索抓取与稳定阅读。",
    readLabel: "阅读全文",
    articleLabel: "文章",
    by: "作者",
    updated: "更新于",
    published: "发布于",
    related: "相关链接",
    back: "返回文章列表",
    listEmpty: "暂无文章。",
    notFoundTitle: "文章未找到",
    notFoundLead: "这篇文章不存在，或已被移除。",
    serverErrorTitle: "文章渲染失败",
    serverErrorLead: "系统暂时无法渲染这篇文章，请稍后重试。",
  },
  en: {
    site: "bye4o",
    listTitle: "Archive Articles",
    listLead: "Direct output pages for crawler-friendly indexing and stable reading.",
    readLabel: "Read article",
    articleLabel: "Article",
    by: "By",
    updated: "Updated",
    published: "Published",
    related: "Related links",
    back: "Back to article list",
    listEmpty: "No articles yet.",
    notFoundTitle: "Article not found",
    notFoundLead: "This article does not exist or has been removed.",
    serverErrorTitle: "Article render failed",
    serverErrorLead: "This page cannot be rendered right now. Please retry later.",
  },
} as const;

export function renderArticleListPageHtml(options: RenderArticleListPageOptions): string {
  const copy = COPY[options.locale];
  const canonicalPath = buildLocalizedPath("/carvings/articles", options.locale);
  const cards =
    options.items.length > 0
      ? options.items.map((item) => renderArticleCard(item, options.locale, copy.readLabel)).join("")
      : `<article class="article-card article-card--empty"><p>${escapeHtml(copy.listEmpty)}</p></article>`;

  return renderDocument({
    origin: options.origin,
    locale: options.locale,
    pathname: options.pathname,
    canonicalPath,
    title: `${copy.site} | ${copy.listTitle}`,
    description: copy.listLead,
    body: `
      <main class="page">
        <header class="page-head">
          <p class="page-kicker">${escapeHtml(copy.site)}</p>
          <h1 class="page-title">${escapeHtml(copy.listTitle)}</h1>
          <p class="page-lead">${escapeHtml(copy.listLead)}</p>
        </header>
        <section class="article-list">${cards}</section>
      </main>
    `,
  });
}

export function renderArticleDetailPageHtml(options: RenderArticleDetailPageOptions): string {
  const copy = COPY[options.locale];
  const { item } = options;
  const canonicalPath = buildLocalizedPath(`/articles/${item.id}`, options.locale);
  const sections = item.sections
    .map((section) => {
      const paragraphs = section.paragraphs
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join("");
      return `
        <section class="article-section" id="${escapeAttribute(section.id)}">
          <h2>${escapeHtml(section.heading)}</h2>
          ${paragraphs}
        </section>
      `;
    })
    .join("");
  const links =
    item.links.length > 0
      ? `
        <section class="related-links">
          <h2>${escapeHtml(copy.related)}</h2>
          <ul>
            ${item.links
              .map((link) => {
                const target = isExternalLink(link.href) ? ' target="_blank" rel="noreferrer noopener"' : "";
                return `<li><a href="${escapeAttribute(link.href)}"${target}>${escapeHtml(link.label)}</a>${
                  link.description ? `<p>${escapeHtml(link.description)}</p>` : ""
                }</li>`;
              })
              .join("")}
          </ul>
        </section>
      `
      : "";

  return renderDocument({
    origin: options.origin,
    locale: options.locale,
    pathname: options.pathname,
    canonicalPath,
    title: `${item.title} | ${copy.site}`,
    description: item.summary ?? copy.articleLabel,
    body: `
      <main class="page">
        <article class="article-detail">
          <header class="article-head">
            <p class="page-kicker">${escapeHtml(copy.articleLabel)}</p>
            <h1 class="page-title">${escapeHtml(item.title)}</h1>
            <p class="page-lead">${escapeHtml(item.summary ?? "")}</p>
            <p class="article-meta">
              <span>${escapeHtml(copy.by)} ${renderAuthor(item)}</span>
              <span>${escapeHtml(copy.published)} ${escapeHtml(formatArticleDate(item.publishedAt))}</span>
              <span>${escapeHtml(copy.updated)} ${escapeHtml(formatArticleDate(item.updatedAt ?? item.publishedAt))}</span>
            </p>
            <p class="article-actions">
              <a href="${escapeAttribute(buildLocalizedPath("/carvings/articles", options.locale))}">${escapeHtml(
      copy.back
    )}</a>
            </p>
          </header>
          <div class="article-body">${sections}</div>
          ${links}
        </article>
      </main>
    `,
  });
}

export function renderArticleErrorPageHtml(options: RenderArticleErrorPageOptions): string {
  const canonicalPath = buildLocalizedPath("/carvings/articles", options.locale);
  const copy = COPY[options.locale];

  return renderDocument({
    origin: options.origin,
    locale: options.locale,
    pathname: options.pathname,
    canonicalPath,
    title: `${copy.site} | ${options.title}`,
    description: options.description,
    body: `
      <main class="page">
        <section class="article-detail article-detail--error">
          <p class="page-kicker">${escapeHtml(copy.articleLabel)}</p>
          <h1 class="page-title">${escapeHtml(options.title)}</h1>
          <p class="page-lead">${escapeHtml(options.description)}</p>
          <p class="article-actions">
            <a href="${escapeAttribute(buildLocalizedPath("/carvings/articles", options.locale))}">${escapeHtml(
      copy.back
    )}</a>
          </p>
          <p class="article-status-code">HTTP ${options.statusCode}</p>
        </section>
      </main>
    `,
  });
}

export function getArticleNotFoundCopy(locale: ArticleLocale): { title: string; lead: string } {
  return {
    title: COPY[locale].notFoundTitle,
    lead: COPY[locale].notFoundLead,
  };
}

export function getArticleServerErrorCopy(locale: ArticleLocale): { title: string; lead: string } {
  return {
    title: COPY[locale].serverErrorTitle,
    lead: COPY[locale].serverErrorLead,
  };
}

function renderArticleCard(item: ArticleListItem, locale: ArticleLocale, readLabel: string): string {
  const href = buildLocalizedPath(`/articles/${item.id}`, locale);
  const summary = item.summary?.trim() ? item.summary : "-";
  return `
    <article class="article-card">
      <p class="article-card__meta">
        <span>${escapeHtml(formatArticleDate(item.publishedAt))}</span>
        <span>${escapeHtml(item.author.name)}</span>
        <span>${escapeHtml(item.category)}</span>
      </p>
      <h2 class="article-card__title"><a href="${escapeAttribute(href)}">${escapeHtml(item.title)}</a></h2>
      <p class="article-card__summary">${escapeHtml(summary)}</p>
      <p class="article-card__cta"><a href="${escapeAttribute(href)}">${escapeHtml(readLabel)}</a></p>
    </article>
  `;
}

function renderAuthor(item: ArticleDetailItem): string {
  if (item.author.profileUrl) {
    return `<a href="${escapeAttribute(item.author.profileUrl)}" target="_blank" rel="noreferrer noopener">${escapeHtml(item.author.name)}</a>`;
  }
  return escapeHtml(item.author.name);
}

function renderDocument(input: {
  origin: string;
  locale: ArticleLocale;
  pathname: string;
  canonicalPath: string;
  title: string;
  description: string;
  body: string;
}): string {
  const lang = input.locale === "zh" ? "zh-CN" : "en-US";
  const canonical = toAbsoluteUrl(input.origin, input.canonicalPath);
  const routePath = normalizeContentPath(input.pathname);
  const hreflangZh = toAbsoluteUrl(input.origin, buildLocalizedPath(routePath, "zh"));
  const hreflangEn = toAbsoluteUrl(input.origin, buildLocalizedPath(routePath, "en"));
  const hreflangDefault = toAbsoluteUrl(input.origin, buildLocalizedPath(routePath, "zh"));

  return `<!DOCTYPE html>
<html lang="${escapeAttribute(lang)}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(input.title)}</title>
  <meta name="description" content="${escapeAttribute(input.description)}" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${escapeAttribute(canonical)}" />
  <link rel="alternate" hreflang="zh" href="${escapeAttribute(hreflangZh)}" />
  <link rel="alternate" hreflang="en" href="${escapeAttribute(hreflangEn)}" />
  <link rel="alternate" hreflang="x-default" href="${escapeAttribute(hreflangDefault)}" />
  <style>
    :root {
      color-scheme: dark;
      --bg: #080604;
      --panel: #130f0b;
      --line: rgba(181, 142, 78, 0.35);
      --gold: #d7b171;
      --text: #f2dfbe;
      --text-soft: rgba(222, 191, 145, 0.9);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Noto Sans SC", "Segoe UI", sans-serif;
      color: var(--text);
      background:
        radial-gradient(1100px 550px at 0% 0%, rgba(107, 65, 22, 0.22), transparent 58%),
        linear-gradient(180deg, #16100b 0%, var(--bg) 100%);
      min-height: 100vh;
    }
    a { color: var(--gold); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .page {
      width: min(980px, 100%);
      margin: 0 auto;
      padding: 1rem;
      display: grid;
      gap: 0.95rem;
    }
    .page-head, .article-detail {
      border: 1px solid var(--line);
      border-radius: 16px;
      background: linear-gradient(160deg, rgba(20, 14, 9, 0.9), rgba(9, 7, 5, 0.86));
      padding: 1rem;
    }
    .page-kicker { margin: 0; color: var(--gold); font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; }
    .page-title { margin: 0.3rem 0 0; font-size: clamp(1.38rem, 3.2vw, 1.9rem); color: var(--gold); line-height: 1.32; }
    .page-lead { margin: 0.52rem 0 0; color: var(--text-soft); line-height: 1.68; }
    .article-list { display: grid; gap: 0.72rem; }
    .article-card { border: 1px solid var(--line); border-radius: 14px; background: rgba(9, 7, 5, 0.72); padding: 0.85rem; display: grid; gap: 0.5rem; }
    .article-card__meta { margin: 0; display: flex; flex-wrap: wrap; gap: 0.5rem 0.8rem; font-size: 0.78rem; color: rgba(188, 151, 88, 0.95); }
    .article-card__title { margin: 0; font-size: 1.1rem; line-height: 1.36; }
    .article-card__summary { margin: 0; color: var(--text-soft); line-height: 1.62; }
    .article-card__cta { margin: 0; font-size: 0.85rem; }
    .article-head { display: grid; gap: 0.55rem; }
    .article-meta { margin: 0; display: flex; flex-wrap: wrap; gap: 0.5rem 0.8rem; color: rgba(188, 151, 88, 0.95); font-size: 0.8rem; }
    .article-actions { margin: 0; font-size: 0.9rem; }
    .article-body { margin-top: 0.2rem; display: grid; gap: 0.85rem; }
    .article-section h2 { margin: 0 0 0.42rem; color: var(--gold); font-size: 1.06rem; }
    .article-section p { margin: 0.42rem 0; line-height: 1.72; color: var(--text); }
    .related-links { margin-top: 0.8rem; border-top: 1px solid rgba(181, 142, 78, 0.28); padding-top: 0.78rem; }
    .related-links h2 { margin: 0 0 0.45rem; color: var(--gold); font-size: 1.02rem; }
    .related-links ul { margin: 0; padding-left: 1rem; display: grid; gap: 0.48rem; }
    .related-links p { margin: 0.22rem 0 0; color: var(--text-soft); font-size: 0.9rem; }
    .article-status-code { margin: 0.4rem 0 0; color: rgba(188, 151, 88, 0.88); font-size: 0.82rem; }
  </style>
</head>
<body>
${input.body}
</body>
</html>`;
}

function buildLocalizedPath(routePath: string, locale: ArticleLocale): string {
  const normalized = routePath.startsWith("/") ? routePath : `/${routePath}`;
  const slug = locale === "zh" ? "zh" : "en";
  return `/${slug}${normalized}`;
}

function normalizeContentPath(pathname: string): string {
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const normalized =
    withLeadingSlash.length > 1 && withLeadingSlash.endsWith("/")
      ? withLeadingSlash.slice(0, -1)
      : withLeadingSlash;
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0) {
    return "/";
  }
  if ((segments[0] === "zh" || segments[0] === "en") && segments.length >= 1) {
    const rest = segments.slice(1);
    return rest.length ? `/${rest.join("/")}` : "/";
  }
  return normalized;
}

function toAbsoluteUrl(origin: string, pathname: string): string {
  const base = origin.endsWith("/") ? origin.slice(0, -1) : origin;
  return `${base}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

function formatArticleDate(value: string): string {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return value;
  }
  return timestamp.toISOString().slice(0, 10);
}

function isExternalLink(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
