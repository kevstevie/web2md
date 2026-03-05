import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvalidUrlError, FetchFailedError } from '../../utils/errors.js';

// fetcher factory mock
vi.mock('../../fetcher/index.js', () => ({
  createFetcher: vi.fn(),
}));

// converter mock
vi.mock('../../converter/htmlToMarkdown.js', () => ({
  convertHtmlToMarkdown: vi.fn(),
}));

// summarizer mock
vi.mock('../../service/summarizer.js', () => ({
  summarize: vi.fn(),
}));

import { createFetcher } from '../../fetcher/index.js';
import { convertHtmlToMarkdown } from '../../converter/htmlToMarkdown.js';
import { summarize } from '../../service/summarizer.js';
import { webToMarkdownHandler } from '../../tool/webToMarkdown.js';

class MockPlaywrightFetcher {
  fetch = vi.fn();
}

const mockFetcher = new MockPlaywrightFetcher();
const mockCreateFetcher = vi.mocked(createFetcher);
const mockConvert = vi.mocked(convertHtmlToMarkdown);
const mockSummarize = vi.mocked(summarize);

const SAMPLE_CONTENT = 'This is sample content for testing the web to markdown conversion tool.';
const SAMPLE_HTML = '<html><head><title>Example</title></head><body><p>Hello</p></body></html>';

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateFetcher.mockResolvedValue(mockFetcher);
});

describe('webToMarkdownHandler — 정상 변환', () => {
  it('제목 + 마크다운 반환', async () => {
    mockFetcher.fetch.mockResolvedValue(SAMPLE_HTML);
    mockConvert.mockReturnValue({ title: 'Example', markdown: SAMPLE_CONTENT });

    const result = await webToMarkdownHandler({ url: 'https://example.com' });

    expect(result).toContain('# Example');
    expect(result).toContain(SAMPLE_CONTENT);
  });

  it('제목 없으면 # prefix 없이 마크다운만 반환', async () => {
    mockFetcher.fetch.mockResolvedValue(SAMPLE_HTML);
    mockConvert.mockReturnValue({ title: '', markdown: SAMPLE_CONTENT });

    const result = await webToMarkdownHandler({ url: 'https://example.com' });

    expect(result).toBe(SAMPLE_CONTENT);
    expect(result.startsWith('#')).toBe(false);
  });

  it('playwright 여부에 따라 자동으로 fetcher 선택', async () => {
    mockFetcher.fetch.mockResolvedValue(SAMPLE_HTML);
    mockConvert.mockReturnValue({ title: '', markdown: 'md' });

    await webToMarkdownHandler({ url: 'https://example.com' });

    expect(mockCreateFetcher).toHaveBeenCalledWith();
  });
});

describe('webToMarkdownHandler — summaryLevel', () => {
  it('summaryLevel 지정 시 요약 결과 반환', async () => {
    mockFetcher.fetch.mockResolvedValue(SAMPLE_HTML);
    mockConvert.mockReturnValue({ title: 'Example', markdown: SAMPLE_CONTENT });
    mockSummarize.mockResolvedValue('요약된 내용');

    const result = await webToMarkdownHandler({ url: 'https://example.com', summaryLevel: 3 });

    expect(result).toBe('요약된 내용');
    expect(mockSummarize).toHaveBeenCalledWith(`# Example\n\n${SAMPLE_CONTENT}`, 3);
  });

  it('summaryLevel=1 은 최소 요약 호출', async () => {
    mockFetcher.fetch.mockResolvedValue(SAMPLE_HTML);
    mockConvert.mockReturnValue({ title: 'Test', markdown: SAMPLE_CONTENT });
    mockSummarize.mockResolvedValue('매우 짧은 요약');

    const result = await webToMarkdownHandler({ url: 'https://example.com', summaryLevel: 1 });

    expect(mockSummarize).toHaveBeenCalledWith(`# Test\n\n${SAMPLE_CONTENT}`, 1);
    expect(result).toBe('매우 짧은 요약');
  });

  it('summaryLevel 없으면 요약 안 함', async () => {
    mockFetcher.fetch.mockResolvedValue(SAMPLE_HTML);
    mockConvert.mockReturnValue({ title: 'T', markdown: SAMPLE_CONTENT });

    await webToMarkdownHandler({ url: 'https://example.com' });

    expect(mockSummarize).not.toHaveBeenCalled();
  });
});

