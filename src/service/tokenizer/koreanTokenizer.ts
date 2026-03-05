import path from 'node:path';
import { createRequire } from 'node:module';
import { MeCab } from 'kuromoji-ko';
import type { Tokenizer } from './types.js';

const require = createRequire(import.meta.url);

const MIN_LENGTH = 2;
const TOKEN_EDGE_PUNCTUATION = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

// Content-heavy POS tags we keep for ranking
const CONTENT_POS = new Set([
  'NNG', 'NNP', 'NNB', 'NR', 'NP',
  'VV', 'VA', 'VX', 'VCP', 'VCN',
  'MAG', 'MAJ', 'XR',
  'SL', 'SH', 'SN',
]);

const KOREAN_WORD_PATTERN = /[\uAC00-\uD7A3\u3131-\u314e\u314f-\u3163]+/gu;

interface ParsedToken {
  surface: string;
  pos: string[];
  lemma: string;
}

type ParseKoreanText = (text: string) => ParsedToken[];

class RegexFallbackKoreanTokenizer implements Tokenizer {
  tokenize(text: string): string[] {
    const matches = text.match(KOREAN_WORD_PATTERN) ?? [];
    return matches.filter(token => token.length >= MIN_LENGTH);
  }
}

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .replace(TOKEN_EDGE_PUNCTUATION, '')
    .trim();
}

function isContentToken(pos: string[]): boolean {
  return pos.some(tag => CONTENT_POS.has(tag));
}

function resolveKuromojiDictPath(): string {
  const entryPath = require.resolve('kuromoji-ko');
  // kuromoji-ko entry points to .../dist/index.{js|cjs}
  return path.resolve(path.dirname(entryPath), '..', 'dict');
}

async function createMorphParser(): Promise<ParseKoreanText | null> {
  try {
    const dictPath = resolveKuromojiDictPath();
    const mecab = await MeCab.create({ engine: 'ko', dictPath });
    return (text: string) => mecab.parse(text) as ParsedToken[];
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    process.stderr.write(`[web2md] kuromoji-ko init failed, fallback tokenizer enabled: ${reason}\n`);
    return null;
  }
}

export class KoreanTokenizer implements Tokenizer {
  private readonly fallback = new RegexFallbackKoreanTokenizer();

  constructor(private readonly parseKoreanText: ParseKoreanText | null = null) {}

  static async create(): Promise<KoreanTokenizer> {
    const parseKoreanText = await createMorphParser();
    return new KoreanTokenizer(parseKoreanText);
  }

  tokenize(text: string): string[] {
    if (!this.parseKoreanText) {
      return this.fallback.tokenize(text);
    }

    const candidates: string[] = [];
    for (const token of this.parseKoreanText(text)) {
      if (!isContentToken(token.pos)) continue;
      const normalized = normalizeToken(token.lemma || token.surface);
      if (normalized.length >= MIN_LENGTH) {
        candidates.push(normalized);
      }
    }

    return candidates.length > 0 ? candidates : this.fallback.tokenize(text);
  }
}

let koreanTokenizerPromise: Promise<KoreanTokenizer> | null = null;

export function getKoreanTokenizer(): Promise<KoreanTokenizer> {
  if (!koreanTokenizerPromise) {
    koreanTokenizerPromise = KoreanTokenizer.create();
  }
  return koreanTokenizerPromise;
}
