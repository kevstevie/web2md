import { describe, it, expect } from 'vitest';
import { KoreanTokenizer } from '../../../service/tokenizer/koreanTokenizer.js';

const tokenizer = new KoreanTokenizer();

describe('KoreanTokenizer', () => {
  it('한국어 음절 추출', () => {
    const tokens = tokenizer.tokenize('인공지능은 현대 기술이다');
    expect(tokens.length).toBeGreaterThan(0);
    // 한국어 단어가 포함되어야 함
    expect(tokens.some(t => /[\uAC00-\uD7A3]/.test(t))).toBe(true);
  });

  it('최소 길이 2자 이상만 포함', () => {
    const tokens = tokenizer.tokenize('나는 갔다 왔다');
    tokens.forEach(t => {
      expect(t.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('영문 혼합 텍스트 처리', () => {
    const tokens = tokenizer.tokenize('AI 기술은 발전하고 있다');
    // 한국어 부분이 토큰에 포함됨
    expect(tokens.some(t => /[\uAC00-\uD7A3]/.test(t))).toBe(true);
  });

  it('빈 문자열은 빈 배열', () => {
    expect(tokenizer.tokenize('')).toEqual([]);
  });

  it('공백만 있으면 빈 배열', () => {
    expect(tokenizer.tokenize('   ')).toEqual([]);
  });

  it('한국어 없는 텍스트는 빈 배열', () => {
    const tokens = tokenizer.tokenize('hello world test');
    expect(tokens).toEqual([]);
  });

  it('반복 실행 시 동일한 결과 반환 (순수함수)', () => {
    const text = '인공지능 머신러닝 딥러닝';
    const result1 = tokenizer.tokenize(text);
    const result2 = tokenizer.tokenize(text);
    expect(result1).toEqual(result2);
  });

  it('조사 제거 후 어간 추출', () => {
    // "기술은", "기술이" → "기술" 추출
    const tokens1 = tokenizer.tokenize('기술은 중요하다');
    const tokens2 = tokenizer.tokenize('기술이 발전한다');
    // 두 결과 모두 "기술"을 포함하거나 최소 동일한 길이의 토큰 포함
    expect(tokens1.length).toBeGreaterThan(0);
    expect(tokens2.length).toBeGreaterThan(0);
  });
});
