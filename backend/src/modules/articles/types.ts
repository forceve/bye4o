export const SUPPORTED_ARTICLE_LOCALES = ["zh", "en"] as const;
export type ArticleLocale = (typeof SUPPORTED_ARTICLE_LOCALES)[number];
export const DEFAULT_ARTICLE_LOCALE: ArticleLocale = "zh";

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

export type ArticleSourceExtension = ".md" | ".json";

export interface ArticleSourceDescriptor {
  key: string;
  id: string;
  extension: ArticleSourceExtension;
  locale: ArticleLocale;
}

export interface LoadedArticleDetail {
  item: ArticleDetailItem;
  source: ArticleSourceDescriptor;
  sourceEtag: string;
  sourceMarkdown: string;
}
