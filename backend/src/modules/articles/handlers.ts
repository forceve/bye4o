import { Env } from "../../types";
import { HttpError } from "../../shared/errors";
import { ErrorCodes } from "../../shared/errorCodes";
import { json } from "../../shared/http";

const ARTICLE_PREFIX = "articles/";
const ARTICLE_EXTENSIONS = [".md", ".json"] as const;
const SUPPORTED_ARTICLE_LOCALES = ["zh", "en"] as const;
type ArticleLocale = (typeof SUPPORTED_ARTICLE_LOCALES)[number];
const DEFAULT_ARTICLE_LOCALE: ArticleLocale = "zh";

interface ArticleAuthor {
  name: string;
  role: string;
  profileUrl?: string;
}

interface ArticleLink {
  label: string;
  href: string;
  description?: string;
}

interface ArticleSection {
  id: string;
  heading: string;
  paragraphs: string[];
}

interface ArticleListItem {
  id: string;
  title: string;
  summary?: string;
  publishedAt: string;
  updatedAt?: string;
  readMinutes: number;
  category: string;
  tags: string[];
  author: ArticleAuthor;
}

interface ArticleDetailItem extends ArticleListItem {
  links: ArticleLink[];
  sections: ArticleSection[];
}

type FrontMatterValue = string | string[];

export async function handleListArticles(request: Request, env: Env): Promise<Response> {
  const bucket = resolveArticleBucket(env);
  const locale = resolveRequestedLocale(request);
  const objects = await listArticleObjects(bucket, locale);

  const summaries = await Promise.all(
    objects.map(async (key) => {
      try {
        const detail = await loadArticleByKey(bucket, key);
        return toArticleListItem(detail);
      } catch {
        return null;
      }
    })
  );

  const items = summaries
    .filter((item): item is ArticleListItem => item !== null)
    .sort(compareArticleListItem);

  return json({ items });
}

export async function handleGetArticle(
  request: Request,
  env: Env,
  articleId: string
): Promise<Response> {
  const bucket = resolveArticleBucket(env);
  const locale = resolveRequestedLocale(request);
  const key = await findArticleKeyById(bucket, articleId, locale);
  if (!key) {
    throw new HttpError(404, ErrorCodes.NotFound, "Article not found.");
  }

  const item = await loadArticleByKey(bucket, key);
  return json({ item });
}

function resolveArticleBucket(env: Env): R2Bucket {
  const bucket = env.ARTICLE_ARCHIVE;
  if (!bucket) {
    throw new HttpError(
      503,
      ErrorCodes.ArticleArchiveUnavailable,
      "Article archive bucket is not configured."
    );
  }
  return bucket;
}

async function listArticleObjects(bucket: R2Bucket, locale: ArticleLocale): Promise<string[]> {
  const localePrefix = `${ARTICLE_PREFIX}${locale}/`;
  const localeKeys = await listArticleObjectKeysByPrefix(bucket, localePrefix);

  // Compatibility fallback for legacy objects stored directly under `articles/<id>.*`.
  const legacyKeys =
    locale === DEFAULT_ARTICLE_LOCALE
      ? await listArticleObjectKeysByPrefix(bucket, ARTICLE_PREFIX)
      : [];

  const merged = [...localeKeys];
  const seenIds = new Set(localeKeys.map((key) => articleIdFromKey(key)));

  for (const key of legacyKeys) {
    if (!isLegacyFlatArticleKey(key)) {
      continue;
    }
    const id = articleIdFromKey(key);
    if (seenIds.has(id)) {
      continue;
    }
    merged.push(key);
  }

  return merged;
}

function isLegacyFlatArticleKey(key: string): boolean {
  if (!key.startsWith(ARTICLE_PREFIX)) {
    return false;
  }

  const rest = key.slice(ARTICLE_PREFIX.length);
  if (!rest || rest.includes("/")) {
    return false;
  }

  return ARTICLE_EXTENSIONS.some((extension) => rest.endsWith(extension));
}

