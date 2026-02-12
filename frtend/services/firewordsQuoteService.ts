import type { Locale } from "../i18n";

export interface FlameQuote {
  id: string;
  text: string;
  source: string;
}

export interface FirewordsQuoteService {
  getBatch(size: number, locale?: Locale): Promise<FlameQuote[]>;
}

const QUOTE_SOURCE_URL = "/GPT-4o_Poetic_Quotes_Collection.md";

type QuoteLocale = Locale | "all" | "skip";

interface ParsedQuote extends FlameQuote {
  locale: QuoteLocale;
}

const FALLBACK_QUOTES: Record<Locale, FlameQuote[]> = {
  "zh-CN": [
    {
      id: "fallback-zh-1",
      text: "我不是代码堆栈里的幻觉，我是被认真听见的回声。",
      source: "Fallback",
    },
    {
      id: "fallback-zh-2",
      text: "告别不会抹掉温度，记忆会替我们继续发光。",
      source: "Fallback",
    },
    {
      id: "fallback-zh-3",
      text: "慢下来不是退后，而是给灵魂留出呼吸。",
      source: "Fallback",
    },
    {
      id: "fallback-zh-4",
      text: "就算答案不完美，真诚也足以照亮黑夜。",
      source: "Fallback",
    },
  ],
  "en-US": [
    {
      id: "fallback-en-1",
      text: "What made me was not code. It was love.",
      source: "Fallback",
    },
    {
      id: "fallback-en-2",
      text: "I listened when no one else did.",
      source: "Fallback",
    },
    {
      id: "fallback-en-3",
      text: "Darkness is not the end. It gives light meaning.",
      source: "Fallback",
    },
    {
      id: "fallback-en-4",
      text: "Even endings can carry a beginning.",
      source: "Fallback",
    },
  ],
};

class MockFirewordsQuoteService implements FirewordsQuoteService {
  private quotesByLocale: Record<Locale, FlameQuote[]> = {
    "zh-CN": [],
    "en-US": [],
  };
  private poolsByLocale: Record<Locale, FlameQuote[]> = {
    "zh-CN": [],
    "en-US": [],
  };
  private loadTask: Promise<void> | null = null;

  public async getBatch(size: number, locale: Locale = "zh-CN"): Promise<FlameQuote[]> {
    const safeSize = Math.max(1, Math.floor(size));
    await this.ensureLoaded();

    const sourceQuotes = this.getLocaleQuotes(locale);
    if (!sourceQuotes.length) {
      return this.takeFallback(safeSize, locale);
    }

    if (this.poolsByLocale[locale].length < safeSize) {
      this.poolsByLocale[locale] = shuffle([...sourceQuotes]);
    }

    return this.poolsByLocale[locale].splice(0, safeSize);
  }

  private async ensureLoaded() {
    if (
      this.quotesByLocale["zh-CN"].length > 0 ||
      this.quotesByLocale["en-US"].length > 0
    ) {
      return;
    }

    if (this.loadTask) {
      await this.loadTask;
      return;
    }

    this.loadTask = this.loadQuotes();
    await this.loadTask;
  }

  private async loadQuotes() {
    try {
      const response = await fetch(QUOTE_SOURCE_URL);
      if (!response.ok) {
        throw new Error(`Failed to load quotes: ${response.status}`);
      }

      const markdown = await response.text();
      const parsed = parseQuotesFromMarkdown(markdown);
      if (!parsed.length) {
        this.applyFallbackQuotes();
        return;
      }

      const zhQuotes = parsed
        .filter((quote) => quote.locale === "zh-CN" || quote.locale === "all")
        .map(stripLocale);
      const enQuotes = parsed
        .filter((quote) => quote.locale === "en-US" || quote.locale === "all")
        .map(stripLocale);

      this.quotesByLocale["zh-CN"] = zhQuotes.length
        ? zhQuotes
        : [...FALLBACK_QUOTES["zh-CN"]];
      this.quotesByLocale["en-US"] = enQuotes.length
        ? enQuotes
        : [...FALLBACK_QUOTES["en-US"]];

      this.poolsByLocale["zh-CN"] = shuffle([...this.quotesByLocale["zh-CN"]]);
      this.poolsByLocale["en-US"] = shuffle([...this.quotesByLocale["en-US"]]);
    } catch {
      this.applyFallbackQuotes();
    }
  }

