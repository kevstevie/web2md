import { describe, it, expect } from 'vitest';
import { summarize } from '../../service/summarizer.js';

// 긴 마크다운 생성 헬퍼
function makeLongMarkdown(sections = 50): string {
  return Array.from({ length: sections }, (_, i) =>
    `## Section ${i + 1}\nThis is a long paragraph for section ${i + 1} with enough text to fill the space properly and provide context.`
  ).join('\n\n');
}

describe('summarize — level별 길이 제한', () => {
  it('level 1 결과가 1000자 이하', () => {
    const result = summarize(makeLongMarkdown(), 1);
    expect(result.length).toBeLessThanOrEqual(1000);
  });

  it('level 2 결과가 2000자 이하', () => {
    const result = summarize(makeLongMarkdown(), 2);
    expect(result.length).toBeLessThanOrEqual(2000);
  });

  it('level 5 결과가 8000자 이하', () => {
    const result = summarize(makeLongMarkdown(), 5);
    expect(result.length).toBeLessThanOrEqual(8000);
  });

  it('level 1이 level 5보다 짧음', () => {
    const md = makeLongMarkdown();
    expect(summarize(md, 1).length).toBeLessThan(summarize(md, 5).length);
  });

  it('level 기본값(3)은 비어있지 않음', () => {
    const result = summarize('# Title\nThis is a sample sentence for testing purposes.');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('summarize — 헤딩 보존', () => {
  it('섹션 헤딩 포함', () => {
    const md = '# Introduction\nThis is the introduction content for testing purposes.\n## Features\nThis feature section describes all available features clearly.';
    const result = summarize(md);
    expect(result).toContain('# Introduction');
    expect(result).toContain('## Features');
  });

  it('헤딩만 있고 본문 없는 경우 헤딩 유지', () => {
    const md = '## Steps\n- Step one is here\n- Step two is here\n- Step three is here';
    const result = summarize(md);
    expect(result).toContain('## Steps');
  });
});

describe('summarize — 목록 보존', () => {
  it('리스트 아이템 보존', () => {
    const md = '## Features\nSome introductory text for this section.\n- Feature one is very useful\n- Feature two is also great\n- Feature three rounds it out';
    const result = summarize(md);
    expect(result).toContain('- Feature one is very useful');
    expect(result).toContain('- Feature two is also great');
  });

  it('번호 목록도 보존', () => {
    const md = '## Steps\n1. First step is important\n2. Second step follows\n3. Third step completes';
    const result = summarize(md);
    expect(result).toContain('1. First step is important');
  });
});

describe('summarize — 코드 블록 처리', () => {
  it('코드 블록 내용은 요약에서 제외', () => {
    const md = '# Usage\nInstall the library first with proper configuration.\n```kotlin\nval x = doSomething()\nprintln(x)\n```\nThen configure it as needed.';
    const result = summarize(md);
    expect(result).not.toContain('val x = doSomething()');
    expect(result).not.toContain('println(x)');
  });
});

describe('summarize — 엣지 케이스', () => {
  it('빈 문자열은 빈 문자열 반환', () => {
    expect(summarize('')).toBe('');
  });

  it('산문 없는 헤딩만 있어도 구조 반환', () => {
    const md = '# Title Only\n## Another Section';
    const result = summarize(md);
    expect(result.length).toBeGreaterThan(0);
  });

  it('maxChars 초과하면 첫 페이지만 반환', () => {
    const md = makeLongMarkdown(100);
    const result = summarize(md, 1);
    expect(result.length).toBeLessThanOrEqual(1000);
  });

  it('짧은 마크다운은 전체 반환', () => {
    const md = '# Title\nShort content.';
    const result = summarize(md, 5);
    expect(result).toContain('Title');
  });

  it('level 0 → level 1로 clamp', () => {
    const result = summarize(makeLongMarkdown(), 0);
    expect(result.length).toBeLessThanOrEqual(1000);
  });

  it('level 6 → level 5로 clamp', () => {
    const result = summarize(makeLongMarkdown(), 6);
    expect(result.length).toBeLessThanOrEqual(8000);
  });

  it('중복 텍스트 문장도 올바르게 처리', () => {
    // 동일 텍스트가 여러 섹션에 있어도 각각 독립 처리
    const md = '# Section A\nThis sentence appears in section A.\n# Section B\nThis sentence appears in section A.';
    const result = summarize(md);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('summarize — 한국어', () => {
  it('한국어 텍스트 요약', () => {
    const md = '# 제목\n인공지능은 현대 기술의 핵심 분야입니다. 머신러닝과 딥러닝이 발전하고 있습니다. 데이터 기반 학습이 중요합니다.';
    const result = summarize(md);
    expect(result.length).toBeGreaterThan(0);
  });
});
