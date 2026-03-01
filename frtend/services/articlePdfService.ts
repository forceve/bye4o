import { PDFDocument, PageSizes, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export interface BuildArticlePdfOptions {
  title: string;
  markdown: string;
  locale: "zh-CN" | "en-US";
  author?: string;
  publishedAt?: string;
}

const FONT_URL = "/fonts/NotoSansCJKsc-Regular.otf";

interface ParsedBlock {
  type: "heading" | "paragraph" | "quote" | "ul-item" | "ol-item" | "code";
  text: string;
  level?: 1 | 2 | 3;
  index?: number;
}

let fontBytesPromise: Promise<Uint8Array> | null = null;

export async function buildArticlePdfBlob(options: BuildArticlePdfOptions): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontBytes = await loadFontBytes();
  const font = await pdfDoc.embedFont(fontBytes, { subset: true });

  const pageWidth = PageSizes.A4[0];
  const pageHeight = PageSizes.A4[1];
  const marginX = 52;
  const marginTop = 58;
  const marginBottom = 54;
  const contentWidth = pageWidth - marginX * 2;

  let page = pdfDoc.addPage(PageSizes.A4);
  let cursorY = pageHeight - marginTop;

  const nextPage = () => {
    page = pdfDoc.addPage(PageSizes.A4);
    cursorY = pageHeight - marginTop;
  };

  const ensureSpace = (height: number) => {
    if (cursorY - height >= marginBottom) {
      return;
    }
    nextPage();
  };

  const drawWrapped = (
    text: string,
    size: number,
    color: { r: number; g: number; b: number },
    indentX = 0,
    lineHeightMultiplier = 1.62
  ) => {
    const maxWidth = contentWidth - indentX;
    const lines = splitTextIntoLines(text, font, size, maxWidth);
    const lineHeight = size * lineHeightMultiplier;
    for (const line of lines) {
      ensureSpace(lineHeight);
      page.drawText(line, {
        x: marginX + indentX,
        y: cursorY,
        size,
        font,
        color: rgb(color.r, color.g, color.b),
      });
      cursorY -= lineHeight;
    }
  };

  const drawGap = (value: number) => {
    cursorY -= value;
  };

  drawWrapped(options.title.trim(), 22, { r: 0.16, g: 0.16, b: 0.16 }, 0, 1.36);
  drawGap(8);

  const metaLine = buildMetaLine(options.locale, options.author, options.publishedAt);
  if (metaLine) {
    drawWrapped(metaLine, 11, { r: 0.32, g: 0.32, b: 0.32 }, 0, 1.45);
    drawGap(10);
  }

  const blocks = parseMarkdownBlocks(options.markdown);
  for (const block of blocks) {
    if (block.type === "heading") {
      const size = block.level === 1 ? 18 : block.level === 2 ? 15 : 13;
      ensureSpace(size * 1.8);
      drawGap(4);
      drawWrapped(block.text, size, { r: 0.1, g: 0.1, b: 0.1 }, 0, 1.42);
      drawGap(4);
      continue;
    }

    if (block.type === "paragraph") {
      drawWrapped(block.text, 11.5, { r: 0.15, g: 0.15, b: 0.15 }, 0, 1.75);
      drawGap(6);
      continue;
    }

    if (block.type === "quote") {
      const quoteText = block.text.trim();
      const quoteLines = splitTextIntoLines(quoteText, font, 11, contentWidth - 14);
      const quoteLineHeight = 11 * 1.72;
      const quoteHeight = quoteLines.length * quoteLineHeight + 8;
      ensureSpace(quoteHeight);
      const topY = cursorY + 3;
      const bottomY = cursorY - (quoteLines.length - 1) * quoteLineHeight - 3;
      page.drawLine({
        start: { x: marginX + 2, y: topY },
        end: { x: marginX + 2, y: bottomY },
        thickness: 1,
        color: rgb(0.52, 0.52, 0.52),
      });
      drawWrapped(quoteText, 11, { r: 0.28, g: 0.28, b: 0.28 }, 10, 1.72);
      drawGap(6);
      continue;
    }

    if (block.type === "ul-item" || block.type === "ol-item") {
      const marker = block.type === "ol-item" ? `${block.index}. ` : "- ";
      const content = `${marker}${block.text}`;
      drawWrapped(content, 11.2, { r: 0.16, g: 0.16, b: 0.16 }, 2, 1.7);
      drawGap(4);
      continue;
    }

    if (block.type === "code") {
      const lines = block.text.split("\n").filter(Boolean);
      const codeSize = 10.4;
      const codeLineHeight = codeSize * 1.58;
      const codePaddingX = 8;
      const codePaddingY = 8;
      const blockHeight = lines.length * codeLineHeight + codePaddingY * 2;
      ensureSpace(blockHeight + 8);
      page.drawRectangle({
        x: marginX,
        y: cursorY - blockHeight + 4,
        width: contentWidth,
        height: blockHeight,
        color: rgb(0.94, 0.94, 0.94),
      });

      let localY = cursorY - codePaddingY;
      for (const line of lines) {
        const wrapped = splitTextIntoLines(line, font, codeSize, contentWidth - codePaddingX * 2, {
          preserveWhitespace: true,
        });
        for (const part of wrapped) {
          ensureSpace(codeLineHeight);
          page.drawText(part, {
            x: marginX + codePaddingX,
            y: localY,
            size: codeSize,
            font,
            color: rgb(0.2, 0.2, 0.2),
          });
          localY -= codeLineHeight;
          cursorY = localY;
        }
      }
      drawGap(8);
    }
  }

  const bytes = await pdfDoc.save();
  const output = new Uint8Array(bytes.length);
  output.set(bytes);
  return new Blob([output], { type: "application/pdf" });
}

