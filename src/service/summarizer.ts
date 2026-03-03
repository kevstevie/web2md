import { rankSentences } from './textRank.js';
import { SimpleTokenizer } from './tokenizer/simpleTokenizer.js';
import { KoreanTokenizer } from './tokenizer/koreanTokenizer.js';
import type { Tokenizer } from './tokenizer/types.js';

const MIN_SUMMARY_SENTENCES = 3;
const MIN_SENTENCE_LENGTH = 15;

const CODE_BLOCK = /```[\s\S]*?```/g;
const INLINE_CODE = /`[^`]+`/g;
const HEADING = /^#{1,6}\s+.+/;
const LIST_ITEM = /^\s*[-*+]\s+.+|^\s*\d+\.\s+.+/;
const TABLE_ROW = /^\s*\|.*\|\s*$/;
const SENTENCE_BOUNDARY = /(?<=[.!?。？！]\s?)(?=\S)/u;

// Korean character range detection
const KOREAN_CHAR = /[\uAC00-\uD7A3]/;

function levelToMaxChars(level: number): number {
  const clamped = Math.max(1, Math.min(5, level));
  switch (clamped) {
    case 1: return 1000;
    case 2: return 2000;
    case 3: return 3000;
    case 4: return 5000;
    default: return 8000;
  }
}

function levelToTopPercent(level: number): number {
  const clamped = Math.max(1, Math.min(5, level));
  switch (clamped) {
    case 1: return 15;
    case 2: return 25;
    case 3: return 35;
    case 4: return 50;
    default: return 70;
  }
}

function detectTokenizer(text: string): Tokenizer {
  const koreanRatio = (text.match(KOREAN_CHAR) ?? []).length / Math.max(text.length, 1);
  return koreanRatio > 0.1 ? new KoreanTokenizer() : new SimpleTokenizer();
}

interface Section {
  heading: string;
  body: string[];
}

function parseSections(lines: string[]): Section[] {
  const sections: Section[] = [];
  let heading = '';
  let body: string[] = [];

  function flush() {
    if (heading.trim() || body.some(l => l.trim())) {
      sections.push({ heading, body: [...body] });
    }
    body = [];
  }

  for (const line of lines) {
    if (HEADING.test(line)) {
      flush();
      heading = line;
    } else {
      body.push(line);
    }
  }
  flush();
  return sections;
}

function splitSentences(text: string): string[] {
  return text
    .split(SENTENCE_BOUNDARY)
    .map(s => s.trim())
    .filter(s => s.length >= MIN_SENTENCE_LENGTH);
}

function extractProseSentences(body: string[]): string[] {
  const result: string[] = [];
  for (const line of body) {
    if (!line.trim() || LIST_ITEM.test(line) || TABLE_ROW.test(line)) continue;
    const cleaned = line.replace(INLINE_CODE, '').trim();
    if (!cleaned) continue;
    const parts = splitSentences(cleaned);
    if (parts.length > 0) {
      result.push(...parts);
    } else if (cleaned.length >= MIN_SENTENCE_LENGTH) {
      // Lines without sentence boundaries (e.g. Korean) → treat as one sentence
      result.push(cleaned);
    }
  }
  return result;
}

function renderSection(section: Section, importantSentences: string[]): string {
  let out = '';
  if (section.heading.trim()) {
    out += section.heading + '\n\n';
  }
  if (importantSentences.length > 0) {
    out += importantSentences.join(' ') + '\n\n';
  }
  const listItems = section.body.filter(l => LIST_ITEM.test(l));
  if (listItems.length > 0) {
    out += listItems.join('\n') + '\n\n';
  }
  return out;
}

function buildSummary(
  sections: Section[],
  importantBySect: Map<number, string[]>,
  maxChars: number
): string {
  let result = '';
  for (let i = 0; i < sections.length; i++) {
    const chunk = renderSection(sections[i], importantBySect.get(i) ?? []);
    if (result.length > 0 && result.length + chunk.length > maxChars) break;
    result += chunk;
  }
  return result.trim();
}

function buildStructureOnly(sections: Section[], maxChars: number): string {
  let result = '';
  for (const section of sections) {
    const chunk = renderSection(section, []);
    if (result.length > 0 && result.length + chunk.length > maxChars) break;
    result += chunk;
  }
  return result.trim();
}

export function summarize(markdown: string, level: number = 3): string {
  const maxChars = levelToMaxChars(level);
  const topPercent = levelToTopPercent(level);

  const cleaned = markdown.replace(CODE_BLOCK, '');
  const sections = parseSections(cleaned.split('\n'));

  // Collect prose sentences with section index
  const indexed: Array<[number, string]> = [];
  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    for (const sent of extractProseSentences(sections[sIdx].body)) {
      indexed.push([sIdx, sent]);
    }
  }

  if (indexed.length === 0) {
    return buildStructureOnly(sections, maxChars) || markdown.slice(0, maxChars).trim();
  }

  const tokenizer = detectTokenizer(indexed.map(([, s]) => s).join(' '));
  const sentences = indexed.map(([, s]) => s);
  const topK = Math.max(MIN_SUMMARY_SENTENCES, Math.floor(indexed.length * topPercent / 100));

  const rankedIndices = rankSentences(sentences, tokenizer).slice(0, topK);
  // Use index-based tracking to handle duplicate sentence text correctly
  const importantIndices = new Set(rankedIndices);

  const importantBySect = new Map<number, string[]>();
  for (let i = 0; i < indexed.length; i++) {
    if (importantIndices.has(i)) {
      const [sIdx, sent] = indexed[i];
      const existing = importantBySect.get(sIdx) ?? [];
      importantBySect.set(sIdx, [...existing, sent]);
    }
  }

  return (
    buildSummary(sections, importantBySect, maxChars) ||
    buildStructureOnly(sections, maxChars) ||
    markdown.slice(0, maxChars).trim()
  );
}
