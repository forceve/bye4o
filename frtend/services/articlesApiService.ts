import { apiFetch, apiFetchRaw } from "./apiClient";

export interface ArticleAuthor {
  name: string;
  role: string;
  profileUrl?: string;
}

export interface ArticleLink {
  label: string;
  href: string;
  description?: string;
}

export interface ArticleSection {
  id: string;
  heading: string;
  paragraphs: string[];
}

export interface ArticleListItem {
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

export interface ArticleDetailItem extends ArticleListItem {
  links: ArticleLink[];
  sections: ArticleSection[];
}

export interface ArticlesListResponse {
  items: ArticleListItem[];
}

export interface ArticleDetailResponse {
  item: ArticleDetailItem;
}

export interface ArticleSourceMarkdownResponse {
  content: string;
  fileName: string;
}

export type ArticleLocale = "zh" | "en";

const ARTICLES_BASE = "/api/articles";

class ArticlesApiService {
  list(locale: ArticleLocale): Promise<ArticlesListResponse> {
    const query = new URLSearchParams();
    query.set("locale", locale);
    return apiFetch<ArticlesListResponse>(`${ARTICLES_BASE}?${query.toString()}`);
  }

  getById(articleId: string, locale: ArticleLocale): Promise<ArticleDetailResponse> {
    const query = new URLSearchParams();
    query.set("locale", locale);
    return apiFetch<ArticleDetailResponse>(
      `${ARTICLES_BASE}/${encodeURIComponent(articleId.trim().toLowerCase())}?${query.toString()}`
    );
  }

  async getSourceMarkdown(
    articleId: string,
    locale: ArticleLocale,
    download = false
  ): Promise<ArticleSourceMarkdownResponse> {
    const query = new URLSearchParams();
    query.set("locale", locale);
    if (download) {
      query.set("download", "1");
    }

    const normalizedId = encodeURIComponent(articleId.trim().toLowerCase());
    const response = await apiFetchRaw(
      `${ARTICLES_BASE}/${normalizedId}/source?${query.toString()}`
    );
    const content = await response.text();
    const fileName =
      parseFileNameFromContentDisposition(response.headers.get("Content-Disposition")) ??
      `${articleId.trim().toLowerCase()}.${locale}.md`;

    return {
      content,
      fileName,
    };
  }
}

export const articlesApiService = new ArticlesApiService();

function parseFileNameFromContentDisposition(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const filenameStar = value.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (filenameStar?.[1]) {
    try {
      return decodeURIComponent(filenameStar[1].trim());
    } catch {
      // ignore and try plain filename
    }
  }

  const plain = value.match(/filename\s*=\s*"([^"]+)"/i) ?? value.match(/filename\s*=\s*([^;]+)/i);
  if (!plain?.[1]) {
    return null;
  }

  const normalized = plain[1].trim().replace(/^"(.*)"$/, "$1");
  return normalized || null;
}
