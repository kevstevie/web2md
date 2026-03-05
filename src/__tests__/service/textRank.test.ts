import { describe, it, expect } from 'vitest';
import { rankSentences } from '../../service/textRank.js';
import { SimpleTokenizer } from '../../service/tokenizer/simpleTokenizer.js';
import { getKoreanTokenizer } from '../../service/tokenizer/koreanTokenizer.js';

const tokenizer = new SimpleTokenizer();

describe('rankSentences — 기본 동작', () => {
  it('문장이 2개 이하면 원본 순서 인덱스 반환', () => {
    const result = rankSentences(['First sentence.', 'Second sentence.'], tokenizer);
    expect(result).toEqual(expect.arrayContaining([0, 1]));
    expect(result).toHaveLength(2);
  });

  it('문장이 1개면 [0] 반환', () => {
    const result = rankSentences(['Only one sentence.'], tokenizer);
    expect(result).toEqual([0]);
  });

  it('인덱스 개수가 문장 수와 동일', () => {
    const sentences = Array.from({ length: 10 }, (_, i) => `Sentence number ${i} with content words.`);
    const result = rankSentences(sentences, tokenizer);
    expect(result).toHaveLength(10);
  });

  it('반환 인덱스는 0 ~ n-1 범위', () => {
    const sentences = ['Alpha beta gamma.', 'Delta epsilon zeta.', 'Eta theta iota.'];
    const result = rankSentences(sentences, tokenizer);
    expect(result).toEqual(expect.arrayContaining([0, 1, 2]));
    result.forEach(idx => {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(sentences.length);
    });
  });

  it('모든 인덱스가 중복 없이 포함', () => {
    const sentences = Array.from({ length: 5 }, (_, i) => `Test sentence ${i} content.`);
    const result = rankSentences(sentences, tokenizer);
    expect(new Set(result).size).toBe(sentences.length);
  });
});

describe('rankSentences — 주제 중요도', () => {
  it('공통 토큰 많은 문장이 높은 순위', () => {
    const sentences = [
      'Authentication uses JWT tokens for secure access.',    // 핵심 주제
      'JWT tokens must have an expiration time set.',         // 핵심 주제
      'Token-based authentication is the standard method.',  // 핵심 주제
      'The weather is nice today outside.',                   // 무관
    ];
    const ranked = rankSentences(sentences, tokenizer);
    const weatherRank = ranked.indexOf(3);
    const topThreeRanks = [0, 1, 2].map(i => ranked.indexOf(i));
    expect(topThreeRanks.every(r => r < weatherRank)).toBe(true);
  });

  it('한국어 문장 주제 중요도', async () => {
    const koreanTokenizer = await getKoreanTokenizer();
    const sentences = [
      '인공지능은 현대 기술의 핵심 분야이다.',
      '인공지능과 머신러닝은 데이터를 기반으로 학습한다.',
      '딥러닝 모델은 인공지능 발전을 이끌고 있다.',
      '오늘 날씨가 맑고 화창하다.',
    ];
    const ranked = rankSentences(sentences, koreanTokenizer);
    const weatherRank = ranked.indexOf(3);
    const aiRanks = [0, 1, 2].map(i => ranked.indexOf(i));
    expect(aiRanks.every(r => r < weatherRank)).toBe(true);
  });

  it('공통 토큰 없는 문장은 모두 동일한 순위 집합 반환', () => {
    const sentences = [
      'Apple banana cherry delta.',
      'Foxtrot golf hotel india.',
      'Kilo lima mike november.',
    ];
    const result = rankSentences(sentences, tokenizer);
    expect(new Set(result)).toEqual(new Set([0, 1, 2]));
  });
});