export async function downloadArticlePdf(
  options: BuildArticlePdfOptions,
  fileName: string
): Promise<void> {
  const blob = await buildArticlePdfBlob(options);
  const href = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = fileName;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(href), 2000);
  }
}

async function loadFontBytes(): Promise<Uint8Array> {
  if (!fontBytesPromise) {
    fontBytesPromise = fetch(FONT_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load PDF font.");
        }
        return response.arrayBuffer();
      })
      .then((buffer) => new Uint8Array(buffer));
  }

  return fontBytesPromise;
}

function parseMarkdownBlocks(markdown: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const stripped = stripFrontMatter(markdown);
  const lines = stripped.replace(/\r\n/g, "\n").split("\n");
  let paragraphBuffer: string[] = [];
  let inCode = false;
  let codeBuffer: string[] = [];
  let orderedIndex = 1;

  const flushParagraph = () => {
    if (!paragraphBuffer.length) {
      return;
    }
    const text = normalizeInlineMarkdown(paragraphBuffer.join(" ").trim());
    if (text) {
      blocks.push({ type: "paragraph", text });
    }
    paragraphBuffer = [];
  };

  const flushCode = () => {
    if (!codeBuffer.length) {
      return;
    }
    blocks.push({
      type: "code",
      text: codeBuffer.join("\n"),
    });
    codeBuffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trimEnd();
    const clean = trimmed.trim();

    if (/^```/.test(clean)) {
      flushParagraph();
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(trimmed.replace(/\t/g, "  "));
      continue;
    }

    if (!clean) {
      flushParagraph();
      orderedIndex = 1;
      continue;
    }

    const heading = clean.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      orderedIndex = 1;
      blocks.push({
        type: "heading",
        level: heading[1].length as 1 | 2 | 3,
        text: normalizeInlineMarkdown(heading[2]),
      });
      continue;
    }

    const quote = clean.match(/^>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      orderedIndex = 1;
      blocks.push({
        type: "quote",
        text: normalizeInlineMarkdown(quote[1]),
      });
      continue;
    }

    const unordered = clean.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      orderedIndex = 1;
      blocks.push({
        type: "ul-item",
        text: normalizeInlineMarkdown(unordered[1]),
      });
      continue;
    }

    const ordered = clean.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      blocks.push({
        type: "ol-item",
        index: orderedIndex,
        text: normalizeInlineMarkdown(ordered[1]),
      });
      orderedIndex += 1;
      continue;
    }

    paragraphBuffer.push(clean);
  }

  if (inCode) {
    flushCode();
  }
  flushParagraph();

  return blocks;
}

function stripFrontMatter(markdown: string): string {
  const normalized = markdown.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return normalized;
  }
  const endIndex = normalized.indexOf("\n---\n", 4);
  if (endIndex === -1) {
    return normalized;
  }
  return normalized.slice(endIndex + 5);
}

function normalizeInlineMarkdown(value: string): string {
  const stripped = value
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1 ($2)")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return stripped;
}

function splitTextIntoLines(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
  options: {
    preserveWhitespace?: boolean;
  } = {}
): string[] {
  const normalized = options.preserveWhitespace
    ? text.replace(/\r/g, "").replace(/\t/g, "  ")
    : text.replace(/\s+/g, " ").trim();
  if (!normalized.trim()) {
    return [""];
  }

  const lines: string[] = [];
  let current = "";

  for (const char of Array.from(normalized)) {
    const candidate = current + char;
    const candidateWidth = font.widthOfTextAtSize(candidate, fontSize);
    if (candidateWidth <= maxWidth || current.length === 0) {
      current = candidate;
      continue;
    }

    lines.push(options.preserveWhitespace ? current : current.trimEnd());
    current = options.preserveWhitespace ? char : char.trimStart();
  }

  if (current) {
    lines.push(options.preserveWhitespace ? current : current.trimEnd());
  }

  return lines.length > 0 ? lines : [options.preserveWhitespace ? normalized : normalized.trim()];
}

function buildMetaLine(
  locale: BuildArticlePdfOptions["locale"],
  author?: string,
  publishedAt?: string
): string {
  const parts: string[] = [];
  if (author?.trim()) {
    parts.push(locale === "zh-CN" ? `作者：${author.trim()}` : `Author: ${author.trim()}`);
  }
  if (publishedAt?.trim()) {
    const label = locale === "zh-CN" ? "发布" : "Published";
    parts.push(`${label}: ${publishedAt.trim()}`);
  }

  return parts.join("  ·  ");
}
