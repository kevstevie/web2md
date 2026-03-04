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

  it('SPA — 시맨틱 태그 없을 때 텍스트 밀도 기반으로 본문 div 추출', () => {
    const longText = '이산수학은 연속적이지 않은 이산적인 구조를 연구하는 수학의 한 분야입니다. '.repeat(8);
    const html = `
      <html><body>
        <div id="app">
          <div id="nav">
            <a href="/a">링크A</a><a href="/b">링크B</a><a href="/c">링크C</a>
            <a href="/d">링크D</a><a href="/e">링크E</a>
          </div>
          <div id="content"><p>${longText}</p></div>
          <div id="footer"><a href="/policy">정책</a><a href="/contact">연락</a></div>
        </div>
      </body></html>`;
    const { markdown } = convertHtmlToMarkdown(html);
    expect(markdown).toContain('이산수학은');
  });

  it('SPA — 링크 밀도 높은 네비게이션 div는 본문으로 선택되지 않음', () => {
    const longText = '실제 본문 내용입니다. 이 텍스트는 충분히 길어야 합니다. '.repeat(10);
    const navLinks = Array.from({ length: 20 }, (_, i) => `<a href="/nav${i}">메뉴${i}</a>`).join('');
    const html = `
      <html><body>
        <div id="app">
          <div id="gnb">${navLinks}</div>
          <div id="main-content"><p>${longText}</p></div>
        </div>
      </body></html>`;
    const { markdown } = convertHtmlToMarkdown(html);
    expect(markdown).toContain('실제 본문 내용');
    expect(markdown).not.toMatch(/메뉴\d{1,2}.*메뉴\d{1,2}.*메뉴\d{1,2}/);
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
