import type { Tokenizer } from './types.js';

// Korean particles and endings to strip (조사/어미)
// Common postpositional particles
const PARTICLES = [
  '이가', '을를', '은는', '의', '에서', '에게', '한테', '으로', '로',
  '와과', '이나', '나', '이고', '고', '이며', '며', '이지만', '지만',
  '이어서', '이라서', '이라고', '이라는', '이란', '이라는',
  '에', '이', '가', '을', '를', '은', '는', '도', '만', '까지',
  '부터', '보다', '처럼', '같이', '마다', '이라도', '라도',
];

const SUFFIX_PATTERN = new RegExp(
  `(${PARTICLES.sort((a, b) => b.length - a.length).join('|')})$`,
  'u'
);

// Korean syllable range: \uAC00-\uD7A3
const KOREAN_WORD_PATTERN = /[\uAC00-\uD7A3\u3131-\u314e\u314f-\u3163]+/gu;
const MIN_LENGTH = 2;

export class KoreanTokenizer implements Tokenizer {
  tokenize(text: string): string[] {
    const tokens: string[] = [];

    // Split by whitespace to get word-like units
    const words = text.split(/\s+/);
    for (const word of words) {
      const koreanParts = word.match(KOREAN_WORD_PATTERN);
      if (!koreanParts) continue;

      for (const part of koreanParts) {
        // Strip trailing particles
        const stem = part.replace(SUFFIX_PATTERN, '');
        const candidate = stem.length >= MIN_LENGTH ? stem : part;
        if (candidate.length >= MIN_LENGTH) {
          tokens.push(candidate);
        }
      }
    }

    return tokens;
  }
}