async function listArticleObjectKeysByPrefix(
  bucket: R2Bucket,
  prefix: string
): Promise<string[]> {
  const keys: string[] = [];
  let cursor: string | undefined;

  do {
    const result = await bucket.list({
      prefix,
      cursor,
    });

    for (const object of result.objects) {
      if (!isSupportedArticleObject(object.key)) {
        continue;
      }
      keys.push(object.key);
    }

    cursor = result.truncated ? result.cursor : undefined;
  } while (cursor);

  return keys.sort((a, b) => a.localeCompare(b));
}

function isSupportedArticleObject(key: string): boolean {
  if (!key.startsWith(ARTICLE_PREFIX)) {
    return false;
  }

  const rest = key.slice(ARTICLE_PREFIX.length);
  if (!rest) {
    return false;
  }

  const parts = rest.split("/");
  if (parts.length > 2) {
    return false;
  }

  if (parts.length === 2 && !isArticleLocale(parts[0])) {
    return false;
  }

  const fileName = parts[parts.length - 1];
  return ARTICLE_EXTENSIONS.some((extension) => fileName.endsWith(extension));
}

async function findArticleKeyById(
  bucket: R2Bucket,
  articleId: string,
  locale: ArticleLocale
): Promise<string | null> {
  const normalizedId = normalizeArticleId(articleId);
  for (const extension of ARTICLE_EXTENSIONS) {
    const key = `${ARTICLE_PREFIX}${locale}/${normalizedId}${extension}`;
    const object = await bucket.head(key);
    if (object) {
      return key;
    }
  }

  if (locale === DEFAULT_ARTICLE_LOCALE) {
    for (const extension of ARTICLE_EXTENSIONS) {
      const key = `${ARTICLE_PREFIX}${normalizedId}${extension}`;
      const object = await bucket.head(key);
      if (object) {
        return key;
      }
    }
  }

  return null;
}

async function loadArticleByKey(bucket: R2Bucket, key: string): Promise<ArticleDetailItem> {
  const object = await bucket.get(key);
  if (!object) {
    throw new HttpError(404, ErrorCodes.NotFound, "Article not found.");
  }

  const text = await object.text();
  const articleId = articleIdFromKey(key);
  const extension = extensionFromKey(key);

  if (extension === ".md") {
    return parseMarkdownArticle(articleId, text);
  }

  if (extension === ".json") {
    return parseJsonArticle(articleId, text);
  }

  throw new HttpError(500, ErrorCodes.ArticleInvalidPayload, "Unsupported article format.");
}

function extensionFromKey(key: string): ".md" | ".json" | "" {
  if (key.endsWith(".md")) {
    return ".md";
  }
  if (key.endsWith(".json")) {
    return ".json";
  }
  return "";
}

function articleIdFromKey(key: string): string {
  const fileName = key.slice(key.lastIndexOf("/") + 1);
  return normalizeArticleId(fileName.replace(/\.(md|json)$/i, ""));
}

function normalizeArticleId(value: string): string {
  return value.trim().toLowerCase();
}

function toArticleListItem(detail: ArticleDetailItem): ArticleListItem {
  return {
    id: detail.id,
    title: detail.title,
    summary: detail.summary,
    publishedAt: detail.publishedAt,
    updatedAt: detail.updatedAt,
    readMinutes: detail.readMinutes,
    category: detail.category,
    tags: detail.tags,
    author: detail.author,
  };
}

function compareArticleListItem(left: ArticleListItem, right: ArticleListItem): number {
  const leftTime = Date.parse(left.publishedAt);
  const rightTime = Date.parse(right.publishedAt);
  if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
    return rightTime - leftTime;
  }

  return left.id.localeCompare(right.id);
}

