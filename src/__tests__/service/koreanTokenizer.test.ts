import { beforeAll, describe, expect, it } from 'vitest';
import { getKoreanTokenizer } from '../../service/tokenizer/koreanTokenizer.js';
import type { Tokenizer } from '../../service/tokenizer/types.js';

let tokenizer: Tokenizer;

beforeAll(async () => {
  tokenizer = await getKoreanTokenizer();
});

describe('KoreanTokenizer (kuromoji-ko)', () => {
  it('조사/어미보다 핵심 형태소를 우선 추출한다', () => {
    const tokens = tokenizer.tokenize('인공지능은 현대 기술의 핵심 분야입니다.');

    expect(tokens).toContain('인공지능');
    expect(tokens).toContain('현대');
    expect(tokens).toContain('기술');
    expect(tokens).toContain('핵심');
    expect(tokens).toContain('분야');
    expect(tokens).not.toContain('은');
    expect(tokens).not.toContain('의');
  });

  it('용언은 기본형(lemma)으로 정규화한다', () => {
    const tokens = tokenizer.tokenize('학생들이 밥을 먹었습니다.');
    expect(tokens).toContain('먹다');
    expect(tokens).not.toContain('먹었습니다');
  });
});
