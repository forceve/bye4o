import { apiFetch } from "./apiClient";

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
}

export const articlesApiService = new ArticlesApiService();
