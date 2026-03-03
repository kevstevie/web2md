import { describe, it, expect } from 'vitest';
import { convertHtmlToMarkdown } from '../../converter/htmlToMarkdown.js';

describe('convertHtmlToMarkdown — 제목 추출', () => {
  it('<title> 태그 내용을 반환', () => {
    const { title } = convertHtmlToMarkdown('<html><head><title>Hello World</title></head><body><p>content</p></body></html>');
    expect(title).toBe('Hello World');
  });

  it('<title> 없으면 빈 문자열', () => {
    const { title } = convertHtmlToMarkdown('<html><body><p>content</p></body></html>');
    expect(title).toBe('');
  });

  it('<title> 공백만 있으면 빈 문자열', () => {
    const { title } = convertHtmlToMarkdown('<html><head><title>   </title></head><body><p>x</p></body></html>');
    expect(title).toBe('');
  });
});

describe('convertHtmlToMarkdown — 불필요 태그 제거', () => {
  it.each(['script', 'style', 'nav', 'footer', 'header', 'form', 'iframe', 'noscript', 'button'])(
    '<%s> 태그 제거',
    (tag) => {
      const html = `<html><body><main><p>content</p><${tag}>should be removed</${tag}></main></body></html>`;
      const { markdown } = convertHtmlToMarkdown(html);
      expect(markdown).not.toContain('should be removed');
    }
  );

  it('aria-hidden=true 요소 제거', () => {
    const html = '<html><body><main><p>visible</p><span aria-hidden="true">hidden</span></main></body></html>';
    const { markdown } = convertHtmlToMarkdown(html);
    expect(markdown).not.toContain('hidden');
    expect(markdown).toContain('visible');
  });

  it('.ad .advertisement .sidebar .popup .modal .cookie-banner 제거', () => {
    const classes = ['ad', 'advertisement', 'sidebar', 'popup', 'modal', 'cookie-banner'];
    for (const cls of classes) {
      const html = `<html><body><main><p>main</p><div class="${cls}">noise</div></main></body></html>`;
      const { markdown } = convertHtmlToMarkdown(html);
      expect(markdown).not.toContain('noise');
    }
  });

  it('data URI 이미지 제거', () => {
    const html = '<html><body><main><img src="data:image/png;base64,abc123"/><p>text</p></main></body></html>';
    const { markdown } = convertHtmlToMarkdown(html);
    expect(markdown).not.toContain('data:image');
  });
});

describe('convertHtmlToMarkdown — 본문 추출 우선순위', () => {
  it('<main>을 우선 추출', () => {
    const html = `
      <html><body>
        <nav>nav content</nav>
        <main><p>main content</p></main>
        <footer>footer content</footer>
      </body></html>`;
    const { markdown } = convertHtmlToMarkdown(html);
    expect(markdown).toContain('main content');
    expect(markdown).not.toContain('nav content');
    expect(markdown).not.toContain('footer content');
  });

  it('<main> 없으면 <article> 추출', () => {
    const html = '<html><body><article><p>article content</p></article></body></html>';
    const { markdown } = convertHtmlToMarkdown(html);
    expect(markdown).toContain('article content');
  });

  it('[role=main] 추출', () => {
    const html = '<html><body><div role="main"><p>role main content</p></div></body></html>';
    const { markdown } = convertHtmlToMarkdown(html);
    expect(markdown).toContain('role main content');
  });

  it('모두 없으면 <body> 사용', () => {
    const html = '<html><body><p>body content</p></body></html>';
    const { markdown } = convertHtmlToMarkdown(html);
    expect(markdown).toContain('body content');
  });
});

describe('convertHtmlToMarkdown — 마크다운 변환', () => {
  it('헤딩 변환', () => {
    const html = '<html><body><main><h1>Title</h1><h2>Subtitle</h2></main></body></html>';
    const { markdown } = convertHtmlToMarkdown(html);
    expect(markdown).toContain('# Title');
    expect(markdown).toContain('## Subtitle');
  });

  it('링크 변환', () => {
    const html = '<html><body><main><a href="https://example.com">Example</a></main></body></html>';
    const { markdown } = convertHtmlToMarkdown(html);
    expect(markdown).toContain('[Example](https://example.com)');
  });

  it('목록 변환', () => {
    const html = '<html><body><main><ul><li>Item 1</li><li>Item 2</li></ul></main></body></html>';
    const { markdown } = convertHtmlToMarkdown(html);
    // turndown은 '- ' 뒤에 공백을 추가할 수 있으므로 정규식으로 확인
    expect(markdown).toMatch(/^-\s+Item 1/m);
    expect(markdown).toMatch(/^-\s+Item 2/m);
  });

  it('코드 블록 변환', () => {
    const html = '<html><body><main><pre><code>const x = 1;</code></pre></main></body></html>';
    const { markdown } = convertHtmlToMarkdown(html);
    expect(markdown).toContain('```');
    expect(markdown).toContain('const x = 1;');
  });

  it('연속 빈 줄 2개로 압축', () => {
    const html = '<html><body><main><p>A</p><p>B</p></main></body></html>';
    const { markdown } = convertHtmlToMarkdown(html);
    expect(markdown).not.toMatch(/\n{3,}/);
  });

  it('base64 이미지 마크다운 제거', () => {
    const html = '<html><body><main><p>text</p></main></body></html>';
    const { markdown } = convertHtmlToMarkdown(html + '![img](data:image/png;base64,abc)');
    expect(markdown).not.toContain('data:image');
  });
});