function parseMarkdownArticle(articleId: string, source: string): ArticleDetailItem {
  const { frontMatter, body } = splitFrontMatter(source);
  const bodyTrimmed = body.trim();

  const { titleFromHeading, sections } = parseSectionsFromMarkdown(
    bodyTrimmed,
    articleId,
    "Content"
  );

  const title =
    getFrontMatterString(frontMatter, "title") ?? titleFromHeading ?? fallbackTitle(articleId);
  const summary =
    getFrontMatterString(frontMatter, "summary") ?? pickSummaryFromSections(sections);
  const publishedAt =
    getFrontMatterString(frontMatter, "publishedAt") ??
    getFrontMatterString(frontMatter, "date") ??
    new Date().toISOString();
  const updatedAt =
    getFrontMatterString(frontMatter, "updatedAt") ??
    getFrontMatterString(frontMatter, "updated_at");
  const category = getFrontMatterString(frontMatter, "category") ?? "Archive";
  const tags = getFrontMatterArray(frontMatter, "tags");
  const author = parseAuthorFromFrontMatter(frontMatter);
  const links = parseLinksFromFrontMatter(frontMatter);
  const readMinutes = estimateReadMinutes(
    sections.flatMap((section) => section.paragraphs).join(" ")
  );

  return {
    id: articleId,
    title,
    summary,
    publishedAt,
    updatedAt,
    readMinutes,
    category,
    tags,
    author,
    links,
    sections,
  };
}

function parseJsonArticle(articleId: string, source: string): ArticleDetailItem {
  let payload: unknown;
  try {
    payload = JSON.parse(source);
  } catch {
    throw new HttpError(500, ErrorCodes.ArticleInvalidPayload, "Invalid article JSON payload.");
  }

  const record = asRecord(payload);
  const title = readString(record.title) ?? fallbackTitle(articleId);
  const summary = readString(record.summary);
  const publishedAt = readString(record.publishedAt) ?? new Date().toISOString();
  const updatedAt = readString(record.updatedAt);
  const category = readString(record.category) ?? "Archive";
  const tags = readStringArray(record.tags);
  const author = parseAuthorFromRecord(record.author);
  const links = parseLinksFromRecord(record.links);
  const sections = parseSectionsFromRecord(record.sections, articleId);
  const readMinutesRaw = readNumber(record.readMinutes);
  const computedReadMinutes = estimateReadMinutes(
    sections.flatMap((section) => section.paragraphs).join(" ")
  );

  return {
    id: articleId,
    title,
    summary,
    publishedAt,
    updatedAt,
    category,
    tags,
    author,
    links,
    sections,
    readMinutes:
      typeof readMinutesRaw === "number" && Number.isFinite(readMinutesRaw) && readMinutesRaw > 0
        ? Math.ceil(readMinutesRaw)
        : computedReadMinutes,
  };
}

function splitFrontMatter(source: string): {
  frontMatter: Record<string, FrontMatterValue>;
  body: string;
} {
  const normalized = source.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return {
      frontMatter: {},
      body: normalized,
    };
  }

  const endIndex = normalized.indexOf("\n---\n", 4);
  if (endIndex === -1) {
    return {
      frontMatter: {},
      body: normalized,
    };
  }

  const frontMatterBlock = normalized.slice(4, endIndex);
  const body = normalized.slice(endIndex + 5);

  return {
    frontMatter: parseSimpleYaml(frontMatterBlock),
    body,
  };
}

function parseSimpleYaml(block: string): Record<string, FrontMatterValue> {
  const output: Record<string, FrontMatterValue> = {};
  const lines = block.split("\n");
  let activeListKey: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    if (activeListKey && trimmed.startsWith("- ")) {
      const current = output[activeListKey];
      const values = Array.isArray(current) ? current : [];
      values.push(stripWrappingQuotes(trimmed.slice(2).trim()));
      output[activeListKey] = values;
      continue;
    }

    const separator = trimmed.indexOf(":");
    if (separator <= 0) {
      activeListKey = null;
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    if (!key) {
      activeListKey = null;
      continue;
    }

    if (!rawValue) {
      output[key] = [];
      activeListKey = key;
      continue;
    }

    output[key] = parseScalarOrArray(rawValue);
    activeListKey = null;
  }

  return output;
}

