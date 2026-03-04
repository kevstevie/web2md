import type { Tokenizer } from './types.js';

const WORD_PATTERN = /[a-zA-Z]{3,}/g;

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can',
  'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has',
  'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see',
  'two', 'who', 'boy', 'did', 'own', 'say', 'she', 'too', 'use',
  'that', 'this', 'with', 'have', 'from', 'they', 'will', 'been',
  'were', 'when', 'what', 'your', 'each', 'more', 'also', 'into',
  'than', 'then', 'some', 'time', 'very', 'just', 'know', 'take',
  'people', 'because', 'about', 'which', 'there', 'their', 'would',
  'could', 'should', 'other', 'after', 'think', 'these', 'those',
]);

export class SimpleTokenizer implements Tokenizer {
  tokenize(text: string): string[] {
    const matches = text.toLowerCase().match(WORD_PATTERN) ?? [];
    return matches.filter(w => !STOP_WORDS.has(w));
  }
}
