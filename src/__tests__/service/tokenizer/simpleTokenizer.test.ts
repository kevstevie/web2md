import { describe, it, expect } from 'vitest';
import { SimpleTokenizer } from '../../../service/tokenizer/simpleTokenizer.js';

const tokenizer = new SimpleTokenizer();

describe('SimpleTokenizer', () => {
  it('영어 단어를 토큰으로 분리', () => {
    const tokens = tokenizer.tokenize('Hello world testing');
    expect(tokens).toContain('hello');
    expect(tokens).toContain('world');
    expect(tokens).toContain('testing');
  });

  it('3자 미만 단어 제외', () => {
    const tokens = tokenizer.tokenize('a be cat dog elephant');
    expect(tokens).not.toContain('a');
    expect(tokens).not.toContain('be');
    expect(tokens).toContain('cat');
    expect(tokens).toContain('dog');
    expect(tokens).toContain('elephant');
  });

  it('stop words 제거', () => {
    const tokens = tokenizer.tokenize('the and for are but not you all can');
    expect(tokens).toHaveLength(0);
  });

  it('소문자로 정규화', () => {
    const tokens = tokenizer.tokenize('Apple BANANA Cherry');
    expect(tokens).toContain('apple');
    expect(tokens).toContain('banana');
    expect(tokens).toContain('cherry');
  });

  it('숫자와 특수문자 제외', () => {
    const tokens = tokenizer.tokenize('test123 hello! world?');
    expect(tokens).toContain('test');
    expect(tokens).toContain('hello');
    expect(tokens).toContain('world');
    expect(tokens).not.toContain('123');
  });

  it('빈 문자열은 빈 배열', () => {
    expect(tokenizer.tokenize('')).toEqual([]);
  });

  it('stop word만 있으면 빈 배열', () => {
    expect(tokenizer.tokenize('the and for from with')).toEqual([]);
  });

  it('의미있는 단어는 유지', () => {
    const tokens = tokenizer.tokenize('authentication security database algorithm');
    expect(tokens).toContain('authentication');
    expect(tokens).toContain('security');
    expect(tokens).toContain('database');
    expect(tokens).toContain('algorithm');
  });
});
