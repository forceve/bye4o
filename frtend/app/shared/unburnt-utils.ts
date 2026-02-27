import type { UnburntMessage } from "../../services/unburntApiService";

type UnburntLineSegment = {
  start: number;
  end: number;
  content: string;
};

export function splitUnburntRawText(value: string): string[] {
  const normalized = value.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  if (!lines.some((line) => line.trim())) {
    return [];
  }
  return lines;
}

export function buildMessagesFromLines(
  lines: string[],
  boundaries: number[],
  existingMessages: UnburntMessage[] = [],
  previousBoundaries?: number[]
): UnburntMessage[] {
  if (!lines.length) {
    return [];
  }

  const nextSegments = buildUnburntLineSegments(lines, boundaries);
  if (!nextSegments.length) {
    return [];
  }

  const previousSegments =
    existingMessages.length && Array.isArray(previousBoundaries)
      ? buildUnburntLineSegments(lines, previousBoundaries)
      : [];

  const output: UnburntMessage[] = [];
  for (const segment of nextSegments) {
    const preserved = resolvePreservedMessageForSegment(segment, previousSegments, existingMessages);
    const previousRole = output.at(-1)?.role;
    const fallbackRole: UnburntMessage["role"] =
      previousRole === "user" ? "4o" : previousRole === "4o" ? "user" : "user";

    output.push({
      role: preserved?.role ?? fallbackRole,
      content: preserved?.content ?? segment.content,
      order: output.length + 1,
    });
  }

  return output;
}

function buildUnburntLineSegments(lines: string[], boundaries: number[]): UnburntLineSegment[] {
  if (!lines.length) {
    return [];
  }

  const normalizedBoundaries = Array.from(
    new Set(
      boundaries.filter((item) => Number.isInteger(item) && item > 0 && item < lines.length)
    )
  ).sort((left, right) => left - right);
  const points = [...normalizedBoundaries, lines.length];
  const output: UnburntLineSegment[] = [];
  let start = 0;

  for (const point of points) {
    const segmentStart = start;
    const content = lines.slice(segmentStart, point).join("\n").trim();
    start = point;
    if (!content) {
      continue;
    }
    output.push({
      start: segmentStart,
      end: point,
      content,
    });
  }

  return output;
}

function resolvePreservedMessageForSegment(
  nextSegment: UnburntLineSegment,
  previousSegments: UnburntLineSegment[],
  existingMessages: UnburntMessage[]
): { role?: UnburntMessage["role"]; content?: string } | null {
  if (!previousSegments.length || !existingMessages.length) {
    return null;
  }

  const exactIndex = previousSegments.findIndex(
    (segment) => segment.start === nextSegment.start && segment.end === nextSegment.end
  );
  if (exactIndex >= 0 && exactIndex < existingMessages.length) {
    const current = existingMessages[exactIndex];
    const trimmed = typeof current.content === "string" ? current.content.trim() : "";
    return {
      role: current.role === "4o" ? "4o" : "user",
      content: trimmed || nextSegment.content,
    };
  }

  const containerIndex = previousSegments.findIndex(
    (segment) => segment.start <= nextSegment.start && segment.end >= nextSegment.end
  );
  if (containerIndex >= 0 && containerIndex < existingMessages.length) {
    const container = previousSegments[containerIndex];
    const containerMessage = existingMessages[containerIndex];
    const lineOffsetStart = nextSegment.start - container.start;
    const lineOffsetEnd = nextSegment.end - container.start;
    const slicedContent = sliceMessageByLineOffsets(
      typeof containerMessage.content === "string" ? containerMessage.content : "",
      lineOffsetStart,
      lineOffsetEnd,
      container.end - container.start
    );
    return {
      role:
        lineOffsetStart === 0
          ? containerMessage.role === "4o"
            ? "4o"
            : "user"
          : undefined,
      content: slicedContent ?? nextSegment.content,
    };
  }

  return null;
}

function sliceMessageByLineOffsets(
  value: string,
  startOffset: number,
  endOffset: number,
  expectedLineCount: number
): string | null {
  if (
    startOffset < 0 ||
    endOffset <= startOffset ||
    expectedLineCount <= 0 ||
    endOffset > expectedLineCount
  ) {
    return null;
  }

  const lines = value.replace(/\r\n?/g, "\n").split("\n");
  if (lines.length < expectedLineCount) {
    return null;
  }

  const content = lines.slice(startOffset, endOffset).join("\n").trim();
  return content || null;
}

export function normalizeUnburntMessagesForSave(messages: UnburntMessage[]): UnburntMessage[] {
  return messages
    .map<UnburntMessage>((message) => ({
      role: message.role === "4o" ? "4o" : "user",
      content: message.content.trim(),
      order: message.order,
    }))
    .filter((message) => Boolean(message.content))
    .map<UnburntMessage>((message, index) => ({
      ...message,
      order: index + 1,
    }));
}

export function deriveUnburntTitleFromMessages(messages: UnburntMessage[]): string {
  const first = messages[0]?.content.trim() ?? "";
  if (!first) {
    return "";
  }

  const firstLine = first.split("\n")[0]?.trim() ?? first;
  const sentence = firstLine.split(/[。！？.!?]/)[0]?.trim() ?? firstLine;
  const title = sentence || firstLine;
  if (title.length <= 64) {
    return title;
  }

  return `${title.slice(0, 64).trimEnd()}...`;
}

export function parseUnburntTagsInput(value: string): string[] {
  const seen = new Set<string>();
  return value
    .split(/[,\n，]/g)
    .map((item) => item.trim())
    .filter((item) => {
      if (!item) {
        return false;
      }
      const key = item.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}