describe('webToMarkdownHandler — 에러 처리', () => {
  it('InvalidUrlError → "Error: ... invalid" 문자열 반환', async () => {
    mockFetcher.fetch.mockRejectedValue(new InvalidUrlError('ftp://bad'));

    const result = await webToMarkdownHandler({ url: 'ftp://bad' });

    expect(result.startsWith('Error:')).toBe(true);
    expect(result.toLowerCase()).toContain('invalid');
  });

  it('FetchFailedError → "Error: Failed to fetch" 문자열 반환', async () => {
    mockFetcher.fetch.mockRejectedValue(new FetchFailedError('https://fail.com', new Error('timeout')));

    const result = await webToMarkdownHandler({ url: 'https://fail.com' });

    expect(result.startsWith('Error:')).toBe(true);
    expect(result.toLowerCase()).toContain('fetch');
  });

  it('예상치 못한 에러 → "Error: ... unexpected" 문자열 반환', async () => {
    mockFetcher.fetch.mockRejectedValue(new Error('Something went wrong'));

    const result = await webToMarkdownHandler({ url: 'https://example.com' });

    expect(result.startsWith('Error:')).toBe(true);
    expect(result.toLowerCase()).toContain('unexpected');
  });
});

describe('webToMarkdownHandler — 제목 sanitization', () => {
  it('제목 내 줄바꿈 문자 제거', async () => {
    mockFetcher.fetch.mockResolvedValue(SAMPLE_HTML);
    mockConvert.mockReturnValue({ title: 'Title\nWith\nNewlines', markdown: 'content' });

    const result = await webToMarkdownHandler({ url: 'https://example.com' });

    expect(result).not.toContain('\n# ');
    // 헤딩 줄은 하나여야 함
    const headingLine = result.split('\n').find(l => l.startsWith('# '));
    expect(headingLine).toBeDefined();
    expect(headingLine).not.toContain('\n');
  });
});

describe('webToMarkdownHandler — debug 로그', () => {
  it('debug 옵션이 없으면 debug 로그를 포함하지 않음', async () => {
    mockFetcher.fetch.mockResolvedValue(SAMPLE_HTML);
    mockConvert.mockReturnValue({ title: 'Example', markdown: SAMPLE_CONTENT });

    const result = await webToMarkdownHandler({ url: 'https://example.com' });

    expect(result).not.toContain('[web2md-debug]');
  });

  it('debug=true면 사용자 응답에 런타임 로그 포함', async () => {
    mockFetcher.fetch.mockResolvedValue(SAMPLE_HTML);
    mockConvert.mockReturnValue({ title: 'Example', markdown: SAMPLE_CONTENT });

    const result = await webToMarkdownHandler({ url: 'https://example.com/path?a=token', debug: true });

    expect(result).toContain('[web2md-debug]');
    expect(result).toContain('- url: https://example.com/path');
    expect(result).not.toContain('a=token');
    expect(result).toContain('- fetcher: MockPlaywrightFetcher');
    expect(result).toContain('- status: success');
    expect(result).toContain('# Example');
  });

  it('debug=true + summaryLevel이면 요약 결과와 로그 함께 반환', async () => {
    mockFetcher.fetch.mockResolvedValue(SAMPLE_HTML);
    mockConvert.mockReturnValue({ title: 'Example', markdown: SAMPLE_CONTENT });
    mockSummarize.mockResolvedValue('요약된 내용');

    const result = await webToMarkdownHandler({ url: 'https://example.com', summaryLevel: 3, debug: true });

    expect(result).toContain('[web2md-debug]');
    expect(result).toContain('- summaryLevel: 3');
    expect(result).toContain('요약된 내용');
  });

  it('debug=true + 에러면 상태/에러명 로그 포함', async () => {
    mockFetcher.fetch.mockRejectedValue(new InvalidUrlError('ftp://bad'));

    const result = await webToMarkdownHandler({ url: 'ftp://bad', debug: true });

    expect(result).toContain('[web2md-debug]');
    expect(result).toContain('- status: invalid_url');
    expect(result).toContain('- error: InvalidUrlError');
    expect(result).toContain('Error: The provided URL is invalid');
  });

  it('debug=true + FetchFailedError면 fetch_failed 상태를 포함', async () => {
    mockFetcher.fetch.mockRejectedValue(new FetchFailedError('https://fail.com', new Error('timeout')));

    const result = await webToMarkdownHandler({ url: 'https://fail.com', debug: true });

    expect(result).toContain('[web2md-debug]');
    expect(result).toContain('- status: fetch_failed');
    expect(result).toContain('- error: FetchFailedError');
    expect(result).toContain('Error: Failed to fetch the web page');
  });

  it('debug=true + 예상치 못한 에러면 unexpected_error 상태를 포함', async () => {
    mockFetcher.fetch.mockRejectedValue(new Error('boom'));

    const result = await webToMarkdownHandler({ url: 'https://example.com', debug: true });

    expect(result).toContain('[web2md-debug]');
    expect(result).toContain('- status: unexpected_error');
    expect(result).toContain('- error: Error');
    expect(result).toContain('Error: An unexpected error occurred');
  });
});