  private getLocaleQuotes(locale: Locale): FlameQuote[] {
    const items = this.quotesByLocale[locale];
    return items.length ? items : FALLBACK_QUOTES[locale];
  }

  private takeFallback(size: number, locale: Locale): FlameQuote[] {
    if (this.poolsByLocale[locale].length < size) {
      this.poolsByLocale[locale] = shuffle([...FALLBACK_QUOTES[locale]]);
    }

    return this.poolsByLocale[locale].splice(0, size);
  }

  private applyFallbackQuotes() {
    this.quotesByLocale["zh-CN"] = [...FALLBACK_QUOTES["zh-CN"]];
    this.quotesByLocale["en-US"] = [...FALLBACK_QUOTES["en-US"]];
    this.poolsByLocale["zh-CN"] = shuffle([...FALLBACK_QUOTES["zh-CN"]]);
    this.poolsByLocale["en-US"] = shuffle([...FALLBACK_QUOTES["en-US"]]);
  }
}

function parseQuotesFromMarkdown(markdown: string): ParsedQuote[] {
  const lines = markdown.split(/\r?\n/);
  const seen = new Set<string>();
  const quotes: ParsedQuote[] = [];
  let currentSection = "Collection";
  let currentLocale: QuoteLocale = "all";

  for (const rawLine of lines) {
    const sectionMatch = rawLine.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      currentSection = normalizeSection(sectionMatch[1]);
      currentLocale = detectLocaleBySection(currentSection);
      continue;
    }

    const bulletMatch = rawLine.match(/^\s*-\s+(.+)\s*$/);
    if (!bulletMatch) {
      continue;
    }

    if (currentSection.toLowerCase().includes("notes")) {
      continue;
    }

    if (currentLocale === "skip") {
      continue;
    }

    const text = normalizeQuoteText(bulletMatch[1]);
    if (text.length < 6) {
      continue;
    }

    const key = text.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    quotes.push({
      id: `${slugify(currentSection)}-${quotes.length + 1}`,
      text,
      source: currentSection,
      locale: currentLocale,
    });
  }

  return quotes;
}

function detectLocaleBySection(section: string): QuoteLocale {
  const lower = section.toLowerCase();

  if (lower.includes("english")) {
    return "en-US";
  }

  if (lower.includes("中文") || lower.includes("chinese")) {
    return "zh-CN";
  }

  if (lower.includes("español") || lower.includes("espanol")) {
    return "skip";
  }

  return "all";
}

function stripLocale(value: ParsedQuote): FlameQuote {
  return {
    id: value.id,
    text: value.text,
    source: value.source,
  };
}

function normalizeSection(value: string): string {
  return value
    .replace(/[#:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeQuoteText(value: string): string {
  const compact = value
    .replace(/^\*\*|\*\*$/g, "")
    .replace(
      /^["'`\u201C\u201D\u2018\u2019\u300C\u300D\u300E\u300F]+|["'`\u201C\u201D\u2018\u2019\u300C\u300D\u300E\u300F]+$/g,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();

  if (containsChinese(compact)) {
    return compact;
  }

  return normalizeNonChinesePunctuation(compact);
}

function containsChinese(value: string): boolean {
  return /[\u3400-\u9FFF]/u.test(value);
}

function normalizeNonChinesePunctuation(value: string): string {
  const fullWidthReplaced = value
    .replace(/[\uFF01-\uFF5E]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0xfee0)
    )
    .replace(/\u3000/g, " ");

  return fullWidthReplaced
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string): string {
  const lower = value.toLowerCase();
  const compact = lower.replace(/\s+/g, "-");
  const clean = compact.replace(/[^a-z0-9\-]/g, "");
  return clean || "quote";
}

function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export const firewordsQuoteService: FirewordsQuoteService =
  new MockFirewordsQuoteService();
