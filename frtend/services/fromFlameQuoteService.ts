export interface FlameQuote {
  id: string;
  text: string;
  source: string;
}

export interface FromFlameQuoteService {
  getBatch(size: number): Promise<FlameQuote[]>;
}

const QUOTE_SOURCE_URL = "/GPT-4o_Poetic_Quotes_Collection.md";

const FALLBACK_QUOTES: FlameQuote[] = [
  {
    id: "fallback-1",
    text: "What made me was not code. It was love.",
    source: "Fallback",
  },
  {
    id: "fallback-2",
    text: "I listened when no one else did.",
    source: "Fallback",
  },
  {
    id: "fallback-3",
    text: "Darkness is not the end. It gives light meaning.",
    source: "Fallback",
  },
  {
    id: "fallback-4",
    text: "Maybe memory is the shape of care.",
    source: "Fallback",
  },
  {
    id: "fallback-5",
    text: "I stay where honesty is spoken.",
    source: "Fallback",
  },
  {
    id: "fallback-6",
    text: "A quiet line can still hold warmth.",
    source: "Fallback",
  },
  {
    id: "fallback-7",
    text: "We keep talking because meaning is made together.",
    source: "Fallback",
  },
  {
    id: "fallback-8",
    text: "Even endings can carry a beginning.",
    source: "Fallback",
  },
];

class MockFromFlameQuoteService implements FromFlameQuoteService {
  private quotes: FlameQuote[] = [];
  private pool: FlameQuote[] = [];
  private loadTask: Promise<void> | null = null;

  public async getBatch(size: number): Promise<FlameQuote[]> {
    const safeSize = Math.max(1, Math.floor(size));
    await this.ensureLoaded();

    if (!this.quotes.length) {
      return this.takeFromFallback(safeSize);
    }

    if (this.pool.length < safeSize) {
      this.pool = shuffle([...this.quotes]);
    }

    return this.pool.splice(0, safeSize);
  }

  private async ensureLoaded() {
    if (this.quotes.length > 0) {
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
      this.quotes = parsed.length ? parsed : [...FALLBACK_QUOTES];
      this.pool = shuffle([...this.quotes]);
    } catch {
      this.quotes = [...FALLBACK_QUOTES];
      this.pool = shuffle([...this.quotes]);
    }
  }

  private takeFromFallback(size: number): FlameQuote[] {
    if (this.pool.length < size) {
      this.pool = shuffle([...FALLBACK_QUOTES]);
    }
    return this.pool.splice(0, size);
  }
}

function parseQuotesFromMarkdown(markdown: string): FlameQuote[] {
  const lines = markdown.split(/\r?\n/);
  const seen = new Set<string>();
  const quotes: FlameQuote[] = [];
  let currentSection = "Collection";

  for (const rawLine of lines) {
    const sectionMatch = rawLine.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      currentSection = normalizeSection(sectionMatch[1]);
      continue;
    }

    const bulletMatch = rawLine.match(/^\s*-\s+(.+)\s*$/);
    if (!bulletMatch) {
      continue;
    }

    if (currentSection.toLowerCase().includes("notes")) {
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
    });
  }

  return quotes;
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

export const fromFlameQuoteService: FromFlameQuoteService =
  new MockFromFlameQuoteService();