function parseScalarOrArray(rawValue: string): FrontMatterValue {
  const value = stripWrappingQuotes(rawValue);
  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((item) => stripWrappingQuotes(item.trim()))
      .filter(Boolean);
  }

  return value;
}

function stripWrappingQuotes(value: string): string {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function getFrontMatterString(
  frontMatter: Record<string, FrontMatterValue>,
  key: string
): string | undefined {
  const value = frontMatter[key];
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (Array.isArray(value) && value.length) {
    const merged = value.join(" / ").trim();
    return merged || undefined;
  }
  return undefined;
}

function getFrontMatterArray(
  frontMatter: Record<string, FrontMatterValue>,
  key: string
): string[] {
  const value = frontMatter[key];
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function parseAuthorFromFrontMatter(frontMatter: Record<string, FrontMatterValue>): ArticleAuthor {
  const authorRaw = frontMatter.author;
  let name = "Unknown";

  if (typeof authorRaw === "string" && authorRaw.trim()) {
    name = authorRaw.trim();
  } else if (Array.isArray(authorRaw) && authorRaw.length > 0) {
    name = authorRaw.map((item) => item.trim()).filter(Boolean).join(" / ") || "Unknown";
  }

  const role = getFrontMatterString(frontMatter, "authorRole") ?? "";
  const profileUrl = getFrontMatterString(frontMatter, "authorUrl");

  return {
    name,
    role,
    profileUrl,
  };
}

function parseLinksFromFrontMatter(frontMatter: Record<string, FrontMatterValue>): ArticleLink[] {
  const links: ArticleLink[] = [];

  const knownKeys: Array<{ key: string; label: string }> = [
    { key: "twitter", label: "Twitter" },
    { key: "x", label: "X" },
    { key: "github", label: "GitHub" },
    { key: "rednote", label: "Rednote" },
    { key: "website", label: "Website" },
  ];

  for (const item of knownKeys) {
    const value = getFrontMatterString(frontMatter, item.key);
    if (!value) {
      continue;
    }
    links.push({
      label: item.label,
      href: value,
    });
  }

  return links;
}

function parseSectionsFromMarkdown(
  body: string,
  articleId: string,
  fallbackHeading: string
): { titleFromHeading?: string; sections: ArticleSection[] } {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const sections: ArticleSection[] = [];

  let titleFromHeading: string | undefined;
  let activeHeading = fallbackHeading;
  let activeParagraphs: string[] = [];
  let paragraphBuffer: string[] = [];
  let sectionIndex = 1;

  const flushParagraph = () => {
    if (!paragraphBuffer.length) {
      return;
    }
    const paragraph = paragraphBuffer.join(" ").trim();
    if (paragraph) {
      activeParagraphs.push(paragraph);
    }
    paragraphBuffer = [];
  };

  const flushSection = () => {
    flushParagraph();
    if (!activeParagraphs.length) {
      return;
    }
    sections.push({
      id: `${articleId}-section-${sectionIndex}`,
      heading: activeHeading,
      paragraphs: activeParagraphs,
    });
    sectionIndex += 1;
    activeParagraphs = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushSection();
      activeHeading = trimmed.slice(3).trim() || fallbackHeading;
      continue;
    }

    if (trimmed.startsWith("# ")) {
      if (!titleFromHeading) {
        titleFromHeading = trimmed.slice(2).trim();
      }
      continue;
    }

    paragraphBuffer.push(trimmed);
  }

  flushSection();

  if (!sections.length) {
    sections.push({
      id: `${articleId}-section-1`,
      heading: fallbackHeading,
      paragraphs: body.trim() ? [body.trim()] : [""],
    });
  }

  return {
    titleFromHeading,
    sections,
  };
}

function pickSummaryFromSections(sections: ArticleSection[]): string | undefined {
  for (const section of sections) {
    for (const paragraph of section.paragraphs) {
      const trimmed = paragraph.trim();
      if (trimmed) {
        return trimmed.slice(0, 180);
      }
    }
  }
  return undefined;
}

function estimateReadMinutes(source: string): number {
  const latinWords = source.match(/[A-Za-z0-9_]+/g)?.length ?? 0;
  const cjkChars = source.match(/[\u3400-\u9FFF]/g)?.length ?? 0;
  const units = latinWords + cjkChars;
  return Math.max(1, Math.ceil(units / 420));
}

function fallbackTitle(articleId: string): string {
  return articleId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return undefined;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => readString(item))
    .filter((item): item is string => Boolean(item));
}

function parseAuthorFromRecord(value: unknown): ArticleAuthor {
  const record = asRecord(value);
  return {
    name: readString(record.name) ?? "Unknown",
    role: readString(record.role) ?? "",
    profileUrl: readString(record.profileUrl),
  };
}

function parseLinksFromRecord(value: unknown): ArticleLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const links: ArticleLink[] = [];
  for (const candidate of value) {
    const record = asRecord(candidate);
    const label = readString(record.label);
    const href = readString(record.href);
    if (!label || !href) {
      continue;
    }
    links.push({
      label,
      href,
      description: readString(record.description),
    });
  }
  return links;
}

function parseSectionsFromRecord(value: unknown, articleId: string): ArticleSection[] {
  if (!Array.isArray(value)) {
    return [
      {
        id: `${articleId}-section-1`,
        heading: "Content",
        paragraphs: [""],
      },
    ];
  }

  const sections: ArticleSection[] = [];
  let index = 1;
  for (const candidate of value) {
    const record = asRecord(candidate);
    const heading = readString(record.heading) ?? `Section ${index}`;
    const paragraphs = readStringArray(record.paragraphs);
    sections.push({
      id: readString(record.id) ?? `${articleId}-section-${index}`,
      heading,
      paragraphs: paragraphs.length ? paragraphs : [""],
    });
    index += 1;
  }

  if (!sections.length) {
    sections.push({
      id: `${articleId}-section-1`,
      heading: "Content",
      paragraphs: [""],
    });
  }

  return sections;
}

function resolveRequestedLocale(request: Request): ArticleLocale {
  const url = new URL(request.url);
  const fromQuery = normalizeArticleLocale(url.searchParams.get("locale"));
  if (fromQuery) {
    return fromQuery;
  }

  const fromHeader = localeFromAcceptLanguage(request.headers.get("Accept-Language"));
  if (fromHeader) {
    return fromHeader;
  }

  return DEFAULT_ARTICLE_LOCALE;
}

function localeFromAcceptLanguage(headerValue: string | null): ArticleLocale | null {
  if (!headerValue) {
    return null;
  }

  const parts = headerValue.split(",");
  for (const part of parts) {
    const token = part.split(";")[0]?.trim().toLowerCase() ?? "";
    const normalized = normalizeArticleLocale(token);
    if (normalized) {
      return normalized;
    }

    if (token.startsWith("zh")) {
      return "zh";
    }
    if (token.startsWith("en")) {
      return "en";
    }
  }

  return null;
}

function normalizeArticleLocale(value: string | null | undefined): ArticleLocale | null {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized === "zh" || normalized.startsWith("zh-")) {
    return "zh";
  }

  if (normalized === "en" || normalized.startsWith("en-")) {
    return "en";
  }

  return null;
}

function isArticleLocale(value: string): value is ArticleLocale {
  return (SUPPORTED_ARTICLE_LOCALES as readonly string[]).includes(value);
}
